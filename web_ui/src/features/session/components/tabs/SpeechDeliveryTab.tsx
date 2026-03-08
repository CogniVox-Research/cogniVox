import { motion, type Variants } from 'framer-motion';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Award, TrendingUp, Volume2, Mic, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { FinishedState } from '@/lib/session';


interface SpeechDeliveryTabProps {
    state: FinishedState;
}

const SpeechDeliveryTab = ({ state }: SpeechDeliveryTabProps) => {
    const speech = state.speech_score;
    if (!speech) return <div className="p-6 text-center text-slate-500">No speech data available</div>;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' },
        },
    };

    const scoresData = [
        { name: 'Clarity', value: Math.round(speech.scores.clarity * 100) },
        { name: 'Pace', value: Math.round(speech.scores.pace * 100) },
        { name: 'Pauses', value: Math.round(speech.scores.pauses * 100) },
        { name: 'Pitch', value: Math.round(speech.scores.pitch * 100) },
        { name: 'Loudness', value: Math.round(speech.scores.loudness * 100) },
    ];

    const radarData = [
        { aspect: 'Clarity', score: speech.scores.clarity * 100, fullMark: 100 },
        { aspect: 'Pace', score: speech.scores.pace * 100, fullMark: 100 },
        { aspect: 'Pauses', score: speech.scores.pauses * 100, fullMark: 100 },
        { aspect: 'Pitch', score: speech.scores.pitch * 100, fullMark: 100 },
        { aspect: 'Loudness', score: speech.scores.loudness * 100, fullMark: 100 },
    ];

    const metricsData = [
        { metric: 'Words Per Minute (WPM)', value: speech.metrics.wpm, description: 'Speaking rate', ideal: '120-150 wpm' },
        { metric: 'Articulation Rate', value: speech.metrics.articulation_rate.toFixed(2), description: 'Syllables per second', ideal: '4-5 syl/sec' },
        { metric: 'Pitch Variability', value: speech.metrics.pitch_variability.toFixed(2), description: 'Pitch variation range', ideal: 'Higher is better' },
        { metric: 'Loudness Variance', value: speech.metrics.loudness_variance.toFixed(2), description: 'Volume variation', ideal: 'Moderate variance' },
    ];

    const pauseAnalysis = [
        { label: 'Average Pause Duration', value: speech.metrics.avg_pause.toFixed(2), unit: 'seconds' },
        { label: 'Maximum Pause Duration', value: speech.metrics.max_pause.toFixed(2), unit: 'seconds' },
        { label: 'Total Pause Count', value: speech.metrics.pause_count, unit: 'pauses' },
        { label: 'Disfluencies', value: speech.metrics.disfluencies, unit: 'occurrences' },
        { label: 'Filled Pauses (um, uh)', value: speech.metrics.filled_pauses, unit: 'occurrences' },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', label: '✓ Excellent' };
        if (score >= 60) return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', label: '~ Good' };
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', label: '⚠ Needs Improvement' };
    };

    const avgScore = Math.round(scoresData.reduce((a, b) => a + b.value, 0) / scoresData.length);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Overall Performance Card */}
            <motion.div
                variants={itemVariants}
                className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 shadow-md"
            >
                <div className="flex items-center justify-between gap-8">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Overall Performance Score</p>
                        <p className="text-slate-700 mt-2 leading-relaxed">
                            Your speech delivery achieves an overall score of <span className="font-bold text-2xl">{avgScore}/100</span>. This composite metric combines clarity, pacing, pause management, pitch variation, and loudness control into a single performance indicator.
                        </p>
                    </div>
                    <motion.div
                        className="relative w-40 h-40 shrink-0"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e7ff" strokeWidth="8" />
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - avgScore / 100)}`}
                                stroke="#6366f1"
                                strokeLinecap="round"
                                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - avgScore / 100)}` }}
                                transition={{ duration: 1 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-slate-900">{avgScore}</p>
                                <p className="text-xs text-slate-600">/ 100</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Radar Chart - Multi-dimensional Analysis */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <div className="mb-6">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Multi-Dimensional Speech Quality Analysis
                    </p>
                    <p className="text-xs text-slate-600">
                        Radar chart showing how your performance compares across five key dimensions of speech delivery. The closer to the outer edge, the better the performance in each category.
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 12 }} stroke="#64748b" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
                        <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Tooltip formatter={(value: any) => `${value.toFixed(0)}%`} />
                    </RadarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Individual Score Cards */}
            <motion.div variants={itemVariants}>
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Detailed Score Breakdown
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {scoresData.map((score, idx) => {
                        const colors = getScoreColor(score.value);
                        return (
                            <motion.div
                                key={score.name}
                                className={`${colors.bg} ${colors.border} rounded-lg p-5 border-2 shadow-sm hover:shadow-md transition-shadow`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <p className="text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">{score.name}</p>
                                <div className="relative w-full bg-slate-300 rounded-full h-3 overflow-hidden mb-3">
                                    <motion.div
                                        className={`h-full ${score.value >= 80 ? 'bg-green-500' : score.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score.value}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                    />
                                </div>
                                <p className={`text-3xl font-bold ${colors.text}`}>{score.value}</p>
                                <p className={`text-xs ${colors.text} mt-2 font-semibold`}>{colors.label}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metrics Panel */}
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-amber-600" />
                        Core Speaking Metrics
                    </p>
                    <div className="space-y-5">
                        {metricsData.map((item, idx) => (
                            <motion.div
                                key={item.metric}
                                className="pb-5 border-b border-slate-200 last:border-b-0"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">{item.metric}</p>
                                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                                        <p className="text-xs text-slate-500 mt-1">Ideal: {item.ideal}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Pause Analysis */}
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Mic className="w-5 h-5 text-purple-600" />
                        Pause & Fluency Analysis
                    </p>
                    <div className="space-y-4">
                        {pauseAnalysis.map((item, idx) => (
                            <motion.div
                                key={item.label}
                                className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                                    <span className="text-lg font-bold text-slate-900">{item.value} <span className="text-xs text-slate-500 font-normal">{item.unit}</span></span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Detailed Feedback Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Info className="w-5 h-5 text-purple-600" />
                    Comprehensive Feedback & Recommendations
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { name: 'Clarity', key: 'clarity', color: 'blue', icon: CheckCircle },
                        { name: 'Pace', key: 'pace', color: 'green', icon: TrendingUp },
                        { name: 'Pauses', key: 'pauses', color: 'yellow', icon: Volume2 },
                        { name: 'Pitch', key: 'pitch', color: 'purple', icon: Mic },
                        { name: 'Loudness', key: 'loudness', color: 'red', icon: AlertCircle },
                    ].map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <motion.div
                                key={item.key}
                                className={`bg-${item.color}-50 border-l-4 border-${item.color}-500 rounded-lg p-4`}
                                whileHover={{ scale: 1.02 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <IconComponent className={`w-5 h-5 text-${item.color}-600`} />
                                    <p className={`text-xs font-bold text-${item.color}-700 uppercase`}>{item.name}</p>
                                </div>
                                <p className={`text-sm text-${item.color}-700 leading-relaxed`}>
                                    {speech.feedback[item.key as keyof typeof speech.feedback]}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Interpretation Guide */}
            <motion.div variants={itemVariants} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <p className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    How to Interpret These Results
                </p>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>• <strong>Clarity (80-100):</strong> Speech is clear, well-articulated, and easy to understand</li>
                    <li>• <strong>Pace (80-100):</strong> Speaking speed is appropriate and maintains listener engagement</li>
                    <li>• <strong>Pauses (80-100):</strong> Pauses are strategic and enhance communication without creating awkwardness</li>
                    <li>• <strong>Pitch (80-100):</strong> Good pitch variation maintains interest and emphasizes key points</li>
                    <li>• <strong>Loudness (80-100):</strong> Volume is consistent and appropriate for the environment</li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default SpeechDeliveryTab;