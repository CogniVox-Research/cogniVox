import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import type { SpeechAnalysisData } from '../types';

// ─── Score ring ────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
    if (v >= 80) return { ring: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' };
    if (v >= 60) return { ring: 'text-amber-400', bg: 'bg-amber-400/10', bar: 'bg-amber-400' };
    return { ring: 'text-rose-500', bg: 'bg-rose-500/10', bar: 'bg-rose-500' };
}

type MetricKey = 'clarity' | 'pace' | 'pauses' | 'pitch' | 'loudness';

const METRIC_LABELS: Record<MetricKey, { label: string; icon: string }> = {
    clarity: { label: 'Clarity', icon: '💬' },
    pace: { label: 'Pace', icon: '⏱' },
    pauses: { label: 'Pauses', icon: '⏸' },
    pitch: { label: 'Pitch', icon: '🎵' },
    loudness: { label: 'Loudness', icon: '🔊' },
};

// ─── Components ───────────────────────────────────────────────────────────────

function OverallGauge({ score }: { score: number }) {
    const c = scoreColor(score);
    return (
        <div className={`flex flex-col items-center justify-center rounded-xl border p-6 ${c.bg} border-border`}>
            <span className="text-5xl font-extrabold tabular-nums text-foreground">{score}</span>
            <span className="mt-1 text-sm text-muted-foreground">Overall Score</span>
            <div className="mt-3 h-2 w-32 rounded-full bg-border overflow-hidden">
                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

function MetricRow({ metricKey, score, feedback }: { metricKey: MetricKey; score: number; feedback: string }) {
    const c = scoreColor(score);
    const { label, icon } = METRIC_LABELS[metricKey];
    return (
        <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{icon}</span>
                    {label}
                </span>
                <span className={`text-sm font-bold tabular-nums ${c.ring}`}>{score}%</span>
            </div>
            {/* Bar */}
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            {/* Feedback */}
            <p className="text-xs leading-relaxed text-muted-foreground">{feedback}</p>
        </div>
    );
}

// ─── Public component ─────────────────────────────────────────────────────────

type Props = { data: SpeechAnalysisData };

export function SpeechScoresPanel({ data }: Props) {
    const { scores, feedback } = data;

    const avg = Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    );

    const radarData = (Object.keys(scores) as MetricKey[]).map((k) => ({
        metric: METRIC_LABELS[k].label,
        value: scores[k],
    }));

    return (
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-muted/40 px-6 py-4">
                <h2 className="text-base font-semibold text-card-foreground">Speech Quality Analysis</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Scores across 5 vocal dimensions — click a metric for detailed feedback.
                </p>
            </div>

            <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-5">
                {/* Radar chart */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    <OverallGauge score={avg} />
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis
                                    dataKey="metric"
                                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                />
                                <Tooltip
                                    formatter={(v: number | undefined) => [`${v ?? 0}%`, 'Score']}
                                    contentStyle={{
                                        background: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        fontSize: 12,
                                    }}
                                />
                                <Radar
                                    dataKey="value"
                                    stroke="var(--primary)"
                                    fill="var(--primary)"
                                    fillOpacity={0.15}
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Metric rows */}
                <div className="md:col-span-3 space-y-3">
                    {(Object.keys(scores) as MetricKey[]).map((k) => (
                        <MetricRow key={k} metricKey={k} score={scores[k]} feedback={feedback[k]} />
                    ))}
                </div>
            </div>
        </section>
    );
}
