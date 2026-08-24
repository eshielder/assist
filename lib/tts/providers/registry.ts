import type { TTSProvider } from "../index";
import { OpenAITTSProvider } from "./openai";
import { OpenRouterTTSProvider } from "./openrouter";

export type TTSProviderFactory = () => TTSProvider;

const factories: Record<string, TTSProviderFactory> = {
  openai: () => new OpenAITTSProvider(),
  openrouter: () => new OpenRouterTTSProvider(),
};

export function availableTTSProviders(): string[] {
  return Object.keys(factories).filter((id) => {
    try {
      factories[id]();
      return true;
    } catch {
      return false;
    }
  });
}

export function getTTSProvider(id: string): TTSProvider {
  const f = factories[id];
  if (!f) throw new Error(`Unknown TTS provider: ${id}`);
  return f();
}

export function registerTTSProvider(id: string, factory: TTSProviderFactory): void {
  factories[id] = factory;
}

export const DEFAULT_TTS_PROVIDER = "openrouter";
export const DEFAULT_TTS_MODEL = "deepgram/flux-tts:free";
export const DEFAULT_TTS_VOICE = "flux-alexis-en";