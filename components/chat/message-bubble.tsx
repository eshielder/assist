"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Button } from "@/components/ui/button";
import { copyToText } from "@/lib/utils";
import toast from "react-hot-toast";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  onRegenerate?: () => void;
  onCopy?: () => void;
}

export function MessageBubble({
  role,
  content,
  streaming,
  onRegenerate,
  onCopy,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToText(content);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="group flex gap-3 max-w-4xl">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-accent/80 to-primary/80 text-white",
        )}
      >
        {role === "user" ? "You" : "✦"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">
          {role === "user" ? "You" : "Assistant"}
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            role === "user"
              ? "bg-primary/15 border border-primary/20"
              : "glass",
          )}
        >
          {role === "assistant" ? (
            <MarkdownContent content={content} streaming={streaming} />
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>

        {role === "assistant" && content && !streaming && (
          <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              title="Copy"
            >
              {copied ? "✓" : "⧉"}
            </Button>
            {onRegenerate && (
              <Button variant="ghost" size="icon-sm" onClick={onRegenerate} title="Regenerate">
                ↻
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({
  content,
  streaming,
}: {
  content: string;
  streaming?: boolean;
}) {
  // Render a trailing cursor while streaming.
  const display = streaming && content ? content + "▋" : content;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }: any) {
          const isBlock = className;
          return isBlock ? (
            <code className={className} {...props}>
              {children}
            </code>
          ) : (
            <code className="px-1.5 py-0.5 rounded bg-muted text-[0.9em]" {...props}>
              {children}
            </code>
          );
        },
        pre({ children }: any) {
          return (
            <pre className="my-3 rounded-lg overflow-x-auto bg-muted/60 p-3 text-sm">
              {children}
            </pre>
          );
        },
      }}
    >
      {display}
    </ReactMarkdown>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}