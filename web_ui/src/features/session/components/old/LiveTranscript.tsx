import { useEffect, useRef, useState } from "react";
import type { TranscriptEntry } from "../../types";

// ─── Simulated phrases for demo ───────────────────────────────────────────────
const DEMO_PHRASES = [
  "Good morning, everyone.",
  "Today I want to talk about the impact of technology on modern communication.",
  "Over the last decade, we have seen a dramatic shift in how people interact.",
  "Social media platforms have redefined what it means to be connected.",
  "But with this connectivity comes a new set of challenges.",
  "Attention spans are shorter, and distractions are everywhere.",
  "As speakers, our role is to cut through that noise.",
  "We do that by being clear, concise, and compelling.",
  "Let me share three strategies that have worked for me.",
  "First — know your audience before you open your mouth.",
  "Second — structure your message so the key point lands within sixty seconds.",
  "Third — practice out loud, not just in your head.",
];

// ─── Component ────────────────────────────────────────────────────────────────

type LiveTranscriptProps = {
  entries?: TranscriptEntry[];
  simulate?: boolean;
};

export function LiveTranscript({
  entries,
  simulate = true,
}: LiveTranscriptProps) {
  const [lines, setLines] = useState<TranscriptEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const phraseIndex = useRef(0);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulation: drip in phrases one by one
  useEffect(() => {
    if (!simulate || entries) return;
    simRef.current = setInterval(() => {
      const text = DEMO_PHRASES[phraseIndex.current % DEMO_PHRASES.length];
      phraseIndex.current += 1;
      const entry: TranscriptEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        text,
        isFinal: true,
      };
      setLines((prev) => [...prev, entry]);
    }, 3500);
    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, [simulate, entries]);

  // External entries
  useEffect(() => {
    if (entries) setLines(entries);
  }, [entries]);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-sm flex flex-col"
      style={{ minHeight: "320px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">
            Live Transcript
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time speech recognition
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Listening
        </span>
      </div>

      {/* Transcript body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-64 scroll-smooth">
        {lines.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground italic">
              Waiting for speech…
            </p>
          </div>
        ) : (
          lines.map((entry, idx) => {
            const isLast = idx === lines.length - 1;
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 transition-opacity duration-500 ${
                  isLast ? "opacity-100" : "opacity-75"
                }`}
              >
                {/* Timestamp */}
                <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                  {formatTime(entry.timestamp)}
                </span>
                {/* Text */}
                <p
                  className={`text-sm leading-relaxed ${
                    entry.isFinal
                      ? isLast
                        ? "font-medium text-foreground"
                        : "text-foreground/80"
                      : "italic text-muted-foreground"
                  }`}
                >
                  {entry.text}
                  {!entry.isFinal && (
                    <span className="ml-1 inline-flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Word count footer */}
      <div className="border-t border-border px-5 py-2.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {lines.filter((l) => l.isFinal).length} utterances recorded
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {lines.reduce((acc, l) => acc + l.text.split(" ").length, 0)} words
        </span>
      </div>
    </div>
  );
}
