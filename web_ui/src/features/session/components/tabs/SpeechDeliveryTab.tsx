import type { FinishedState } from '@/lib/session';
import { motion, type Variants } from 'framer-motion';
import {
    Activity,
    Mic,
    Clock,
    Volume2,
    AlertCircle,
    BarChart2,
    StopCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface SpeechDeliveryTabProps {
    state: FinishedState;
}

const SpeechDeliveryTab = ({ state }: SpeechDeliveryTabProps) => {
    const sds = state.speech_score;

    if (!sds) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No Speech Delivery Data</h3>
                <p className="text-muted-foreground max-w-md">
                    Speech delivery scores are currently unavailable for this session. This may happen if the session was too short or no audio was detected.
                </p>
            </div>
        );
    }

    const { delivery, scores, feedback, metrics } = sds;

    const getScoreColor = (val: number, max = 5) => {
        const ratio = val / max;
        if (ratio >= 0.8) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        if (ratio >= 0.5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    };

    const getProgressColor = (val: number, max = 5) => {
        const ratio = val / max;
        if (ratio >= 0.8) return "bg-emerald-500";
        if (ratio >= 0.5) return "bg-amber-500";
        return "bg-rose-500";
    };

    const categoryScores = [
        { key: 'clarity', label: 'Clarity', value: scores.clarity, desc: feedback.clarity, icon: Mic },
        { key: 'pace', label: 'Pace', value: scores.pace, desc: feedback.pace, icon: Clock },
        { key: 'pauses', label: 'Pauses', value: scores.pauses, desc: feedback.pauses, icon: StopCircle },
        { key: 'pitch', label: 'Pitch', value: scores.pitch, desc: feedback.pitch, icon: Activity },
        { key: 'loudness', label: 'Loudness', value: scores.loudness, desc: feedback.loudness, icon: Volume2 },
    ];

    const rawMetrics = [
        { label: 'Words Per Minute', value: metrics.wpm.toFixed(1), unit: 'wpm' },
        { label: 'Avg Pause', value: metrics.avg_pause.toFixed(2), unit: 's' },
        { label: 'Max Pause', value: metrics.max_pause.toFixed(2), unit: 's' },
        { label: 'Pause Count', value: metrics.pause_count, unit: '' },
        { label: 'Pitch Var.', value: metrics.pitch_variability.toFixed(2), unit: 'Hz' },
        { label: 'Disfluencies', value: metrics.disfluencies, unit: '' },
        { label: 'Filled Pauses', value: metrics.filled_pauses, unit: '' },
        { label: 'Artic. Rate', value: metrics.articulation_rate.toFixed(2), unit: 'syl/s' },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Overall Score Card */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                    <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Overall Delivery</h3>

                    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <motion.circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="439.8"
                                strokeDashoffset={439.8 - (439.8 * (delivery.delivery_score / 5))}
                                strokeLinecap="round"
                                className={cn("transition-all duration-1000 ease-out fill-transparent", getScoreColor(delivery.delivery_score).split(' ')[0])}
                                initial={{ strokeDashoffset: 439.8 }}
                                animate={{ strokeDashoffset: 439.8 - (439.8 * (delivery.delivery_score / 5)) }}
                            />
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-5xl font-bold tracking-tighter">
                                {delivery.delivery_score.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground mt-1">out of 5</span>
                        </div>
                    </div>

                    <div className={cn("px-4 py-1.5 rounded-full border text-sm font-medium mt-2", getScoreColor(delivery.delivery_score))}>
                        {delivery.delivery_score_label}
                    </div>
                </motion.div>

                {/* Category Breakdown (Scores) */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <BarChart2 className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Category Breakdown</h3>
                    </div>

                    <div className="space-y-7">
                        {categoryScores.map((cat, idx) => {
                            const Icon = cat.icon;
                            return (
                                <div key={idx} className="flex flex-col gap-2 group">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors border border-border/50">
                                                <Icon className="w-4 h-4 text-foreground/80" />
                                            </div>
                                            <span className="font-medium text-[15px]">{cat.label}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-semibold">{cat.value.toFixed(1)}</span>
                                            <span className="text-sm text-muted-foreground">/ 5</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn("h-full rounded-full", getProgressColor(cat.value))}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(Math.min(cat.value, 5) / 5) * 100}%` }}
                                            transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground pt-1.5 pl-12 leading-relaxed">
                                        {cat.desc}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
                        {/* AI feedback */}
                <div>
                    {feedback.context_summary}
                </div>

                {/* Raw Metrics */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Raw Metrics
                    </h3>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {rawMetrics.map((metric, idx) => (
                            <div key={idx} className="bg-muted/20 hover:bg-muted/40 transition-colors p-4 rounded-xl flex flex-col gap-1 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{metric.label}</span>
                                <div className="flex items-baseline gap-1 mt-auto pt-2">
                                    <span className="text-xl font-semibold">{metric.value}</span>
                                    {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SpeechDeliveryTab;