import { StressChart } from "../components/StressChart";
import { LiveTranscript } from "../components/LiveTranscript";

export function SessionPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">CogniVox</h1>
            <p className="text-xs text-muted-foreground">
              VR public speaking platform
            </p>
          </div>
          {/* Session timer */}
          <SessionTimer />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Live Session
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time biometric feedback and speech recognition.
              </p>
            </div>
            <button
              onClick={() => console.log("Session stopped")}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-500 transition-all hover:bg-rose-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop Session
            </button>
          </div>
        </div>

        {/* Stress chart */}
        <StressChart simulate />

        {/* Live transcript */}
        <LiveTranscript simulate />
      </main>
    </div>
  );
}

// ─── Session timer ────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

function SessionTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {mm}:{ss}
      </span>
    </div>
  );
}
