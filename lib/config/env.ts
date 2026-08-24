/**
 * Centralized, server-side-only access to environment configuration.
 *
 * This module MUST NOT be imported by any client component. It reads secrets
 * from process.env at runtime and exposes them to provider modules.
 */

type ProviderConfig = {
  apiKey: string | undefined;
  baseUrl: string | undefined;
};

function readEnv(name: string): string | undefined {
  // On the server we read directly. On the client these are undefined,
  // which is intentional — secrets never reach the browser.
  if (typeof process === "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  // ---- LLM providers ----
  openaiApiKey: readEnv("OPENAI_API_KEY"),
  openaiBaseUrl: readEnv("OPENAI_BASE_URL"),
  anthropicApiKey: readEnv("ANTHROPIC_API_KEY"),
  anthropicBaseUrl: readEnv("ANTHROPIC_BASE_URL"),
  googleApiKey: readEnv("GOOGLE_API_KEY"),
  openrouterApiKey: readEnv("OPENROUTER_API_KEY"),
  openrouterBaseUrl: readEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1",
  // ---- STT providers ----
  openaiSttApiKey: readEnv("OPENAI_API_KEY"),
  deepgramApiKey: readEnv("DEEPGRAM_API_KEY"),
  // ---- TTS providers ----
  openaiTtsApiKey: readEnv("OPENAI_API_KEY"),
  elevenLabsApiKey: readEnv("ELEVENLABS_API_KEY"),
  // ---- Misc ----
  appUrl: readEnv("APP_URL") || "http://localhost:3000",
  nodeEnv: readEnv("NODE_ENV") || "development",
} as const;

export function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("lib/config/env.ts must not be imported on the client");
  }
}

export function providerConfig(name: string): ProviderConfig {
  switch (name) {
    case "openai":
      return { apiKey: env.openaiApiKey, baseUrl: env.openaiBaseUrl };
    case "anthropic":
      return { apiKey: env.anthropicApiKey, baseUrl: env.anthropicBaseUrl };
    case "google":
      return { apiKey: env.googleApiKey, baseUrl: undefined };
    case "openrouter":
      return { apiKey: env.openrouterApiKey, baseUrl: env.openrouterBaseUrl };
    default:
      return { apiKey: undefined, baseUrl: undefined };
  }
}

export function requireKey(name: string): string {
  const cfg = providerConfig(name);
  if (!cfg.apiKey) {
    throw new Error(
      `Missing API key for provider "${name}". Set the corresponding env var.`,
    );
  }
  return cfg.apiKey;
}