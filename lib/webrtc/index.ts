/**
 * WebRTC / real-time transport abstraction.
 *
 * The default implementation is the async pipeline
 *   Mic → STT → LLM → TTS → Speaker
 * which works everywhere with no special setup.
 *
 * A real-time WebRTC provider (e.g. OpenAI Realtime, Gemini Live) can be
 * implemented by providing a `RealtimeVoiceTransport` and registering it.
 * The voice agent UI talks to a single `VoiceSession` interface regardless.
 */

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface VoiceSession {
  /** Start a voice session. Returns once the transport is ready. */
  start(config: VoiceSessionConfig): Promise<void>;
  /** Stop everything and clean up. */
  stop(): void;
  /** Push a chunk of microphone audio into the transport. */
  sendAudio(chunk: ArrayBuffer): void;
  /** Cancel any in-progress assistant speech. */
  interrupt(): void;
  /** Current connection state. */
  getState(): VoiceState;
  /** Subscribe to state changes. */
  onStateChange(cb: (state: VoiceState) => void): () => void;
  /** Subscribe to partial/final transcripts. */
  onTranscript(cb: (text: string, isFinal: boolean) => void): () => void;
  /** Subscribe to assistant audio output. */
  onAudio(cb: (chunk: ArrayBuffer) => void): () => void;
  /** Subscribe to errors. */
  onError(cb: (err: Error) => void): () => void;
}

export interface VoiceSessionConfig {
  systemPrompt: string;
  model: string;
  sttProvider: string;
  sttModel?: string;
  sttLanguage?: string;
  ttsProvider: string;
  ttsModel?: string;
  ttsVoice: string;
  ttsLanguage?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
  voiceMode?: "push-to-talk" | "hands-free";
  handsFree?: boolean; // Deprecated: use voiceMode
  // The async pipeline uses these endpoints to reach the server routes.
  endpoints: {
    stt: string;
    llm: string;
    tts: string;
  };
}

/** A factory for creating a transport. Implementations may be async. */
export type VoiceTransportFactory = (config: VoiceSessionConfig) => VoiceSession;