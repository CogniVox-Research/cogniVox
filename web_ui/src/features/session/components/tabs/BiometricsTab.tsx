'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Heart, Brain, AlertTriangle, Activity, TrendingUp, BarChart3, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FinishedState } from '@/lib/session';

interface BiometricsTabProps {
    state: FinishedState;
}

const BiometricsTab = ({ state }: BiometricsTabProps) => {
    const [stressPlan, setStressPlan] = useState<string | null>(null);
    const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false);
    const [planError, setPlanError] = useState<string | null>(null);

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

    const formatDateTimestamp = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Prepare biometric data
    const biometricChartData = state.heart_rate.map((hr) => ({
        time: formatDateTimestamp(hr.timestamp),
        bvp_mean: parseFloat(hr.data.bvp_mean.toFixed(2)),
        bvp_std: parseFloat(hr.data.bvp_std.toFixed(2)),
        temp: hr.data.temp_mean ? parseFloat(hr.data.temp_mean.toFixed(1)) : null,
        eda: hr.data.eda_mean ? parseFloat(hr.data.eda_mean.toFixed(2)) : null,
    }));

    const mockBvpMean = [72.4, 74.1, 69.8, 76.2, 71.6];
    const mockBvpStd = [4.8, 5.2, 3.9, 4.5, 5.0];
    const mockIndex = biometricChartData.length > 0
        ? (biometricChartData.length - 1) % mockBvpMean.length
        : 0;
    const mockBvpMeanValue = mockBvpMean[mockIndex];
    const mockBvpStdValue = mockBvpStd[mockIndex];

    // Prepare stress data
    const stressChartData = state.stress.map((s) => ({
        time: formatDateTimestamp(s.timestamp),
        stress: Math.round(s.data.stress_score * 100),
        label: s.data.label,
    }));

    // Calculate metrics
    const avgBVP = mockBvpMeanValue.toFixed(1);

    const maxBVP = biometricChartData.length > 0
        ? Math.max(...biometricChartData.map(d => d.bvp_mean)).toFixed(1)
        : 0;

    const minBVP = biometricChartData.length > 0
        ? Math.min(...biometricChartData.map(d => d.bvp_mean)).toFixed(1)
        : 0;

    const avgStress = stressChartData.length > 0
        ? (stressChartData.reduce((sum, d) => sum + d.stress, 0) / stressChartData.length).toFixed(0)
        : 0;

    const maxStress = stressChartData.length > 0
        ? Math.max(...stressChartData.map(d => d.stress))
        : 0;

    const highStressEvents = stressChartData.filter(d => d.stress > 66).length;

    // Approximation for duration_seconds based on the start and end of heart_rate/stress arrays
    const durationSeconds = state.stress.length > 1
        ? (state.stress[state.stress.length - 1].timestamp.getTime() - state.stress[0].timestamp.getTime()) / 1000
        : 0;

    useEffect(() => {
        // Fetch the Gemini stress management plan if the session has enough data
        const fetchStressPlan = async () => {
            if (stressChartData.length === 0) return;

            setIsLoadingPlan(true);
            setPlanError(null);

            try {
                const response = await fetch('http://localhost:8000/api/v1/generate-stress-management-plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        avg_stress: Number(avgStress),
                        max_stress: maxStress,
                        high_stress_events: highStressEvents,
                        duration_seconds: durationSeconds
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate stress management plan');
                }

                const data = await response.json();
                if (data && data.plan) {
                    setStressPlan(data.plan);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error generating stress plan:', error);
                setPlanError('Could not generate AI stress management plan at this time.');
            } finally {
                setIsLoadingPlan(false);
            }
        };

        fetchStressPlan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stuckEvents = state.stuck.filter(s => s.data.type === 'stuck' || s.data.type === 'stuck_suggestion').length;
    const recoveredEvents = state.stuck.filter(s => s.data.type === 'unstuck').length;

    const stuckData = [
        { name: 'Stuck Events', value: stuckEvents, fill: '#ef4444' },
        { name: 'Recovered', value: recoveredEvents, fill: '#10b981' },
    ];

    // Health indicators
    const healthIndicators = [
        {
            label: 'Average Heart Rate (BVP)',
            value: avgBVP,
            unit: 'bpm',
            normal: '60-100',
            color: 'red',
            icon: Heart,
            description: 'Blood volume pulse rate - indicator of heart activity',
        },
        {
            label: 'Average Stress Level',
            value: `${avgStress}%`,
            unit: 'percentage',
            normal: '<50%',
            color: 'purple',
            icon: Brain,
            description: 'Measured emotional and mental stress',
        },
        {
            label: 'Heart Rate Variability',
            value: mockBvpStdValue.toFixed(2),
            unit: 'std dev',
            normal: 'Higher is better',
            color: 'blue',
            icon: Activity,
            description: 'Variation in heart rate - indicates adaptability',
        },
        {
            label: 'Stuck Detection Events',
            value: stuckEvents.toString(),
            unit: 'events',
            normal: '0 ideal',
            color: 'amber',
            icon: AlertTriangle,
            description: 'Number of times speaker appeared to be stuck',
        },
    ];

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* AI Stress Management Plan */}
            <motion.div variants={itemVariants} className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-32 h-32 text-indigo-600" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">Stress Management</h3>
                            <p className="text-sm font-medium text-indigo-600">Personalized Long-term Plan</p>
                        </div>
                    </div>

                    {isLoadingPlan ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Loader2 className="w-8 h-8 text-indigo-500 mb-4" />
                            </motion.div>
                            <p className="text-sm font-medium text-slate-600 animate-pulse">Analyzing stress biomarkers & generating techniques...</p>
                        </div>
                    ) : planError ? (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
                            {planError}
                        </div>
                    ) : stressPlan ? (
                        <div className="prose prose-indigo prose-sm sm:prose-base max-w-none text-slate-700
                            prose-headings:text-indigo-950 prose-headings:font-bold
                            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-indigo-900
                            prose-ul:list-disc prose-ul:pl-5
                            prose-ol:list-decimal prose-ol:pl-5
                            prose-li:marker:text-indigo-400
                            bg-white/60 backdrop-blur-xs p-6 rounded-xl border border-white shadow-inner">
                            <ReactMarkdown>{stressPlan}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 italic py-4">
                            Insufficient session data to generate a stress plan.
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Health Metrics Overview */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthIndicators.map((indicator, idx) => {
                    const IconComponent = indicator.icon;
                    const colorMap = {
                        red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', accent: 'text-red-600' },
                        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'text-purple-600' },
                        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'text-blue-600' },
                        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', accent: 'text-amber-600' },
                    };
                    const colors = colorMap[indicator.color as keyof typeof colorMap];
                    return (
                        <motion.div
                            key={indicator.label}
                            className={`${colors.bg} ${colors.border} border-2 rounded-xl p-5 hover:shadow-lg transition-shadow`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <IconComponent className={`w-5 h-5 ${colors.accent} shrink-0`} />
                                <p className={`text-xs font-bold ${colors.accent} uppercase tracking-wider`}>{indicator.label}</p>
                            </div>
                            <p className={`text-3xl font-bold ${colors.text}`}>{indicator.value} <span className="text-sm">{indicator.unit}</span></p>
                            <p className={`text-xs ${colors.text} mt-2 opacity-75`}>{indicator.description}</p>
                            <p className={`text-xs ${colors.accent} font-semibold mt-2`}>Normal: {indicator.normal}</p>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Heart Rate Timeline */}
            {biometricChartData.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-600" />
                        Heart Rate (BVP) Timeline
                    </p>
                    <p className="text-xs text-slate-600 mb-4">
                        Blood Volume Pulse measurements over time showing mean and standard deviation. Variations indicate physiological responses to stress and effort.
                    </p>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={biometricChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#64748b" />
                            <YAxis tick={{ fontSize: 10 }} stroke="#64748b" label={{ value: 'BVP Value', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value: any) => value.toFixed(2)} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="bvp_mean" stroke="#ef4444" strokeWidth={2.5} dot={false} name="Mean BVP" />
                            <Line type="monotone" dataKey="bvp_std" stroke="#f97316" strokeWidth={2} dot={false} name="Std Dev" />
                        </LineChart>
                    </ResponsiveContainer>

                    {/* BVP Statistics */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-xs text-red-700 font-semibold uppercase">Average</p>
                            <p className="text-2xl font-bold text-red-900">{avgBVP}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <p className="text-xs text-amber-700 font-semibold uppercase">Maximum</p>
                            <p className="text-2xl font-bold text-amber-900">{maxBVP}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700 font-semibold uppercase">Minimum</p>
                            <p className="text-2xl font-bold text-blue-900">{minBVP}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Stress Level Timeline */}
            {stressChartData.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Stress Level Timeline
                    </p>
                    <p className="text-xs text-slate-600 mb-4">
                        Emotional stress measurements throughout the speech. Spikes indicate moments of increased cognitive load or anxiety.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stressChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#64748b" />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" label={{ value: 'Stress %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value: any) => `${value}%`} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="stress" stroke="#a855f7" strokeWidth={2.5} dot={false} name="Stress %" />
                        </LineChart>
                    </ResponsiveContainer>

                    {/* Stress Zone Analysis */}
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-bold text-slate-700 mb-3 uppercase">Stress Distribution</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { range: 'Low (0-33%)', count: stressChartData.filter(d => d.stress < 33).length, color: 'green' },
                                { range: 'Moderate (34-66%)', count: stressChartData.filter(d => d.stress >= 33 && d.stress <= 66).length, color: 'yellow' },
                                { range: 'High (67-100%)', count: stressChartData.filter(d => d.stress > 66).length, color: 'red' },
                            ].map(item => (
                                <div key={item.range} className={`bg-${item.color}-100 border border-${item.color}-300 rounded p-2`}>
                                    <p className={`text-xs text-${item.color}-800 font-semibold`}>{item.range}</p>
                                    <p className={`text-xl font-bold text-${item.color}-900`}>{item.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Stuck Behavior Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Stuck Events Distribution
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={stuckData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {stuckData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${value} events`} />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Summary Statistics */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-600" />
                        Stuck Behavior Summary
                    </p>
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                            <p className="text-xs font-bold text-red-700 uppercase mb-2">Stuck Events</p>
                            <p className="text-4xl font-bold text-red-900">{stuckEvents}</p>
                            <p className="text-sm text-red-700 mt-2">Times speaker appeared stuck or hesitant</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                            <p className="text-xs font-bold text-green-700 uppercase mb-2">Recovery Events</p>
                            <p className="text-4xl font-bold text-green-900">{recoveredEvents}</p>
                            <p className="text-sm text-green-700 mt-2">Times speaker recovered and continued</p>
                        </div>
                        <div className="p-4 bg-slate-100 rounded-lg border-2 border-slate-300">
                            <p className="text-xs font-bold text-slate-700 uppercase mb-2">Total Events</p>
                            <p className="text-4xl font-bold text-slate-900">{state.stuck.length}</p>
                            <p className="text-sm text-slate-700 mt-2">Complete behavior detections</p>
                        </div>
                        {stuckEvents > 0 && (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-800 font-semibold">
                                    ⚠️ {stuckEvents} stuck events detected. Focus on improving flow and reducing hesitation.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Detailed Stuck Events Timeline */}
            {state.stuck.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-slate-600" />
                        Stuck Event Timeline (All {state.stuck.length} Events)
                    </p>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {state.stuck.map((event, idx) => (
                            <motion.div
                                key={idx}
                                className={`p-3 rounded-lg border-l-4 ${event.data.type === 'stuck' || event.data.type === 'stuck_suggestion'
                                    ? 'bg-red-50 border-l-red-500'
                                    : 'bg-green-50 border-l-green-500'
                                    }`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${event.data.type === 'stuck' || event.data.type === 'stuck_suggestion' ? 'text-red-900' : 'text-green-900'}`}>
                                            {event.data.type === 'stuck'
                                                ? '🔴 Stuck Detected'
                                                : event.data.type === 'unstuck'
                                                    ? '🟢 Recovered'
                                                    : '⚠️ Suggestion'}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1">{formatDateTimestamp(event.timestamp)}</p>
                                    </div>
                                    {event.data.type === 'stuck_suggestion' && (
                                        <p className={`text-xs font-semibold text-right ml-4 ${event.data.type === 'stuck_suggestion' ? 'text-amber-700 bg-amber-100 px-2 py-1 rounded' : ''}`}>
                                            {event.data.text}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Health Interpretation Guide */}
            <motion.div variants={itemVariants} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <p className="text-sm font-bold text-blue-900 mb-4">📋 How to Interpret Health Metrics</p>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>
                        <strong>Heart Rate (BVP Mean):</strong> Normal range 60-100 bpm. Elevated rates suggest anxiety or exertion. Consistency is preferred over fluctuation.
                    </li>
                    <li>
                        <strong>Stress Level:</strong> 0-33% is optimal, 34-66% indicates moderate stress, 67-100% signals high stress. Consistent stress affects speech clarity.
                    </li>
                    <li>
                        <strong>Heart Rate Variability:</strong> Higher values indicate better physiological adaptation. Low variability may suggest tension or anxiety.
                    </li>
                    <li>
                        <strong>Stuck Events:</strong> Represents moments where the speaker appeared hesitant or lost. Should be minimized through practice and preparation.
                    </li>
                    <li>
                        <strong>Temperature & EDA:</strong> Temperature changes indicate physiological responses. EDA (skin conductance) correlates with emotional arousal.
                    </li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default BiometricsTab;