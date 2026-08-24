/**
 * OpenAI-compatible streaming provider.
 *
 * Works against OpenAI, OpenRouter, Azure, and any /v1/chat/completions
 * compatible endpoint. This is the default provider because it covers the
 * most providers with a single code path.
 */

import type { ChatMessage, LLMProvider, StreamChunk } from "../index";
import { requireKey, env } from "../../config/env";

export class OpenAICompatibleProvider implements LLMProvider {
  readonly id = "openai";
  readonly name = "OpenAI";
  readonly models = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "o3-mini",
    "o4-mini",
  ] as const;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = requireKey("openai");
    this.baseUrl = env.openaiBaseUrl || "https://api.openai.com/v1";
  }

  async *streamChat(
    messages: ChatMessage[],
    options: { systemPrompt?: string; temperature?: number; maxTokens?: number; signal?: AbortSignal },
  ): AsyncIterable<StreamChunk> {
    const fullMessages: ChatMessage[] = [];
    if (options.systemPrompt && options.systemPrompt.trim().length > 0) {
      fullMessages.push({ role: "system", content: options.systemPrompt });
    }
    fullMessages.push(...messages);

    const resp = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: fullMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        stream: true,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`OpenAI request failed (${resp.status}): ${text || resp.statusText}`);
    }
    if (!resp.body) throw new Error("OpenAI response body was empty");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE frames
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep partial line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            yield { text: "", done: true };
            return;
          }
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) yield { text: delta, done: false };
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    yield { text: "", done: true };
  }
}