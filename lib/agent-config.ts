/**
 * Agent configuration — persisted in localStorage.
 *
 * A single source of truth shared by the chat and voice agents so that
 * changing the model/voice/system prompt in Settings applies everywhere.
 */

export interface AgentConfig {
  // Identity
  name: string;
  systemPrompt: string;
  // LLM
  llmProvider: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  responseStyle: "concise" | "balanced" | "detailed";
  // STT
  sttProvider: string;
  sttModel: string;
  sttLanguage: string;
  // TTS
  ttsProvider: string;
  ttsModel: string;
  ttsVoice: string;
  ttsLanguage: string;
  ttsSpeed: number;
  // Voice behavior
  voiceMode: "push-to-talk" | "hands-free";
}

export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful, concise, and friendly AI assistant. Answer clearly and directly. Use markdown for formatting when helpful.";

export const DEFAULT_CONFIG: AgentConfig = {
  name: "Assistant",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  llmProvider: "openai",
  llmModel: "gpt-4o",
  temperature: 0.7,
  maxTokens: 1024,
  responseStyle: "balanced",
  sttProvider: "openai",
  sttModel: "whisper-1",
  sttLanguage: "en",
  ttsProvider: "openai",
  ttsModel: "tts-1",
  ttsVoice: "alloy",
  ttsLanguage: "en",
  ttsSpeed: 1.0,
  voiceMode: "push-to-talk",
};

const STORAGE_KEY = "agent-lab:config:v1";

export function loadConfig(): AgentConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AgentConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export function responseStyleMultiplier(style: AgentConfig["responseStyle"]): number {
  switch (style) {
    case "concise":
      return 256;
    case "detailed":
      return 2048;
    default:
      return 1024;
  }
}

export function stylePrompt(style: AgentConfig["responseStyle"]): string {
  switch (style) {
    case "concise":
      return "Keep answers short and to the point. Prefer bullet points.";
    case "detailed":
      return "Provide thorough, well-structured answers with examples.";
    default:
      return "Balance brevity with completeness.";
  }
}