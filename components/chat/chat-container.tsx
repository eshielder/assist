"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/chat/useChat";
import { useAgentConfig } from "@/components/agent/agent-config-provider";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, Trash2, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import { stylePrompt, responseStyleMultiplier } from "@/lib/agent-config";
import { addEntry } from "@/lib/history";

export function ChatContainer() {
  const { config } = useAgentConfig();
  const { messages, isStreaming, sendMessage, stop, clear, regenerate, onTurnComplete } = useChat();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onTurnComplete((entry) => addEntry(entry));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTurnComplete]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Auto-grow textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [input]);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text, {
      systemPrompt: config.systemPrompt + "\n\n" + stylePrompt(config.responseStyle),
      temperature: config.temperature,
      maxTokens: responseStyleMultiplier(config.responseStyle),
      model: config.llmModel,
    });
  };

  const handleRegenerate = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;
    regenerate({
      systemPrompt: config.systemPrompt + "\n\n" + stylePrompt(config.responseStyle),
      temperature: config.temperature,
      maxTokens: responseStyleMultiplier(config.responseStyle),
      model: config.llmModel,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border glass">
        <div>
          <h2 className="font-semibold">{config.name}</h2>
          <p className="text-xs text-muted-foreground">
            {config.llmModel} · temperature {config.temperature}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSettings((s) => !s)}
            title="Settings"
          >
            <Settings2 size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={clear} title="Clear conversation">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState onSend={sendMessage} />
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              streaming={m.streaming}
              onRegenerate={
                m.role === "assistant" && !m.streaming ? handleRegenerate : undefined
              }
            />
          ))
        )}
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-2 border-t border-border glass">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="resize-none max-h-[200px]"
          />
          {isStreaming ? (
            <Button variant="secondary" size="icon" onClick={stop} title="Stop generation">
              <Square size={16} />
            </Button>
          ) : (
            <Button variant="voice" size="icon" onClick={send} disabled={!input.trim()} title="Send">
              <Send size={18} />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          AI can make mistakes. Review important information.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onSend }: { onSend: (t: string, c: any) => void }) {
  const { config } = useAgentConfig();
  const suggestions = [
    "Explain quantum computing in one paragraph",
    "Write a Python function to reverse a string",
    "Draft a polite follow-up email",
    "Summarize the plot of Dune",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="text-4xl mb-4">✦</div>
      <h3 className="text-lg font-semibold mb-1">How can I help today?</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Start a conversation with {config.name}. Responses stream in real time.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s, {
              systemPrompt: config.systemPrompt,
              temperature: config.temperature,
              maxTokens: 1024,
              model: config.llmModel,
            })}
            className="text-left text-sm px-4 py-3 rounded-xl glass card-hover"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}