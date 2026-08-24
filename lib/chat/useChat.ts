/**
 * Chat streaming hook.
 *
 * Wraps the /api/chat SSE route and exposes a simple imperative API.
 * Provider-agnostic: the UI never knows which LLM is streaming.
 */

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ai/index";
import { addEntry, type HistoryEntry } from "@/lib/history";
import toast from "react-hot-toast";

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const onTurnCompleteRef = useRef<((entry: HistoryEntry) => void) | null>(null);

  const sendMessage = useCallback(
    async (text: string, config: { systemPrompt: string; temperature: number; maxTokens: number; model: string }) => {
      if (!text.trim()) return;
      const userTurn: ChatTurn = { id: uid(), role: "user", content: text.trim() };
      const assistantTurn: ChatTurn = { id: uid(), role: "assistant", content: "", streaming: true };

      setMessages((prev) => [...prev, userTurn, assistantTurn]);
      setIsStreaming(true);

      const ac = new AbortController();
      abortRef.current = ac;

      const history: ChatMessage[] = [...messages, { role: "user", content: text.trim() }];

      try {
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            messages: history,
            systemPrompt: config.systemPrompt,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            model: config.model,
          }),
        });

        if (!resp.ok || !resp.body) {
          const t = await resp?.text().catch(() => "");
          throw new Error(t || `Chat failed (${resp?.status})`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") break;
            try {
              const json = JSON.parse(data);
              if (json.error) throw new Error(json.error);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantTurn.id ? { ...m, content: full } : m,
                  ),
                );
              }
            } catch (e) {
              if (e instanceof Error && e.message && e.message !== data) throw e;
            }
          }
        }
        reader.releaseLock();

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantTurn.id ? { ...m, streaming: false } : m)),
        );

        // Persist to local history.
        onTurnCompleteRef.current?.({
          id: assistantTurn.id,
          title: userTurn.content.slice(0, 50) + (userTurn.content.length > 50 ? "…" : ""),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: "chat",
          messages: [
            { role: "user", content: userTurn.content },
            { role: "assistant", content: assistantTurn.content },
          ],
        });
      } catch (err) {
        if (ac.signal.aborted) {
          // User stopped generation — mark partial response as done.
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantTurn.id ? { ...m, streaming: false } : m)),
          );
          return;
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTurn.id
              ? { ...m, content: m.content || `⚠️ ${message}`, streaming: false }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    abortRef.current?.abort();
  }, []);

  const regenerate = useCallback(
    async (config: { systemPrompt: string; temperature: number; maxTokens: number; model: string }) => {
      setMessages((prev) => {
        // Drop trailing assistant turn if present, then re-send last user message.
        const idx = prev.findLastIndex((m) => m.role === "assistant");
        const base = idx >= 0 ? prev.slice(0, idx) : prev.slice(0, -1);
        const lastUser = [...prev].reverse().find((m) => m.role === "user");
        if (!lastUser) return prev;
        // We'll re-send after state update; store text on window for the closure.
        (window as any).__regen = lastUser.content;
        return base;
      });
      const text = (window as any).__regen as string | undefined;
      if (text) await sendMessage(text, config);
    },
    [sendMessage],
  );

  return {
    messages,
    isStreaming,
    sendMessage,
    stop,
    clear,
    regenerate,
    onTurnComplete: (cb: ((entry: HistoryEntry) => void) | null) => {
      onTurnCompleteRef.current = cb;
    },
  };
}

let counter = 0;
function uid() {
  return `t-${++counter}-${Math.random().toString(36).slice(2, 8)}`;
}