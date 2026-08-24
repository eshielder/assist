interface Step {
  label: string;
  icon: string;
}

export function PipelineDiagram({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/80 border border-border text-sm">
            <span>{s.icon}</span>
            <span className="hidden sm:inline text-muted-foreground">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary shrink-0"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}