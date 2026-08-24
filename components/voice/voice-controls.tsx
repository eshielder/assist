"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  state: string;
  isIdle: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isError: boolean;
  voiceMode: "push-to-talk" | "hands-free";
  onStart: () => void;
  onStop: () => void;
  onInterrupt: () => void;
}

export function VoiceControls({
  state,
  isIdle,
  isListening,
  isSpeaking,
  isError,
  voiceMode,
  onStart,
  onStop,
  onInterrupt,
}: VoiceControlsProps) {
  const active = !isIdle;

  return (
    <div className="flex items-center gap-3">
      {/* Primary action button */}
      {isIdle ? (
        <Button
          variant="voice"
          size="xl"
          className="rounded-full w-16 h-16"
          onClick={onStart}
          title="Start conversation"
        >
          <Phone size={24} />
        </Button>
      ) : isListening ? (
        <Button
          variant="voice"
          size="xl"
          className="rounded-full w-16 h-16 bg-voice-listening shadow-[0_0_40px_hsl(var(--voice-listening)/0.6)]"
          onClick={onStop}
          title="End conversation"
        >
          <PhoneOff size={24} />
        </Button>
      ) : isSpeaking ? (
        <Button
          variant="voice"
          size="xl"
          className="rounded-full w-16 h-16 bg-voice-speaking shadow-[0_0_40px_hsl(var(--voice-speaking)/0.6)]"
          onClick={onInterrupt}
          title="Interrupt"
        >
          <MicOff size={22} />
        </Button>
      ) : isError ? (
        <Button
          variant="voice"
          size="xl"
          className="rounded-full w-16 h-16 bg-voice-error"
          onClick={onStart}
          title="Retry"
        >
          <Phone size={24} />
        </Button>
      ) : (
        <Button
          variant="voice"
          size="xl"
          className="rounded-full w-16 h-16"
          onClick={onStart}
        >
          <Loader2 size={22} className="animate-spin" />
        </Button>
      )}

      <div className="hidden sm:block text-left">
        <p className="text-sm font-semibold">
          {isIdle && "Ready"}
          {isListening && "Listening…"}
          {isSpeaking && "Speaking"}
          {isError && "Error"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {voiceMode === "hands-free" ? "Hands-free mode" : "Push to talk"}
        </p>
      </div>
    </div>
  );
}