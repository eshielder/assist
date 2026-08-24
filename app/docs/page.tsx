import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Documentation</h1>
      <p className="text-muted-foreground mb-8">
        How the Agent Interaction Lab is built, how to add a provider, and how to
        deploy.
      </p>

      <Section title="Architecture">
        <p>
          The app is organized into focused modules so each agent modality can be
          added or swapped without touching the others:
        </p>
        <CodeBlock
          title="app/"
          code={`app/
├── page.tsx              # Dashboard — pick a modality
├── chat/page.tsx         # Text / Chat agent
├── voice/page.tsx        # Voice agent
├── settings/page.tsx     # Agent Settings
├── history/page.tsx      # Local conversation history
├── docs/page.tsx         # This page
└── api/
    ├── chat/route.ts      # SSE streaming LLM proxy
    └── voice/
        ├── stt/route.ts   # Speech-to-text proxy
        └── tts/route.ts   # Text-to-speech proxy`}
        />
        <CodeBlock
          title="lib/"
          code={`lib/
├── ai/                  # LLM provider abstraction + registry
├── stt/                 # STT provider abstraction + registry
├── tts/                 # TTS provider abstraction + registry
├── webrtc/              # Voice transport abstraction
├── audio/               # Browser audio helpers
├── agent-config.ts      # Settings model (localStorage)
├── history.ts           # Conversation history (localStorage)
└── rateLimit.ts         # In-memory sliding window limiter`}
        />
      </Section>

      <Section title="How the two modalities differ">
        <p>
          <strong>Text / Chat Agent</strong> — the classic chatbot. The user types,
          the LLM streams text back. One request, one response. State lives in the
          conversation history array.
        </p>
        <p>
          <strong>Voice Agent</strong> — speech-in, speech-out. Microphone audio is
          captured, sent to an STT provider, the transcript is fed to the LLM, and
          the assistant reply is spoken back via TTS. The pipeline is:
        </p>
        <Pipeline steps={["🎤 Speech", "📝 STT", "🧠 LLM", "🔊 TTS", "👂 Speech"]} />
        <p>
          The default transport is the <em>async pipeline</em> — it works with any
          provider combination and needs no special server support. A real-time
          WebRTC transport (e.g. OpenAI Realtime, Gemini Live) can be plugged in
          behind the same <code>VoiceSession</code> interface.
        </p>
      </Section>

      <Section title="Adding a provider">
        <p>
          Providers are registered in one place and the UI never references them
          directly. To add an LLM provider:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Create <code>lib/ai/providers/my-provider.ts</code> implementing{" "}
            <code>LLMProvider</code> (see <code>lib/ai/index.ts</code>).
          </li>
          <li>
            Register it in <code>lib/ai/providers/registry.ts</code>.
          </li>
          <li>
            Add its API key to <code>.env.local</code> and to{" "}
            <code>lib/config/env.ts</code>.
          </li>
        </ol>
        <p>The same pattern applies to STT (<code>lib/stt/</code>) and TTS.</p>
      </Section>

      <Section title="Security">
        <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>
            API keys live in server-side environment variables and are never
            exposed to client JavaScript.
          </li>
          <li>
            All provider calls go through server routes (<code>/api/chat</code>,{" "}
            <code>/api/voice/stt</code>, <code>/api/voice/tts</code>).
          </li>
          <li>
            Input is validated and length-capped on the server before reaching any
            provider.
          </li>
          <li>
            A sliding-window rate limiter guards each route. For production at
            scale, swap the in-memory store for Upstash Redis.
          </li>
          <li>
            Microphone audio is processed only when you start a voice session and
            is never stored.
          </li>
        </ul>
      </Section>

      <Section title="Environment variables">
        <CodeBlock
          title=".env.local"
          code={`# LLM
OPENAI_API_KEY=sk-...
# Optional: OpenAI-compatible base URL (OpenRouter, Azure, local, etc.)
OPENAI_BASE_URL=https://api.openai.com/v1

# STT / TTS (fall back to OPENAI_API_KEY when unset)
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...

# Misc
APP_URL=http://localhost:3000`}
        />
      </Section>

      <Section title="Deploying to Vercel">
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Install the CLI: <code>npm i -g vercel</code>
          </li>
          <li>
            Create a Vercel project: <code>vercel</code>
          </li>
          <li>
            Add environment variables in the Vercel dashboard (Settings → Environment
            Variables) or with <code>vercel env pull</code>.
          </li>
          <li>
            Deploy: <code>vercel --prod</code>
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">
          The app runs on Fluid Compute (Node.js) by default — required for
          streaming, 100MB request bodies, and WebSockets. No Docker, no database.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({
  title,
  code,
}: {
  title: string;
  code: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-card/60 overflow-hidden">
      <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border bg-muted/30">
        {title}
      </div>
      <pre className="px-3 py-3 text-xs overflow-x-auto">
        <code className="text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

function Pipeline({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap my-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span className="px-2 py-1 rounded-md bg-card/80 border border-border text-xs">
            {s}
          </span>
          {i < steps.length - 1 && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}