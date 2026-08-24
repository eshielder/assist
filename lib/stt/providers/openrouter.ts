/**
 * OpenRouter STT provider using Deepgram models.
 */

import type { STTProvider, STTOptions, STTResult } from "../index";
import { env } from "../../config/env";

export class OpenRouterSTTProvider implements STTProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter STT";
  readonly models = ["deepgram/nova", "deepgram/phoenix", "deepgram/zhika"] as const;
  readonly languages = [
    "en", "es", "fr", "de", "it", "pt", "nl", "pl", "tr", "ru",
    "zh", "ja", "ko", "vi", "th", "hi", "ar", "sv", "da", "no",
    "fi", "cs", "sk", "ro", "hu", "el", "uk", "id", "ms", "fa",
  ] as const;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const key = env.openrouterApiKey;
    if (!key) throw new Error("OPENROUTER_API_KEY not set");
    this.apiKey = key;
    this.baseUrl = env.openrouterBaseUrl || "https://openrouter.ai/api/v1";
  }

  async transcribe(audio: Blob, options: STTOptions): Promise<STTResult> {
    const form = new FormData();
    form.append("file", audio, "audio.webm");
    form.append("model", options.model ?? "deepgram/nova");
    if (options.language) form.append("language", options.language);

    const resp = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      signal: options.signal,
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`OpenRouter STT failed (${resp.status}): ${text || resp.statusText}`);
    }

    const json = await resp.json();
    return {
      text: (json?.text as string) ?? "",
      language: json?.language as string | undefined,
    };
  }
}