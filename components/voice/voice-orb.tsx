"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceState } from "@/lib/webrtc";

interface VoiceOrbProps {
  state: VoiceState;
  analyser: AnalyserNode | null;
  size?: number;
}

export function VoiceOrb({ state, analyser, size = 320 }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.3;

    let phase = 0;
    let smoothed = 0;

    const colorFor = (s: VoiceState) => {
      switch (s) {
        case "listening":
          return ["#22c55e", "#16a34a"];
        case "thinking":
          return ["#0ea5e9", "#3b82f6"];
        case "speaking":
          return ["#a855f7", "#7c3aed"];
        case "error":
          return ["#ef4444", "#dc2626"];
        default:
          return ["#64748b", "#475569"];
      }
    };

    const draw = () => {
      phase += 0.02;
      const target = analyser ? getLevel(analyser) : 0;
      smoothed += (target - smoothed) * 0.2;
      setLevel(smoothed);

      ctx.clearRect(0, 0, size, size);

      const [c1, c2] = colorFor(state);

      // Outer glow
      const glowR = baseR + smoothed * size * 0.25 + (state === "speaking" ? Math.sin(phase) * 4 : 0);
      const grad = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, glowR);
      grad.addColorStop(0, `${c1}cc`);
      grad.addColorStop(1, `${c1}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Core
      const coreR = baseR + smoothed * size * 0.12;
      const coreGrad = ctx.createRadialGradient(
        cx - size * 0.08,
        cy - size * 0.08,
        size * 0.02,
        cx,
        cy,
        coreR,
      );
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.3, c1);
      coreGrad.addColorStop(1, c2);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Ring
      ctx.lineWidth = 2;
      ctx.strokeStyle = `${c1}cc`;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR + 6, 0, Math.PI * 2);
      ctx.stroke();

      // Waveform ring when listening/speaking
      if (state === "listening" || state === "speaking") {
        const bars = 48;
        const ringR = coreR + 14;
        for (let i = 0; i < bars; i++) {
          const a = (i / bars) * Math.PI * 2;
          const noise = analyser
            ? getFreqBin(analyser, i, bars)
            : Math.abs(Math.sin(phase + i * 0.2));
          const h = 2 + noise * 18;
          const x1 = cx + Math.cos(a) * ringR;
          const y1 = cy + Math.sin(a) * ringR;
          const x2 = cx + Math.cos(a) * (ringR + h);
          const y2 = cy + Math.sin(a) * (ringR + h);
          ctx.strokeStyle = `${c1}${state === "speaking" ? "ff" : "99"}`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, state, analyser]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <StateLabel state={state} />
    </div>
  );
}

function StateLabel({ state }: { state: VoiceState }) {
  const labels: Record<VoiceState, string> = {
    idle: "IDLE",
    listening: "LISTENING",
    thinking: "THINKING",
    speaking: "SPEAKING",
    error: "ERROR",
  };
  return (
    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-semibold tracking-widest text-muted-foreground">
      {labels[state]}
    </div>
  );
}

function getLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

function getFreqBin(analyser: AnalyserNode, i: number, total: number): number {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const idx = Math.floor((i / total) * data.length * 0.5);
  return data[idx] / 255;
}