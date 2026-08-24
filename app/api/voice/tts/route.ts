import { NextRequest, NextResponse } from "next/server";
import { getTTSProvider } from "@/lib/tts/providers/registry";
import { rateLimit, clientKey } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    rateLimit(clientKey(req), { windowMs: 60_000, max: 60 });

    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });
    if (text.length > 4_096) {
      return NextResponse.json({ error: "Text too long (max 4096 chars)" }, { status: 400 });
    }

    const provider = getTTSProvider("openai");
    const result = await provider.synthesize(text, {
      voice: typeof body.voice === "string" ? body.voice : "alloy",
      model: typeof body.model === "string" ? body.model : undefined,
      language: typeof body.language === "string" ? body.language : undefined,
      speed: typeof body.speed === "number" ? body.speed : 1.0,
    });

    const base64 = Buffer.from(await result.audio.arrayBuffer()).toString("base64");
    const dataUrl = `data:${result.format || "audio/mp3"};base64,${base64}`;

    return NextResponse.json({ url: dataUrl, format: result.format });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}