/**
 * Provider registry.
 *
 * Maps provider ids to factory functions. The UI only ever references provider
 * ids — concrete implementations are swapped here, in one place.
 */

import type { LLMProvider } from "../index";
import { OpenAICompatibleProvider } from "./openai";

export type LLMProviderFactory = () => LLMProvider;

const factories: Record<string, LLMProviderFactory> = {
  openai: () => new OpenAICompatibleProvider(),
};

// A provider is "available" only if its required env vars are configured.
export function availableLLMProviders(): string[] {
  return Object.keys(factories).filter((id) => {
    try {
      factories[id]();
      return true;
    } catch {
      return false;
    }
  });
}

export function getLLMProvider(id: string): LLMProvider {
  const factory = factories[id];
  if (!factory) {
    throw new Error(`Unknown LLM provider: ${id}`);
  }
  return factory();
}

export function registerLLMProvider(id: string, factory: LLMProviderFactory): void {
  factories[id] = factory;
}

export const DEFAULT_LLM_PROVIDER = "openai";
export const DEFAULT_LLM_MODEL = "gpt-4o";