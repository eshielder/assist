"use client";

import { useEffect, useState } from "react";
import {
  loadHistory,
  deleteEntry,
  clearHistory,
  type HistoryEntry,
} from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, Mic, Clock } from "lucide-react";
import toast from "react-hot-toast";

export function HistoryList() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = () => setEntries(loadHistory());

  useEffect(() => {
    refresh();
    // Re-load when the page regains focus (e.g. after editing).
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    refresh();
    toast.success("Deleted");
  };

  const handleClear = () => {
    if (entries.length === 0) return;
    if (confirm("Delete all conversation history? This cannot be undone.")) {
      clearHistory();
      refresh();
      toast.success("History cleared");
    }
  };

  if (entries.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <Clock size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No conversations yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a chat or voice session to see history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} conversation{entries.length === 1 ? "" : "s"} saved locally
        </p>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 size={14} /> Clear all
        </Button>
      </div>

      <div className="space-y-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="glass card-hover rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  e.mode === "voice"
                    ? "bg-accent/15 text-accent"
                    : "bg-primary/15 text-primary",
                )}
              >
                {e.mode === "voice" ? <Mic size={16} /> : <MessageSquare size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.updatedAt).toLocaleString()} · {e.mode} ·{" "}
                  {e.messages.length} messages
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(e.id)}
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}