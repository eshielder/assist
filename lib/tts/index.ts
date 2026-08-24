/**
 * Text-to-speech provider abstraction.
 *
 * Two shapes are supported:
 *  - `synthesize`: returns a complete audio Blob (simple, universal).
 *  - `streamSynthesize`: yields raw audio chunks as they arrive, enabling
 *    low-latency playback without waiting for the full file.
 */

export interface TTSProvider {
  readonly id: string;
  readonly name: string;
  readonly models: readonly string[];
  readonly voices: readonly TTSVoice[];
  /** Synthesize a complete audio blob. */
  synthesize(text: string, options: TTSOptions): Promise<TTSResult>;
  /** Optional streaming synthesis. Chunks are raw PCM or container bytes. */
  streamSynthesize?(
    text: string,
    options: TTSOptions,
  ): AsyncIterable<ArrayBuffer>;
}

export interface TTSVoice {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
}

export interface TTSOptions {
  voice?: string;
  model?: string;
  language?: string;
  speed?: number;
  signal?: AbortSignal;
  format?: "mp3" | "wav" | "pcm";
}

export interface TTSResult {
  audio: Blob;
  format: string;
  durationMs?: number;
}