/**
 * OpenAI TTS provider (tts-1 / tts-1-hd).
 */

import type { TTSProvider, TTSOptions, TTSResult, TTSVoice } from "../index";
import { requireKey, env } from "../../config/env";

export class OpenAITTSProvider implements TTSProvider {
  readonly id = "openai";
  readonly name = "OpenAI TTS";
  readonly models = ["tts-1", "tts-1-hd"] as const;
  readonly voices: readonly TTSVoice[] = [
    { id: "alloy", name: "Alloy", gender: "neutral" },
    { id: "echo", name: "Echo", gender: "male" },
    { id: "fable", name: "Fable", gender: "female" },
    { id: "onyx", name: "Onyx", gender: "male" },
    { id: "nova", name: "Nova", gender: "female" },
    { id: "shimmer", name: "Shimmer", gender: "female" },
  ];

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = requireKey("openai");
    this.baseUrl = env.openaiBaseUrl || "https://api.openai.com/v1";
  }

  async synthesize(text: string, options: TTSOptions): Promise<TTSResult> {
    const resp = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? "tts-1",
        voice: options.voice ?? "alloy",
        input: text,
        speed: options.speed ?? 1.0,
        response_format: options.format ?? "mp3",
      }),
    });

    if (!resp.ok) {
      const text2 = await resp.text().catch(() => "");
      throw new Error(`OpenAI TTS failed (${resp.status}): ${text2 || resp.statusText}`);
    }

    const audio = await resp.blob();
    return { audio, format: audio.type || "audio/mpeg" };
  }
}