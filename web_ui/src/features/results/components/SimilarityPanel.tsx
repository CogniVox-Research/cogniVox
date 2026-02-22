import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
} from 'recharts';
import type { OrderAnalysis, SimilarityAnalysisData } from '../types';

// ─── Overall similarity gauge ─────────────────────────────────────────────────

function SimilarityGauge({ value }: { value: number }) {
    let color = 'text-rose-500';
    let label = 'Low';
    if (value >= 80) { color = 'text-emerald-500'; label = 'High'; }
    else if (value >= 60) { color = 'text-amber-400'; label = 'Moderate'; }

    // Donut via SVG
    const r = 52;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-2">
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle
                    cx="70" cy="70" r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeLinecap="round"
                    strokeDashoffset={circ / 4}
                    className={color}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                <text x="70" y="65" textAnchor="middle" className="fill-foreground" fontSize="22" fontWeight="700">
                    {value}%
                </text>
                <text x="70" y="84" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">
                    {label} similarity
                </text>
            </svg>
        </div>
    );
}

// ─── Structural comparison bar chart ─────────────────────────────────────────

function StructuralChart({ data }: { data: SimilarityAnalysisData }) {
    const barData = [
        {
            metric: 'Sentences',
            Transcript: data.structural_transcript.sentence_count,
            Speech: data.structural_speech.sentence_count,
        },
        {
            metric: 'Avg Length',
            Transcript: data.structural_transcript.avg_sentence_length,
            Speech: data.structural_speech.avg_sentence_length,
        },
        {
            metric: 'Lex Density',
            Transcript: +(data.structural_transcript.lexical_density * 100).toFixed(1),
            Speech: +(data.structural_speech.lexical_density * 100).toFixed(1),
        },
    ];

    return (
        <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Transcript" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Speech" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Order analysis donut ─────────────────────────────────────────────────────

function OrderDonut({ order }: { order: OrderAnalysis }) {
    const pieData = [
        { name: 'In order', value: order.in_order_percentage, color: '#22c55e' },
        { name: 'Out of order', value: order.out_of_order_percentage, color: '#f87171' },
    ];
    return (
        <div className="flex items-center gap-4">
            <div className="h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={30} outerRadius={52} paddingAngle={3} startAngle={90} endAngle={-270}>
                            {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}%`]} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
                {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-foreground font-medium">{d.value}%</span>
                        <span className="text-muted-foreground">{d.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Public component ─────────────────────────────────────────────────────────

type Props = { data: SimilarityAnalysisData };

export function SimilarityPanel({ data }: Props) {
    return (
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-6 py-4">
                <h2 className="text-base font-semibold text-card-foreground">Similarity & Structure Analysis</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Comparison between prepared transcript and delivered speech.
                </p>
            </div>

            <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Similarity gauge */}
                <div className="flex flex-col items-center gap-3">
                    <SimilarityGauge value={data.overall_similarity} />
                    <div className="text-center space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                            Transcript sentences: <span className="font-semibold text-foreground">{data.sentence_count_transcript}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Speech sentences: <span className="font-semibold text-foreground">{data.sentence_count_speech}</span>
                        </p>
                    </div>
                    <div className="w-full rounded-lg border border-border p-3 space-y-1">
                        <p className="text-xs font-medium text-foreground mb-1.5">Delivery order</p>
                        <OrderDonut order={data.order_analysis} />
                    </div>
                </div>

                {/* Structural comparison */}
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <p className="text-xs font-medium text-foreground mb-1">Structural Comparison</p>
                        <p className="text-xs text-muted-foreground">Transcript vs. actual speech across 3 structural dimensions.</p>
                    </div>
                    <StructuralChart data={data} />

                    {/* Stat pills */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Lex density (transcript)', value: `${(data.structural_transcript.lexical_density * 100).toFixed(0)}%` },
                            { label: 'Lex density (speech)', value: `${(data.structural_speech.lexical_density * 100).toFixed(0)}%` },
                            { label: 'Avg sen. length gap', value: `${Math.abs(data.structural_transcript.avg_sentence_length - data.structural_speech.avg_sentence_length).toFixed(1)} words` },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                                <p className="text-base font-bold text-foreground">{s.value}</p>
                                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
