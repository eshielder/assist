/**
 * AI / LLM provider abstraction.
 *
 * The chat and voice agents both depend on this interface so that the UI never
 * knows which concrete provider is wired up. To add a new provider:
 *  1. Create a new file under lib/ai/providers/<name>.ts
 *  2. Export a factory that returns an LLMProvider
 *  3. Register it in lib/ai/providers/registry.ts
 *
 * API keys are read server-side only (see lib/config/env.ts).
 */

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly models: readonly string[];
  /** Streaming completion. Yields text deltas until done. */
  streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
  ): AsyncIterable<StreamChunk>;
}

export type { StreamChunk as LLMStreamChunk };