/**
 * Voice session hook.
 *
 * Wraps the AsyncVoicePipeline transport and exposes a clean imperative
 * API plus reactive state. The UI only ever talks to this hook.
 */

import { useEffect, useRef, useState } from "react";
import { AsyncVoicePipeline } from "@/lib/webrtc/asyncPipeline";
import type { VoiceSession, VoiceState, VoiceSessionConfig } from "@/lib/webrtc";
import { useAgentConfig } from "@/components/agent/agent-config-provider";
import { responseStyleMultiplier, stylePrompt } from "@/lib/agent-config";
import toast from "react-hot-toast";

export interface TranscriptEntry {
  id: string;
  speaker: "user" | "assistant";
  text: string;
}

export function useVoiceSession() {
  const { config } = useAgentConfig();
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const voiceConfig: VoiceSessionConfig = {
    systemPrompt: config.systemPrompt + "\n\n" + stylePrompt(config.responseStyle),
    model: config.llmModel,
    temperature: config.temperature,
    maxTokens: responseStyleMultiplier(config.responseStyle),
    sttProvider: config.sttProvider,
    sttModel: config.sttModel,
    sttLanguage: config.sttLanguage,
    ttsProvider: config.ttsProvider,
    ttsModel: config.ttsModel,
    ttsVoice: config.ttsVoice,
    ttsLanguage: config.ttsLanguage,
    voiceMode: config.voiceMode,
    endpoints: {
      stt: "/api/voice/stt",
      llm: "/api/chat",
      tts: "/api/voice/tts",
    },
  };

  useEffect(() => {
    const session = new AsyncVoicePipeline();
    sessionRef.current = session;

    const unsubState = session.onStateChange(setState);
    const unsubErr = session.onError((e) => {
      setError(e.message);
      toast.error(e.message);
    });

    // Track live transcript lines.
    let pendingUser = "";
    const unsubT = session.onTranscript((text, isFinal) => {
      if (text.startsWith("> ")) {
        // assistant partial/final
        const t = text.slice(2);
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.speaker === "assistant") {
            return [...prev.slice(0, -1), { ...last, text: t }];
          }
          return [...prev, { id: uid(), speaker: "assistant", text: t }];
        });
      } else {
        pendingUser = text;
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.speaker === "user") {
            return [...prev.slice(0, -1), { ...last, text }];
          }
          return [...prev, { id: uid(), speaker: "user", text }];
        });
      }
    });

    return () => {
      unsubState();
      unsubErr();
      unsubT();
      session.stop();
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setError(null);
    try {
      await sessionRef.current?.start(voiceConfig);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start";
      setError(msg);
      toast.error(msg);
    }
  };

  const stop = () => {
    sessionRef.current?.stop();
    setTranscript([]);
    setError(null);
  };

  const interrupt = () => sessionRef.current?.interrupt();

  return {
    state,
    transcript,
    error,
    start,
    stop,
    interrupt,
    isIdle: state === "idle",
    isListening: state === "listening",
    isThinking: state === "thinking",
    isSpeaking: state === "speaking",
    isError: state === "error",
  };
}

let counter = 0;
function uid() {
  return `ve-${++counter}-${Math.random().toString(36).slice(2, 6)}`;
}