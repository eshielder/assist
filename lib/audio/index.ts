/**
 * Browser audio helpers — client-side only.
 */

export interface AudioConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
  channelCount?: number;
}

export const DEFAULT_AUDIO_CONSTRAINTS: AudioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000,
  channelCount: 1,
};

export function getMicrophoneStream(
  constraints: AudioConstraints = DEFAULT_AUDIO_CONSTRAINTS,
): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(
      new Error("Microphone access is not supported in this browser."),
    );
  }
  return navigator.mediaDevices.getUserMedia({
    audio: constraints,
    video: false,
  } as MediaStreamConstraints);
}

export async function requestMicrophonePermission(): Promise<MediaStream> {
  try {
    return await getMicrophoneStream();
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowed") {
        throw new Error(
          "Microphone permission denied. Please allow microphone access.",
        );
      }
      if (err.name === "NotFoundError") {
        throw new Error("No microphone detected on this device.");
      }
    }
    throw err;
  }
}

export async function audioBufferToBlob(
  stream: MediaStream,
  durationMs: number,
  mimeType = "audio/webm;codecs=opus",
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      recorder = new MediaRecorder(stream);
    }
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      resolve(blob);
    };
    recorder.onerror = () => reject(new Error("MediaRecorder error"));
    recorder.start(250);
    setTimeout(() => recorder.stop(), durationMs);
  });
}

export function createAnalyser(
  stream: MediaStream,
  fftSize = 64,
): { analyser: AnalyserNode; cleanup: () => void } {
  const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) throw new Error("AudioContext not supported");
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0.75;
  source.connect(analyser);
  return {
    analyser,
    cleanup: () => {
      try {
        source.disconnect();
        analyser.disconnect();
        ctx.close();
      } catch {
        /* ignore */
      }
    },
  };
}

export function getVolumeLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}

export function playAudio(
  blob: Blob,
  options: { onEnded?: () => void; onVolume?: (v: number) => void } = {},
): { audio: HTMLAudioElement; stop: () => void; analyser: AnalyserNode | null; ctx: AudioContext | null } {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = "auto";

  // Try to create audio context and analyser. Not all browsers support createMediaElementSource.
  const AudioConstructor = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext | null = AudioConstructor ? new AudioConstructor() : null;

  let analyserOut: AnalyserNode | null = null;
  if (ctx) {
    try {
      const source = ctx.createMediaElementSource(audio);
      analyserOut = ctx.createAnalyser();
      analyserOut.fftSize = 64;
      source.connect(analyserOut);
      analyserOut.connect(ctx.destination);
    } catch {
      // Some browsers throw; analyser remains null
    }
  }

  if (options.onEnded) audio.addEventListener("ended", options.onEnded);
  audio.play().catch(() => {});

  return {
    audio,
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(url);
      try {
        ctx?.close();
      } catch {
        /* ignore */
      }
    },
    analyser: analyserOut,
    ctx,
  };
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}