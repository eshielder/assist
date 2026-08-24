"use client";

import { useEffect, useState } from "react";
import { useAgentConfig } from "@/components/agent/agent-config-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

const LLM_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "o3-mini", label: "o3-mini" },
  { value: "o4-mini", label: "o4-mini" },
];

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "tr", label: "Turkish" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "vi", label: "Vietnamese" },
  { value: "th", label: "Thai" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
];

const STYLE_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

const MODE_OPTIONS = [
  { value: "push-to-talk", label: "Push to talk" },
  { value: "hands-free", label: "Hands-free" },
];

export function SettingsForm() {
  const { config, setConfig, resetConfig } = useAgentConfig();
  const [draft, setDraft] = useState(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const save = () => {
    setConfig(() => ({ ...draft }));
    toast.success("Settings saved");
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const Field = ({
    label,
    hint,
    children,
  }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your AI agent. Changes apply to both chat and voice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetConfig}>
            Reset
          </Button>
          <Button variant="voice" onClick={save}>
            Save
          </Button>
        </div>
      </div>

      <Section title="Identity">
        <Field label="Agent name">
          <Input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Assistant"
          />
        </Field>
        <Field label="System instructions" hint="Guides the LLM's behavior.">
          <Textarea
            value={draft.systemPrompt}
            onChange={(e) => set("systemPrompt", e.target.value)}
            rows={4}
            placeholder="You are a helpful assistant…"
          />
        </Field>
      </Section>

      <Section title="LLM (Language Model)">
        <Field label="Model" hint="Provider: OpenAI-compatible.">
          <Select
            value={draft.llmModel}
            onChange={(v) => set("llmModel", v)}
            options={LLM_OPTIONS}
          />
        </Field>
        <Field label="Temperature" hint="0 = deterministic, 2 = creative.">
          <Input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={draft.temperature}
            onChange={(e) => set("temperature", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Response style">
          <Select
            value={draft.responseStyle}
            onChange={(v) => set("responseStyle", v as any)}
            options={STYLE_OPTIONS}
          />
        </Field>
        <Field label="Max tokens" hint="Response length ceiling.">
          <Input
            type="number"
            min={64}
            max={4096}
            value={draft.maxTokens}
            onChange={(e) => set("maxTokens", parseInt(e.target.value) || 1024)}
          />
        </Field>
      </Section>

      <Section title="Speech-to-Text (STT)">
        <Field label="Language" hint="Used for transcription.">
          <Select
            value={draft.sttLanguage}
            onChange={(v) => set("sttLanguage", v)}
            options={LANG_OPTIONS}
          />
        </Field>
        <Field label="STT model">
          <Select
            value={draft.sttModel}
            onChange={(v) => set("sttModel", v)}
            options={[{ value: "whisper-1", label: "Whisper" }]}
          />
        </Field>
        <Field label="STT provider" hint="Abstracted — swap in Settings code.">
          <Select
            value={draft.sttProvider}
            onChange={(v) => set("sttProvider", v)}
            options={[{ value: "openai", label: "OpenAI" }]}
          />
        </Field>
      </Section>

      <Section title="Text-to-Speech (TTS)">
        <Field label="Voice">
          <Select
            value={draft.ttsVoice}
            onChange={(v) => set("ttsVoice", v)}
            options={VOICE_OPTIONS}
          />
        </Field>
        <Field label="TTS language">
          <Select
            value={draft.ttsLanguage}
            onChange={(v) => set("ttsLanguage", v)}
            options={LANG_OPTIONS}
          />
        </Field>
        <Field label="TTS model">
          <Select
            value={draft.ttsModel}
            onChange={(v) => set("ttsModel", v)}
            options={[{ value: "tts-1", label: "TTS-1" }]}
          />
        </Field>
        <Field label="TTS speed">
          <Input
            type="number"
            min={0.5}
            max={2}
            step={0.1}
            value={draft.ttsSpeed}
            onChange={(e) => set("ttsSpeed", parseFloat(e.target.value) || 1)}
          />
        </Field>
      </Section>

      <Section title="Voice Behavior">
        <Field label="Voice mode">
          <Select
            value={draft.voiceMode}
            onChange={(v) => set("voiceMode", v as any)}
            options={MODE_OPTIONS}
          />
        </Field>
        <Field label="Max response length" hint="Caps assistant output tokens.">
          <Input
            type="number"
            min={64}
            max={4096}
            value={draft.maxTokens}
            onChange={(e) => set("maxTokens", parseInt(e.target.value) || 1024)}
          />
        </Field>
      </Section>
    </div>
  );
}