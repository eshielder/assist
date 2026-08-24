import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AgentConfigProvider } from "@/components/agent/agent-config-provider";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agent Interaction Lab — Text & Voice AI Agents",
  description:
    "A production-ready web app demonstrating text/chat and real-time voice AI agent interaction modalities.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <AgentConfigProvider>
            <div className="flex min-h-screen">
              <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/40 backdrop-blur">
                <Nav />
                <div className="flex-1" />
                <PrivacyNotice />
              </aside>
              <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <OrbLogo />
                    <span className="font-semibold tracking-tight">Agent Lab</span>
                  </div>
                  <MobileNav />
                </header>
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                },
              }}
            />
          </AgentConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function OrbLogo() {
  return (
    <div className="w-7 h-7 rounded-full voice-orb thinking" style={{ animation: "spin-slow 3s linear infinite" }} />
  );
}

function PrivacyNotice() {
  return (
    <div className="px-4 py-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
      <p className="font-semibold text-foreground mb-1">Privacy</p>
      Microphone audio is processed only when you start a voice session and is
      never stored. API keys live in server-side environment variables and never
      reach the browser.
    </div>
  );
}

// Inline nav to keep this single file simple; imported below.
function Nav() {
  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/chat", label: "Chat Agent" },
    { href: "/voice", label: "Voice Agent" },
    { href: "/settings", label: "Agent Settings" },
    { href: "/history", label: "History" },
    { href: "/docs", label: "Docs" },
  ];
  return (
    <nav className="p-4 space-y-1">
      <div className="flex items-center gap-2 px-2 pb-4">
        <OrbLogo />
        <span className="font-bold tracking-tight">Agent Interaction Lab</span>
      </div>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}

function MobileNav() {
  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/chat", label: "Chat" },
    { href: "/voice", label: "Voice" },
    { href: "/settings", label: "Settings" },
    { href: "/history", label: "History" },
    { href: "/docs", label: "Docs" },
  ];
  return (
    <div className="flex gap-1">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}