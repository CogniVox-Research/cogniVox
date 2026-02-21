import type { SimilarityAnalysisData } from '../types';

// ─── Badge ────────────────────────────────────────────────────────────────────

function SimilarityBadge({ value }: { value: number }) {
    let cls = 'bg-rose-500/10 text-rose-500';
    if (value >= 0.85) cls = 'bg-emerald-500/10 text-emerald-500';
    else if (value >= 0.65) cls = 'bg-amber-400/10 text-amber-400';
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
            {(value * 100).toFixed(0)}%
        </span>
    );
}

// ─── Public component ─────────────────────────────────────────────────────────

type Props = { data: SimilarityAnalysisData };

export function KeyPointsPanel({ data }: Props) {
    return (
        <div className="grid gap-6 md:grid-cols-2">

            {/* Key points comparison */}
            <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 px-6 py-4">
                    <h2 className="text-base font-semibold text-card-foreground">Key Points Coverage</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Transcript → planned &nbsp;|&nbsp; Speech → delivered</p>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                    {/* Transcript */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">Transcript</p>
                        <ul className="space-y-2">
                            {data.key_points_transcript.map((pt, i) => {
                                const covered = data.key_points_speech.some((s) =>
                                    s.toLowerCase().includes(pt.toLowerCase().slice(0, 15))
                                );
                                return (
                                    <li key={i} className={`flex items-start gap-2 text-xs leading-snug ${covered ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                        <span className={`mt-0.5 shrink-0 text-[10px] ${covered ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {covered ? '✓' : '✗'}
                                        </span>
                                        {pt}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    {/* Speech */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">Speech</p>
                        <ul className="space-y-2">
                            {data.key_points_speech.map((pt, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs leading-snug text-foreground">
                                    <span className="mt-0.5 shrink-0 text-[10px] text-emerald-500">✓</span>
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Missing points */}
                {data.missing_points.length > 0 && (
                    <div className="border-t border-border bg-rose-500/5 px-5 py-4">
                        <p className="mb-2 text-xs font-semibold text-rose-500">Missing Points</p>
                        <ul className="space-y-1.5">
                            {data.missing_points.map((pt, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-rose-400">
                                    <span className="shrink-0">⚠</span>
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* Redundant segments */}
            <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 px-6 py-4">
                    <h2 className="text-base font-semibold text-card-foreground">Sentence Alignment</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Closest matched sentences with similarity scores.</p>
                </div>
                <div className="divide-y divide-border">
                    {data.alignment.map((item, i) => (
                        <div key={i} className="px-5 py-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {item.paraphrase_type}
                                </span>
                                <SimilarityBadge value={item.similarity} />
                            </div>
                            <p className="text-xs text-muted-foreground italic">"{item.transcript_sentence}"</p>
                            <p className="text-xs text-foreground">→ "{item.closest_speech_sentence}"</p>
                            {/* Mini similarity bar */}
                            <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${item.similarity * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Redundant segments */}
                {data.redundant_speech_segments.length > 0 && (
                    <div className="border-t border-border bg-amber-400/5 px-5 py-4">
                        <p className="mb-2 text-xs font-semibold text-amber-500">Redundant Segments Detected</p>
                        <ul className="space-y-1.5">
                            {data.redundant_speech_segments.map((seg, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-amber-400/80">
                                    <span className="shrink-0">↺</span>
                                    {seg}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
        </div>
    );
}
