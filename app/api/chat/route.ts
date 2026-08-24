import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/providers/registry";
import type { ChatMessage } from "@/lib/ai/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 50;
const MAX_CONTENT_CHARS = 4_000;

function validateMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) throw new Error("messages must be an array");
  if (input.length === 0) throw new Error("messages must not be empty");
  if (input.length > MAX_MESSAGES)
    throw new Error(`Too many messages (max ${MAX_MESSAGES})`);
  const messages = input.map((m: any, i: number) => {
    if (!m || typeof m !== "object" || typeof m.content !== "string") {
      throw new Error(`Invalid message at index ${i}`);
    }
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") {
      throw new Error(`Invalid role at index ${i}`);
    }
    if (m.content.length > MAX_CONTENT_CHARS) {
      throw new Error(`Message at index ${i} exceeds ${MAX_CONTENT_CHARS} chars`);
    }
    return { role: m.role, content: m.content };
  });
  return messages;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = validateMessages(body.messages as unknown);
    const systemPrompt =
      typeof body.systemPrompt === "string"
        ? body.systemPrompt.slice(0, 2_000)
        : undefined;
    const temperature =
      typeof body.temperature === "number"
        ? Math.min(2, Math.max(0, body.temperature))
        : 0.7;
    const maxTokens =
      typeof body.maxTokens === "number"
        ? Math.min(4096, Math.max(1, Math.floor(body.maxTokens)))
        : 1024;
    const providerId =
      typeof body.provider === "string" ? body.provider : "openai";

    const provider = getLLMProvider(providerId);

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const write = (obj: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
          );
        };
        try {
          const ac = new AbortController();
          req.signal.addEventListener("abort", () => ac.abort());
          for await (const chunk of provider.streamChat(messages, {
            systemPrompt,
            temperature,
            maxTokens,
            signal: ac.signal,
          })) {
            if (chunk.text) write({ choices: [{ delta: { content: chunk.text } }] });
            if (chunk.done) break;
          }
          write("[DONE]");
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          write({ error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}