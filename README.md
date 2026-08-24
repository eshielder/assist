# Agent Interaction Lab 

A production-ready, modern web application demonstrating two AI agent interaction modalities:

- **Text / Chat Agent** — Conversational chatbot with streaming markdown responses
- **Voice Agent** — Real-time speech-in, speech-out with the pipeline: Mic → STT → LLM → TTS

## Tech Stack

- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Tailwind CSS** (modern, dark/light theme)
- **Vercel Functions** (Fluid Compute — up to 5GB packages, 100MB bodies, 300s timeout)
- **No Docker** — Serverless, no database
- **AI SDK Pattern** — Provider-agnostic architecture

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  ┌─────────────┐       ┌─────────────┐                    │
│  │  Chat Agent │       │ Voice Agent │                    │
│  │  - messages │       │ - mic capture                   │
│  │  - streaming│       │ - analyser (voice orb)            │
│  └─────────────┘       └─────────────┘                    │
└─────────┬─────────────────────────────────────────────────┘
          │              │
          ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Vercel)                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │
│  │ /api/chat   │→  │ /api/voice/ │→  │ /api/voice/ │      │
│  │ (SSE LLM)   │   │ stt         │   │ tts         │      │
│  └─────────────┘   └─────────────┘   └─────────────┘      │
│        │                                                   │
│        ▼                                                   │
│  ┌─────────────┐                                          │
│  │ LLM Provider│  (OpenAI, OpenRouter, custom compatible)   │
│  └─────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### Text / Chat Agent

- Streaming SSE responses (markdown, code blocks)
- Copy / Regenerate / Stop generation
- Local history (no DB)
- System prompt & model configuration
- Mobile-responsive

### Voice Agent

- Push-to-talk & hands-free modes
- Animated voice orb visualization (state colors + audio activity)
- Live transcript display
- Interrupt AI speech mid-sentence
- Microphone permission handling
- Error/reconnection handling

### Security

- API keys in **server-side env vars** only
- No secrets in client bundles
- Rate limiting (sliding window, per-request)
- Input validation & length limits

## Development

```bash
npm install
npm run dev      # http://localhost:3000
```

## Environment Variables

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1   # optional override
```

## Deploying to Vercel

```bash
npm i -g vercel
vercel            # preview deploy
vercel --prod     # production
```

Add env vars in Vercel Dashboard → Project → Settings → Environment Variables.

## Provider Architecture

Providers are abstract behind interfaces:

- `lib/ai/` — LLM provider abstraction (`LLMProvider` interface)
- `lib/stt/` — Speech-to-text abstraction (`STTProvider` interface)
- `lib/tts/` — Text-to-speech abstraction (`TTSProvider` interface)
- `lib/webrtc/` — Voice session abstraction (`VoiceSession` interface)

To add a new provider, implement the interface and register it in the registry file.

## License

MIT — feel free to copy, adapt, and extend.
