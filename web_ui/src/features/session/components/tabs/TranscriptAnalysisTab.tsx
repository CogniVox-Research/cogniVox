'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { AlertTriangle, CheckCircle, TrendingDown, BarChart3, Info, Copy } from 'lucide-react';
import type { Alignment } from '@/lib/types';
import type { FinishedState } from '@/lib/session';

interface TranscriptAnalysisTabProps {
    state: FinishedState;
}

const TranscriptAnalysisTab = ({ state }: TranscriptAnalysisTabProps) => {
    const transcript = state.transcript_analysis;
    const [expandedAlignment, setExpandedAlignment] = useState<number | null>(0);

    if (!transcript) return <div className="p-6 text-center text-slate-500">No transcript data available</div>;

    const { similarity, grammar } = transcript;

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

    // Key metrics for overview
    const overviewMetrics = [
        {
            label: 'Overall Similarity',
            value: (similarity.overall_similarity * 100).toFixed(1),
            unit: '%',
            color: 'blue',
            description: 'How well the speech aligns with transcript content',
        },
        {
            label: 'In-Order Points',
            value: similarity.order_analysis.in_order_percentage.toFixed(1),
            unit: '%',
            color: 'green',
            description: 'Points covered in correct sequence',
        },
        {
            label: 'Out-of-Order Points',
            value: similarity.order_analysis.out_of_order_percentage.toFixed(1),
            unit: '%',
            color: 'amber',
            description: 'Points covered but in wrong order',
        },
        {
            label: 'Missing Points',
            value: similarity.missing_points.length,
            unit: 'points',
            color: 'red',
            description: 'Key points not mentioned in speech',
        },
    ];

    // Structural comparison data
    const structuralComparison = [
        {
            name: 'Transcript',
            sentences: similarity.structural_transcript.sentence_count,
            avgLength: similarity.structural_transcript.avg_sentence_length,
            lexical: (similarity.structural_transcript.lexical_density * 100).toFixed(1),
        },
        {
            name: 'Speech',
            sentences: similarity.structural_speech.sentence_count,
            avgLength: similarity.structural_speech.avg_sentence_length,
            lexical: (similarity.structural_speech.lexical_density * 100).toFixed(1),
        },
    ];

    // Alignment quality distribution
    const alignmentDistribution = similarity.alignment.map((align, idx) => ({
        id: idx,
        similarity: Math.round(align.similarity * 100),
        type: align.paraphrase_type,
    }));

    // Sort alignments by similarity score
    const alignmentsSorted = [...similarity.alignment].sort((a, b) => b.similarity - a.similarity);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Overview Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewMetrics.map((metric, idx) => {
                    const colorMap = {
                        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'text-blue-600' },
                        green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'text-green-600' },
                        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', accent: 'text-amber-600' },
                        red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', accent: 'text-red-600' },
                    };
                    const colors = colorMap[metric.color as keyof typeof colorMap];
                    return (
                        <motion.div
                            key={metric.label}
                            className={`${colors.bg} ${colors.border} border-2 rounded-xl p-5`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <p className={`text-xs font-bold ${colors.accent} uppercase tracking-wider mb-1`}>{metric.label}</p>
                            <p className={`text-3xl font-bold ${colors.text}`}>{metric.value} <span className="text-sm">{metric.unit}</span></p>
                            <p className={`text-xs ${colors.text} mt-2 opacity-75`}>{metric.description}</p>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Structural Comparison */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Structural Analysis: Transcript vs Speech
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Sentence Count */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-bold text-slate-700 uppercase mb-4">Sentence Count Comparison</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={structuralComparison}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                                <Tooltip formatter={(value: any) => value} />
                                <Bar dataKey="sentences" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Avg Sentence Length */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-bold text-slate-700 uppercase mb-4">Avg Sentence Length (words)</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={structuralComparison}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                                <Tooltip formatter={(value: any) => value.toFixed(1)} />
                                <Bar dataKey="avgLength" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Lexical Density */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-bold text-slate-700 uppercase mb-4">Lexical Density (%)</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={structuralComparison.map(s => ({ name: s.name, value: parseFloat(s.lexical) }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
                                <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Metrics Table */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-300">
                                <th className="text-left py-2 px-3 font-bold text-slate-900">Metric</th>
                                <th className="text-right py-2 px-3 font-bold text-slate-900">Transcript</th>
                                <th className="text-right py-2 px-3 font-bold text-slate-900">Speech</th>
                                <th className="text-right py-2 px-3 font-bold text-slate-900">Difference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                {
                                    name: 'Sentence Count',
                                    transcript: similarity.structural_transcript.sentence_count,
                                    speech: similarity.structural_speech.sentence_count,
                                },
                                {
                                    name: 'Avg Sentence Length',
                                    transcript: similarity.structural_transcript.avg_sentence_length.toFixed(2),
                                    speech: similarity.structural_speech.avg_sentence_length.toFixed(2),
                                },
                                {
                                    name: 'Lexical Density',
                                    transcript: (similarity.structural_transcript.lexical_density * 100).toFixed(1) + '%',
                                    speech: (similarity.structural_speech.lexical_density * 100).toFixed(1) + '%',
                                },
                            ].map((row) => (
                                <tr key={row.name} className="border-b border-slate-200 hover:bg-white">
                                    <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                                    <td className="text-right py-3 px-3 text-slate-700">{row.transcript}</td>
                                    <td className="text-right py-3 px-3 text-slate-700">{row.speech}</td>
                                    <td className="text-right py-3 px-3 text-slate-700 font-semibold">
                                        {typeof row.transcript === 'number' && typeof row.speech === 'number'
                                            ? `${((row.transcript - row.speech) / row.transcript * 100).toFixed(0)}%`
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Alignment Quality Distribution */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                    Sentence Alignment Quality Distribution
                </p>
                <p className="text-xs text-slate-600 mb-4">
                    Showing similarity scores for each transcript sentence matched against the speech content. Higher scores indicate better alignment.
                </p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={alignmentDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="id" label={{ value: 'Sentence Pair Index', position: 'bottom' }} tick={{ fontSize: 9 }} stroke="#64748b" />
                        <YAxis label={{ value: 'Similarity %', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 10 }} stroke="#64748b" domain={[0, 100]} />
                        <Tooltip formatter={(value: any) => `${value}%`} />
                        <Bar dataKey="similarity" radius={[4, 4, 0, 0]}>
                            {alignmentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.similarity > 50 ? '#10b981' : entry.similarity > 25 ? '#f59e0b' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Sentence Count Comparison */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-2 tracking-wider">Transcript Sentence Count</p>
                    <p className="text-4xl font-bold text-blue-900">{similarity.sentence_count_transcript}</p>
                    <p className="text-sm text-blue-700 mt-2">Total sentences in original transcript</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                    <p className="text-xs font-bold text-green-600 uppercase mb-2 tracking-wider">Speech Sentence Count</p>
                    <p className="text-4xl font-bold text-green-900">{similarity.sentence_count_speech}</p>
                    <p className="text-sm text-green-700 mt-2">Total sentences delivered in speech</p>
                </div>
            </motion.div>

            {/* Detailed Alignment Analysis */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Copy className="w-5 h-5 text-teal-600" />
                    Sentence-by-Sentence Alignment Details ({alignmentsSorted.length} alignments)
                </p>
                <p className="text-xs text-slate-600 mb-4">
                    Detailed breakdown of how each transcript sentence maps to the speech content. Click to expand for full details.
                </p>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {alignmentsSorted.map((alignment, idx) => {
                        const similarityScore = Math.round(alignment.similarity * 100);
                        const isExpanded = expandedAlignment === idx;
                        return (
                            <motion.div
                                key={idx}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${similarityScore > 50
                                        ? 'bg-green-50 border-green-200'
                                        : similarityScore > 25
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-red-50 border-red-200'
                                    }`}
                                onClick={() => setExpandedAlignment(isExpanded ? null : idx)}
                                whileHover={{ scale: 1.01 }}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xs font-bold bg-slate-200 text-slate-900 px-3 py-1 rounded-full">Sentence {idx + 1}</span>
                                            <div className="relative w-32 h-2.5 bg-slate-300 rounded-full overflow-hidden shadow-sm">
                                                <motion.div
                                                    className={`h-full ${similarityScore > 50 ? 'bg-green-500' : similarityScore > 25 ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${similarityScore}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold font-mono">{similarityScore}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${alignment.paraphrase_type === 'Exact' ? 'bg-green-200 text-green-800' :
                                                    alignment.paraphrase_type === 'Paraphrase' ? 'bg-blue-200 text-blue-800' :
                                                        alignment.paraphrase_type === 'Missing' ? 'bg-red-200 text-red-800' :
                                                            'bg-amber-200 text-amber-800'
                                                }`}>
                                                {alignment.paraphrase_type}
                                            </span>
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-slate-600 ml-4"
                                    >
                                        ▼
                                    </motion.div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 border-t border-slate-300 pt-4 mt-4"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 uppercase mb-2 tracking-wider">📄 Transcript Sentence:</p>
                                                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
                                                    <p className="text-sm text-slate-900 leading-relaxed">
                                                        {alignment.transcript_sentence}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 uppercase mb-2 tracking-wider">🎤 Closest Speech Sentence:</p>
                                                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
                                                    <p className="text-sm text-slate-900 leading-relaxed">
                                                        {alignment.closest_speech_sentence}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white p-3 rounded-lg border border-slate-300">
                                                    <p className="text-xs text-slate-600 font-bold uppercase mb-1">Similarity Score</p>
                                                    <p className="text-2xl font-bold text-slate-900">{similarityScore}<span className="text-sm text-slate-600">%</span></p>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-slate-300">
                                                    <p className="text-xs text-slate-600 font-bold uppercase mb-1">Alignment Type</p>
                                                    <p className="text-sm text-slate-900 font-bold">{alignment.paraphrase_type}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-slate-300">
                                                    <p className="text-xs text-slate-600 font-bold uppercase mb-1">Quality</p>
                                                    <p className="text-sm font-bold">
                                                        {similarityScore > 50 ? '✓ Good' : similarityScore > 25 ? '~ Fair' : '✗ Poor'}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Key Points Analysis - Expanded to show both Transcript and Speech */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Key Points Comparison
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Expected Key Points from Transcript */}
                    <div>
                        <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            Expected Key Points from Transcript ({similarity.key_points_transcript.length})
                        </p>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {similarity.key_points_transcript.length > 0 ? (
                                similarity.key_points_transcript.map((point, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                    >
                                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-700 leading-relaxed">{point}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">No expected key points</p>
                            )}
                        </div>
                    </div>

                    {/* Covered Key Points from Speech */}
                    <div>
                        <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Covered Key Points in Speech ({similarity.key_points_speech.length})
                        </p>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {similarity.key_points_speech.length > 0 ? (
                                similarity.key_points_speech.map((point, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                    >
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-700 leading-relaxed">{point}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">No covered key points detected</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Missing Points - Increased Height */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Missing Key Points ({similarity.missing_points.length})
                </p>
                <p className="text-xs text-slate-600 mb-4">
                    These key points from the transcript were not mentioned or were insufficiently covered in the speech.
                </p>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {similarity.missing_points.length > 0 ? (
                        similarity.missing_points.map((point, idx) => (
                            <motion.div
                                key={idx}
                                className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border-l-4 border-l-amber-500 hover:bg-amber-100 transition-colors shadow-sm"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                            >
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-slate-900 leading-relaxed font-medium">{point}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600 font-semibold">All key points covered!</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Redundant Speech Segments */}
            {similarity.redundant_speech_segments && similarity.redundant_speech_segments.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Redundant Speech Segments ({similarity.redundant_speech_segments.length})
                    </p>
                    <p className="text-xs text-slate-600 mb-4">
                        These segments were found in both the speech and transcript, indicating potential repetition or overlap in content delivery. The similarity score shows how closely they match.
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {similarity.redundant_speech_segments.map(([speechSentence, transcriptSentence, similarityScore], idx) => {
                            const similarityPercent = Math.round(similarityScore * 100);
                            return (
                                <motion.div
                                    key={idx}
                                    className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-l-orange-500 hover:bg-orange-100 transition-colors shadow-sm"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <TrendingDown className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        {/* Speech Sentence */}
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-orange-700 uppercase mb-1">🎤 Spoken Segment:</p>
                                            <p className="text-sm text-slate-900 leading-relaxed bg-white p-2 rounded border border-orange-200 italic">
                                                "{speechSentence}"
                                            </p>
                                        </div>

                                        {/* Transcript Sentence */}
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-slate-700 uppercase mb-1">📄 Also In Transcript:</p>
                                            <p className="text-sm text-slate-800 leading-relaxed bg-white p-2 rounded border border-slate-300 italic">
                                                "{transcriptSentence}"
                                            </p>
                                        </div>

                                        {/* Similarity Score */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="relative w-full h-2.5 bg-slate-300 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${similarityPercent}%` }}
                                                        transition={{ duration: 0.6, delay: 0.2 }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-orange-700 whitespace-nowrap">{similarityPercent}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Redundancy Interpretation */}
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-800 font-semibold">
                            💡 <strong>Tip:</strong> Redundant segments reduce presentation clarity. Consider removing or rephrasing to maintain audience engagement.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Grammar Corrections */}
            {grammar.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-6">Grammar Corrections ({grammar.length})</p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {grammar.map((item, idx) => (
                            <motion.div
                                key={idx}
                                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-red-600 uppercase mb-2">Incorrect</p>
                                        <p className="text-sm text-red-800 bg-red-50 p-3 rounded border border-red-200 line-through">{item.original}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-green-600 uppercase mb-2">Corrected</p>
                                        <p className="text-sm text-green-800 bg-green-50 p-3 rounded border border-green-200">{item.corrected}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Analysis Summary */}
            <motion.div variants={itemVariants} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <p className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Analysis Summary & Interpretation
                </p>
                <ul className="space-y-3 text-sm text-blue-800">
                    <li>
                        <strong>Overall Similarity ({(similarity.overall_similarity * 100).toFixed(1)}%):</strong> This indicates how well your speech content aligns with the expected transcript. Lower scores suggest significant deviations or missing content.
                    </li>
                    <li>
                        <strong>Word Order ({similarity.order_analysis.in_order_percentage.toFixed(1)}% in-order):</strong> Percentage of points covered in the correct sequence. Deviations may indicate organizational issues.
                    </li>
                    <li>
                        <strong>Missing Points ({similarity.missing_points.length}):</strong> Key concepts from the transcript not mentioned in your speech. These should be addressed in future presentations.
                    </li>
                    <li>
                        <strong>Structural Metrics:</strong> Differences in sentence count and length indicate speaking style variations. Lexical density shows vocabulary richness.
                    </li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default TranscriptAnalysisTab;