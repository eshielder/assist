import { HistoryList } from "@/components/history/history-list";

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Conversation History</h1>
        <p className="text-sm text-muted-foreground">
          Saved locally in your browser. No server, no database.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}