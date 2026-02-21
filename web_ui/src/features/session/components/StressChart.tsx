import { useEffect, useRef, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import type { StressDataPoint } from '../types';

const MAX_POINTS = 60; // show last 60 seconds

// ─── Colour helpers ───────────────────────────────────────────────────────────

function stressColor(level: number) {
    if (level < 40) return '#22c55e'; // green
    if (level < 70) return '#f59e0b'; // amber
    return '#ef4444';                  // red
}

function stressLabel(level: number) {
    if (level < 40) return { label: 'Calm', color: 'text-emerald-500' };
    if (level < 70) return { label: 'Moderate', color: 'text-amber-400' };
    return { label: 'High', color: 'text-rose-500' };
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const { label, color } = stressLabel(val);
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
            <p className="text-muted-foreground">Stress level</p>
            <p className={`text-base font-bold ${color}`}>{val}% — {label}</p>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

type StressChartProps = {
    /** Live data pushed from outside (e.g. WebSocket). If omitted, uses simulated data. */
    data?: StressDataPoint[];
    simulate?: boolean;
};

export function StressChart({ data, simulate = true }: StressChartProps) {
    const [points, setPoints] = useState<StressDataPoint[]>(() =>
        Array.from({ length: 20 }, (_, i) => ({
            timestamp: Date.now() - (20 - i) * 1000,
            level: 30 + Math.random() * 20,
        }))
    );

    const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Simulation mode: generate random-walk stress data
    useEffect(() => {
        if (!simulate || data) return;
        simRef.current = setInterval(() => {
            setPoints((prev) => {
                const last = prev[prev.length - 1].level;
                const delta = (Math.random() - 0.45) * 8;
                const next = Math.min(100, Math.max(0, last + delta));
                const newPoint: StressDataPoint = { timestamp: Date.now(), level: Math.round(next) };
                return [...prev.slice(-MAX_POINTS + 1), newPoint];
            });
        }, 1000);
        return () => { if (simRef.current) clearInterval(simRef.current); };
    }, [simulate, data]);

    // External data mode
    useEffect(() => {
        if (data) setPoints(data.slice(-MAX_POINTS));
    }, [data]);

    const latest = points[points.length - 1]?.level ?? 0;
    const { label, color } = stressLabel(latest);
    const areaColor = stressColor(latest);

    const chartData = points.map((p) => ({
        t: new Date(p.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        level: p.level,
    }));

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-card-foreground">Live Stress Level</h2>
                    <p className="text-xs text-muted-foreground">Physiological stress index · updated every second</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live badge */}
                    <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-500">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                        LIVE
                    </span>
                    {/* Current value */}
                    <span className={`text-2xl font-bold tabular-nums ${color}`}>
                        {latest}<span className="text-sm font-normal text-muted-foreground">%</span>
                    </span>
                    <span className={`text-sm font-medium ${color}`}>{label}</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                        <defs>
                            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={areaColor} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="t"
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Zone reference lines */}
                        <ReferenceLine y={40} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.5}
                            label={{ value: 'Calm', position: 'insideTopRight', fontSize: 9, fill: '#22c55e' }} />
                        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.5}
                            label={{ value: 'High', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />

                        <Area
                            type="monotone"
                            dataKey="level"
                            stroke={areaColor}
                            strokeWidth={2}
                            fill="url(#stressGrad)"
                            dot={false}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Zone legend */}
            <div className="flex gap-5 text-xs text-muted-foreground">
                {[
                    { color: 'bg-emerald-500', label: 'Calm (0–39%)' },
                    { color: 'bg-amber-400', label: 'Moderate (40–69%)' },
                    { color: 'bg-rose-500', label: 'High (70–100%)' },
                ].map((z) => (
                    <span key={z.label} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${z.color}`} />
                        {z.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
