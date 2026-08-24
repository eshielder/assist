import type { TTSProvider } from "../index";
import { OpenAITTSProvider } from "./openai";

export type TTSProviderFactory = () => TTSProvider;

const factories: Record<string, TTSProviderFactory> = {
  openai: () => new OpenAITTSProvider(),
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

export const DEFAULT_TTS_PROVIDER = "openai";
export const DEFAULT_TTS_MODEL = "tts-1";
export const DEFAULT_TTS_VOICE = "alloy";