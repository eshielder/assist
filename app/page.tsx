import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PipelineDiagram } from "@/components/dashboard/pipeline-diagram";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="text-center mb-14">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">AI Agents</span>
          <span>·</span>
          <span>Interaction Modalities</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Agent Interaction <span className="text-gradient">Lab</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Two fundamentally different ways to talk to an AI. Pick a modality and
          see the difference between conventional text chat and real-time voice.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <ModalityCard
          title="Text / Chat Agent"
          subtitle="Conversational — the classic chatbot."
          accent="from-primary to-sky-400"
          pipeline={
            <PipelineDiagram
              steps={[
                { label: "User", icon: "✍️" },
                { label: "Text", icon: "💬" },
                { label: "LLM", icon: "🧠" },
                { label: "Text", icon: "💬" },
                { label: "User", icon: "👀" },
              ]}
            />
          }
          features={[
            "Streaming markdown responses",
            "Code blocks, copy, regenerate, stop",
            "Local conversation history",
            "System prompt & model configuration",
          ]}
          href="/chat"
        />

        <ModalityCard
          title="Voice Agent"
          subtitle="Speech-in, speech-out — real-time AI conversation."
          accent="from-accent to-fuchsia-400"
          pipeline={
            <PipelineDiagram
              steps={[
                { label: "Speech", icon: "🎤" },
                { label: "STT", icon: "📝" },
                { label: "LLM", icon: "🧠" },
                { label: "TTS", icon: "🔊" },
                { label: "Speech", icon: "👂" },
              ]}
            />
          }
          features={[
            "Push-to-talk & hands-free modes",
            "Live transcript & voice states",
            "Animated voice orb visualization",
            "Interrupt AI speech mid-sentence",
          ]}
          href="/voice"
        />
      </div>

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Serverless · Next.js 15 · Fluid Compute · No database required
      </footer>
    </div>
  );
}

function ModalityCard({
  title,
  subtitle,
  accent,
  pipeline,
  features,
  href,
}: {
  title: string;
  subtitle: string;
  accent: string;
  pipeline: React.ReactNode;
  features: string[];
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="glass card-hover rounded-2xl p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={cn(
              "inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br text-lg",
              accent,
            )}
          >
            {title.startsWith("Text") ? "💬" : "🎙️"}
          </span>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{subtitle}</p>

        <div className="mb-6 flex justify-center">{pipeline}</div>

        <ul className="space-y-2 mb-6 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <Button variant="voice" className="w-full">
            Open Agent
          </Button>
        </div>
      </div>
    </Link>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}