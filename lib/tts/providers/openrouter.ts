/**
 * OpenRouter TTS provider using Flux-TTS and other compatible models.
 *
 * OpenRouter now provides audio endpoints at /v1/audio/speech
 * Models available: deepgram/flux-tts:free, etc.
 */

import type { TTSProvider, TTSOptions, TTSResult, TTSVoice } from "../index";
import { env } from "../../config/env";

export class OpenRouterTTSProvider implements TTSProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter TTS";
  readonly models = ["deepgram/flux-tts:free", "openai-tts", "anthropic-tts"] as const;
  readonly voices: readonly TTSVoice[] = [
    { id: "flux-alexis-en", name: "Flux Alexis (EN)", language: "en", gender: "female" },
    { id: "flux-emotional-en", name: "Flux Emotional (EN)", language: "en", gender: "female" },
    { id: "flux-afro-en", name: "Flux Afro (EN)", language: "en", gender: "male" },
  ];

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const key = env.openrouterApiKey;
    if (!key) throw new Error("OPENROUTER_API_KEY not set");
    this.apiKey = key;
    this.baseUrl = env.openrouterBaseUrl || "https://openrouter.ai/api/v1";
  }

  async synthesize(text: string, options: TTSOptions): Promise<TTSResult> {
    const resp = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": env.appUrl || "http://localhost:3000",
        "X-Title": "Agent Interaction Lab",
      },
      body: JSON.stringify({
        model: options.model ?? "deepgram/flux-tts:free",
        voice: options.voice ?? "flux-alexis-en",
        input: text,
        speed: options.speed ?? 1.0,
      }),
    });

    if (!resp.ok) {
      const text2 = await resp.text().catch(() => "");
      throw new Error(`OpenRouter TTS failed (${resp.status}): ${text2 || resp.statusText}`);
    }

    const arrayBuffer = await resp.arrayBuffer();
    const audio = new Blob([arrayBuffer], { type: "audio/wav" });
    return { audio, format: "audio/wav" };
  }
}