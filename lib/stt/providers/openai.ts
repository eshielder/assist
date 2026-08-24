/**
 * OpenAI Whisper STT provider.
 *
 * Whisper is the most broadly compatible STT model and works well as a
 * fallback. Audio is POSTed as multipart/form-data to the server route
 * (lib/stt never touches the client directly).
 */

import type { STTProvider, STTOptions, STTResult } from "../index";
import { requireKey, env } from "../../config/env";

export class OpenAISTTProvider implements STTProvider {
  readonly id = "openai";
  readonly name = "OpenAI Whisper";
  readonly models = ["whisper-1"] as const;
  readonly languages = [
    "en", "es", "fr", "de", "it", "pt", "nl", "pl", "tr", "ru",
    "zh", "ja", "ko", "vi", "th", "hi", "ar", "sv", "da", "no",
    "fi", "cs", "sk", "ro", "hu", "el", "uk", "id", "ms", "fa",
  ] as const;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = requireKey("openai");
    this.baseUrl = env.openaiBaseUrl || "https://api.openai.com/v1";
  }

  async transcribe(audio: Blob, options: STTOptions): Promise<STTResult> {
    const form = new FormData();
    form.append("file", audio, "audio.webm");
    form.append("model", options.model ?? "whisper-1");
    if (options.language) form.append("language", options.language);
    form.append("response_format", "json");

    const resp = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      signal: options.signal,
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Whisper STT failed (${resp.status}): ${text || resp.statusText}`);
    }
    const json = await resp.json();
    return {
      text: (json?.text as string) ?? "",
      language: json?.language as string | undefined,
    };
  }
}