/**
 * Default async voice pipeline transport.
 *
 *   Mic audio → POST /api/voice/stt → transcript
 *   transcript + history → POST /api/chat (stream) → assistant text
 *   assistant text → POST /api/voice/tts → audio blob → speaker
 *
 * This is the universal fallback that works with any provider combination.
 */

import type { VoiceSession, VoiceSessionConfig, VoiceState } from "./index";

type Listener<T> = (value: T) => void;

function makeEmitter<T>() {
  const listeners: Listener<T>[] = [];
  return {
    emit: (v: T) => listeners.forEach((l) => l(v)),
    on: (l: Listener<T>) => {
      listeners.push(l);
      return () => {
        const i = listeners.indexOf(l);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
}

export class AsyncVoicePipeline implements VoiceSession {
  private config!: VoiceSessionConfig;
  private state: VoiceState = "idle";
  private stateEmitter = makeEmitter<VoiceState>();
  private transcriptEmitter = makeEmitter<string>();
  private errorEmitter = makeEmitter<Error>();
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private stopRequested = false;
  private conversation: Array<{ role: "user" | "assistant"; content: string }> = [];

  async start(config: VoiceSessionConfig): Promise<void> {
    if (this.state !== "idle") throw new Error("Session already started");
    this.config = config;
    this.stopRequested = false;
    this.conversation = [];

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });
    } catch (err) {
      this.fail(err as Error);
      return;
    }

    this.setState("listening");
    this.startCapture();
  }

  private startCapture(): void {
    if (!this.mediaStream) return;
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(this.mediaStream, { mimeType: "audio/webm;codecs=opus" });
    } catch {
      recorder = new MediaRecorder(this.mediaStream);
    }
    this.mediaRecorder = recorder;

    recorder.ondataavailable = async (e) => {
      if (!e.data || e.data.size === 0) return;
      const buf = await e.data.arrayBuffer();
      this.sendAudio(buf);
    };
    recorder.onerror = () => this.fail(new Error("MediaRecorder error"));
    recorder.start(200);
  }

  sendAudio(chunk: ArrayBuffer): void {
    this.handleAudioChunk(chunk);
  }

  private async handleAudioChunk(chunk: ArrayBuffer): Promise<void> {
    if (this.state === "speaking" && this.config.voiceMode === "hands-free") {
      this.interrupt();
    }
    this.setState("listening");

    try {
      const blob = new Blob([chunk], { type: "audio/webm" });
      const form = new FormData();
      form.append("file", blob, "audio.webm");
      if (this.config.sttLanguage) form.append("language", this.config.sttLanguage);
      if (this.config.sttModel) form.append("model", this.config.sttModel);

      const sttResp = await fetch(this.config.endpoints.stt, {
        method: "POST",
        body: form,
      });
      if (!sttResp.ok) {
        const t = await sttResp.text().catch(() => "");
        throw new Error(`STT failed (${sttResp.status}): ${t || sttResp.statusText}`);
      }
      const sttData = await sttResp.json();
      const text = (sttData?.text as string)?.trim();
      if (!text) return;

      this.emitTranscript(text, true);

      this.conversation.push({ role: "user", content: text });
      this.setState("thinking");

      // Stream LLM response
      const llmResp = await fetch(this.config.endpoints.llm, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: this.conversation.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: this.config.systemPrompt,
          temperature: this.config.temperature ?? 0.7,
          maxTokens: this.config.maxTokens ?? 1024,
          model: this.config.model,
        }),
      });
      if (!llmResp.ok) {
        const t = await llmResp.text().catch(() => "");
        throw new Error(`LLM failed (${llmResp.status}): ${t || llmResp.statusText}`);
      }
      if (!llmResp.body) throw new Error("LLM response body was empty");

      const reader = llmResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              if (firstToken) {
                this.setState("speaking");
                firstToken = false;
              }
              this.emitTranscript(`> ${assistantText}`, false);
            }
          } catch {
            /* ignore */
          }
        }
      }
      reader.releaseLock();

      if (!assistantText) return;
      this.conversation.push({ role: "assistant", content: assistantText });

      // Synthesize TTS
      const ttsResp = await fetch(this.config.endpoints.tts, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: assistantText,
          voice: this.config.ttsVoice,
          model: this.config.ttsModel,
          language: this.config.ttsLanguage,
          speed: 1.0,
        }),
      });
      if (!ttsResp.ok) {
        const t = await ttsResp.text().catch(() => "");
        throw new Error(`TTS failed (${ttsResp.status}): ${t || ttsResp.statusText}`);
      }
      const ttsJson = await ttsResp.json();
      const audioUrl = ttsJson?.url as string | undefined;
      if (!audioUrl) throw new Error("TTS response missing audio url");

      await this.playAudio(audioUrl);
    } catch (err) {
      this.fail(err as Error);
    }
  }

  private async playAudio(url: string): Promise<void> {
    this.setState("speaking");
    const audio = new Audio(url);
    audio.preload = "auto";
    this.activeAudio = audio;

    await new Promise<void>((resolve) => {
      if (this.stopRequested) {
        resolve();
        return;
      }
      audio.onended = () => {
        this.activeAudio = null;
        resolve();
      };
      audio.onerror = () => {
        this.activeAudio = null;
        resolve();
      };
      audio.play().catch(() => resolve());
    });

    if (!this.stopRequested && this.config.voiceMode === "hands-free") {
      this.setState("listening");
    } else if (!this.stopRequested) {
      this.setState("idle");
    }
  }

  interrupt(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {
        /* ignore */
      }
      this.activeAudio = null;
    }
  }

  stop(): void {
    this.stopRequested = true;
    try {
      this.mediaRecorder?.stop();
    } catch {
      /* ignore */
    }
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
      } catch {
        /* ignore */
      }
      this.activeAudio = null;
    }
    this.setState("idle");
  }

  private setState(s: VoiceState): void {
    if (this.stopRequested && s !== "idle") return;
    this.state = s;
    this.stateEmitter.emit(s);
  }

  getState(): VoiceState {
    return this.state;
  }
  onStateChange(cb: (state: VoiceState) => void): () => void {
    return this.stateEmitter.on(cb);
  }
  onTranscript(cb: (text: string, isFinal: boolean) => void): () => void {
    return this.transcriptEmitter.on((t) => cb(t, true));
  }
  onAudio(cb: (chunk: ArrayBuffer) => void): () => void {
    return () => {};
  }
  onError(cb: (err: Error) => void): () => void {
    return this.errorEmitter.on(cb);
  }

  private emitTranscript(text: string, _isFinal: boolean): void {
    this.transcriptEmitter.emit(text);
  }

  private fail(err: Error): void {
    this.errorEmitter.emit(err);
    this.setState("error");
  }
}