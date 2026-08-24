import { cn } from "@/lib/utils";

type Status = "connected" | "connecting" | "disconnected" | "error";

export function ConnectionIndicator({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  const styles: Record<Status, string> = {
    connected: "bg-emerald-500",
    connecting: "bg-amber-500",
    disconnected: "bg-muted-foreground",
    error: "bg-voice-error",
  };
  const labels: Record<Status, string> = {
    connected: "Connected",
    connecting: "Connecting…",
    disconnected: "Disconnected",
    error: "Error",
  };
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-70",
            styles[status],
            status === "connecting" && "animate-ping",
          )}
        />
        <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", styles[status])} />
      </span>
      <span>{label ?? labels[status]}</span>
    </div>
  );
}