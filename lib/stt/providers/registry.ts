import type { STTProvider } from "../index";
import { OpenAISTTProvider } from "./openai";
import { OpenRouterSTTProvider } from "./openrouter";

export type STTProviderFactory = () => STTProvider;

const factories: Record<string, STTProviderFactory> = {
  openai: () => new OpenAISTTProvider(),
  openrouter: () => new OpenRouterSTTProvider(),
};

export function availableSTTProviders(): string[] {
  return Object.keys(factories).filter((id) => {
    try {
      factories[id]();
      return true;
    } catch {
      return false;
    }
  });
}

export function getSTTProvider(id: string): STTProvider {
  const f = factories[id];
  if (!f) throw new Error(`Unknown STT provider: ${id}`);
  return f();
}

export function registerSTTProvider(id: string, factory: STTProviderFactory): void {
  factories[id] = factory;
}

export const DEFAULT_STT_PROVIDER = "openai";
export const DEFAULT_STT_MODEL = "whisper-1";