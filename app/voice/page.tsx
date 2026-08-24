"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useVoiceSession } from "@/lib/voice/useVoiceSession";
import { useAgentConfig } from "@/components/agent/agent-config-provider";
import { VoiceOrb } from "@/components/voice/voice-orb";
import { VoiceControls } from "@/components/voice/voice-controls";
import { TranscriptPanel } from "@/components/voice/transcript-panel";
import { ConnectionIndicator } from "@/components/ui/connection-indicator";
import { Button } from "@/components/ui/button";
import { Mic, Settings2, Globe, UserRound, Volume2 } from "lucide-react";
import toast from "react-hot-toast";

export default function VoicePage() {
  const voice = useVoiceSession();
  const { config } = useAgentConfig();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [micReady, setMicReady] = useState(false);

  // Request mic permission lazily so we can show a friendly prompt.
  const ensureMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 16000, channelCount: 1 },
      });
      stream.getTracks().forEach((t) => t.stop());
      setMicReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Microphone access denied";
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: orb + controls */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{config.name}</h2>
              <p className="text-xs text-muted-foreground">
                {config.llmModel} · {config.ttsVoice} · {config.sttLanguage}
              </p>
            </div>
            <ConnectionIndicator
              status={
                voice.isError ? "error" :
                voice.isIdle ? "disconnected" :
                "connected"
              }
            />
          </div>

          <div className="flex flex-col items-center gap-6 py-6 w-full">
            <VoiceOrb
              state={voice.state}
              analyser={analyser}
              size={340}
            />

            <VoiceControls
              state={voice.state}
              isIdle={voice.isIdle}
              isListening={voice.isListening}
              isSpeaking={voice.isSpeaking}
              isError={voice.isError}
              voiceMode={config.voiceMode}
              onStart={async () => {
                if (!micReady) await ensureMic();
                voice.start();
              }}
              onStop={voice.stop}
              onInterrupt={voice.interrupt}
            />

            {voice.error && (
              <p className="text-sm text-voice-error text-center max-w-md">
                {voice.error}
              </p>
            )}
          </div>

          <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
            <p>
              Microphone audio is processed only when you start a voice session.
              Nothing is stored. API keys stay server-side.
            </p>
          </div>
        </div>

        {/* Right: transcript + quick settings */}
        <div className="space-y-4">
          <TranscriptPanel transcript={voice.transcript} state={voice.state} />

          <div className="glass rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Volume2 size={14} /> Quick Settings
            </h3>
            <QuickRow icon={<UserRound size={14} />} label="Agent" value={config.name} />
            <QuickRow icon={<Globe size={14} />} label="Language" value={config.sttLanguage} />
            <QuickRow icon={<Mic size={14} />} label="Voice" value={config.ttsVoice} />
            <QuickRow icon={<Settings2 size={14} />} label="Model" value={config.llmModel} />
            <Link
              href="/settings"
              className="flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              Full agent settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}