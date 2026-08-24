"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/voice/useVoiceSession";

export function TranscriptPanel({
  transcript,
  state,
}: {
  transcript: TranscriptEntry[];
  state: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [transcript]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Live Transcript</h3>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider font-semibold",
            state === "listening" && "text-voice-listening",
            state === "speaking" && "text-voice-speaking",
            state === "thinking" && "text-voice-thinking",
            state === "idle" && "text-muted-foreground",
            state === "error" && "text-voice-error",
          )}
        >
          {state}
        </span>
      </div>
      <div ref={ref} className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {transcript.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {state === "idle"
              ? "Start a conversation to see the transcript."
              : "Listening…"}
          </p>
        ) : (
          transcript.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "text-sm px-3 py-2 rounded-lg",
                entry.speaker === "user"
                  ? "bg-primary/10 border border-primary/20 ml-6"
                  : "bg-muted/50 mr-6",
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {entry.speaker === "user" ? "You" : "Assistant"}
              </span>{" "}
              <span className="whitespace-pre-wrap">{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}