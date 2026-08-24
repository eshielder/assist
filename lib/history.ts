/**
 * Conversation history — stored locally in the browser.
 *
 * No database required. Each conversation is a snapshot of messages.
 */

export interface HistoryEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: "chat" | "voice";
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

const KEY = "agent-lab:history:v1";
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
}

export function addEntry(entry: HistoryEntry): void {
  const entries = loadHistory();
  entries.unshift(entry);
  saveHistory(entries);
}

export function deleteEntry(id: string): void {
  const entries = loadHistory().filter((e) => e.id !== id);
  saveHistory(entries);
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function titleFromMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Untitled conversation";
  return firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? "…" : "");
}