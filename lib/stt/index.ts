/**
 * Speech-to-text provider abstraction.
 *
 * Implementations receive raw audio (Blob) and return a transcript string.
 * Real-time streaming providers may also expose a streaming variant.
 */

export interface STTProvider {
  readonly id: string;
  readonly name: string;
  readonly models: readonly string[];
  readonly languages: readonly string[];
  /** Transcribe a complete audio blob. */
  transcribe(audio: Blob, options: STTOptions): Promise<STTResult>;
  /** Optional streaming transcription (chunked audio). */
  streamTranscribe?(
    chunks: AsyncIterable<ArrayBuffer>,
    options: STTOptions,
  ): AsyncIterable<string>;
}

export interface STTOptions {
  language?: string;
  model?: string;
  signal?: AbortSignal;
}

export interface STTResult {
  text: string;
  language?: string;
  durationMs?: number;
}