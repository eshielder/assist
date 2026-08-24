import { NextRequest, NextResponse } from "next/server";
import { getSTTProvider } from "@/lib/stt/providers/registry";
import { rateLimit, clientKey } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"];

export async function POST(req: NextRequest) {
  try {
    rateLimit(clientKey(req), { windowMs: 60_000, max: 60 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 25MB)" }, { status: 413 });
    }

    const language = form.get("language");
    const model = form.get("model");

    const provider = getSTTProvider("openai");
    const result = await provider.transcribe(file, {
      language: typeof language === "string" ? language : undefined,
      model: typeof model === "string" ? model : undefined,
    });

    return NextResponse.json({ text: result.text, language: result.language });
  } catch (err) {
    const message = err instanceof Error ? err.message : "STT failed";
    const status = (err as any)?.retryAfter ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}