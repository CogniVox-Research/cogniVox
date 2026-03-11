'use client';

import { motion, type Variants } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
} from 'recharts';
import { CheckCircle, AlertCircle, TrendingUp, Target, Award, BarChart3, Info } from 'lucide-react';
import type { FinishedState } from '@/lib/session';
import { json } from 'zod';

interface QnATabProps {
    state: FinishedState;
}

const QuestionResultsTab = ({ state }: QnATabProps) => {
    const answerScore = state.answer_score;

    if (!answerScore) {
        return <div className="p-6 text-center text-slate-500">No answer score data available</div>;
    }

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

    // Calculate statistics
    const totalQuestions = answerScore.results.length;
    const matchingQuestions = answerScore.results.filter((r) => r.is_matching).length;
    const nonMatchingQuestions = totalQuestions - matchingQuestions;
    const averagePercentage =
        answerScore.results.length > 0
            ? (
                answerScore.results.reduce((sum, r) => sum + r.matching_percentage, 0) /
                answerScore.results.length
            ).toFixed(1)
            : 0;

    // Prepare chart data
    const chartData = answerScore.results.map((result, idx) => ({
        id: idx,
        question: `Q${idx + 1}`,
        percentage: Math.round(result.matching_percentage * 100),
        matching: result.is_matching ? 1 : 0,
        full_question: result.question,
    }));

    const scoreDistribution = [
        { range: 'Excellent (80-100%)', count: chartData.filter((d) => d.percentage >= 80).length },
        { range: 'Good (60-79%)', count: chartData.filter((d) => d.percentage >= 60 && d.percentage < 80).length },
        { range: 'Fair (40-59%)', count: chartData.filter((d) => d.percentage >= 40 && d.percentage < 60).length },
        { range: 'Poor (<40%)', count: chartData.filter((d) => d.percentage < 40).length },
    ];

    const scorePieData = [
        { name: 'Matching', value: matchingQuestions, fill: '#10b981' },
        { name: 'Not Matching', value: nonMatchingQuestions, fill: '#ef4444' },
    ];

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', accent: 'text-green-600' };
        if (percentage >= 60) return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', accent: 'text-blue-600' };
        if (percentage >= 40) return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', accent: 'text-amber-600' };
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', accent: 'text-red-600' };
    };

    const getScoreLabel = (percentage: number) => {
        if (percentage >= 80) return '✓ Excellent';
        if (percentage >= 60) return '✓ Good';
        if (percentage >= 40) return '~ Fair';
        return '✗ Poor';
    };

    const overallScorePercent = Math.round(answerScore.overall_score * 100);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Overall Score Card */}
            <motion.div
                variants={itemVariants}
                className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 shadow-md"
            >
                <div className="flex items-center justify-between gap-8">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Overall Answer Score</p>
                        <p className="text-slate-700 mt-3 leading-relaxed">
                            Your answers achieved an overall score of <span className="font-bold text-3xl text-blue-600">{overallScorePercent}%</span>. This represents how well your responses matched the expected answers across all questions.
                        </p>
                        <div className="mt-4 flex gap-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-slate-700"><strong>{matchingQuestions}</strong> Matching</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm text-slate-700"><strong>{nonMatchingQuestions}</strong> Not Matching</span>
                            </div>
                        </div>
                    </div>

                    {/* Circular Score */}
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
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - overallScorePercent / 100)}`}
                                stroke={overallScorePercent >= 80 ? '#10b981' : overallScorePercent >= 60 ? '#3b82f6' : overallScorePercent >= 40 ? '#f59e0b' : '#ef4444'}
                                strokeLinecap="round"
                                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - overallScorePercent / 100)}` }}
                                transition={{ duration: 1 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-slate-900">{overallScorePercent}</p>
                                <p className="text-xs text-slate-600">/ 100</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Summary Statistics */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Matching Questions</p>
                    <p className="text-4xl font-bold text-green-900">{matchingQuestions}</p>
                    <p className="text-sm text-green-700 mt-2">{((matchingQuestions / totalQuestions) * 100).toFixed(0)}% of total</p>
                </div>

                <div className="bg-red-50 rounded-lg p-5 border-2 border-red-200">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Not Matching</p>
                    <p className="text-4xl font-bold text-red-900">{nonMatchingQuestions}</p>
                    <p className="text-sm text-red-700 mt-2">{((nonMatchingQuestions / totalQuestions) * 100).toFixed(0)}% of total</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Average Match %</p>
                    <p className="text-4xl font-bold text-blue-900">{averagePercentage}%</p>
                    <p className="text-sm text-blue-700 mt-2">Avg answer accuracy</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Total Questions</p>
                    <p className="text-4xl font-bold text-purple-900">{totalQuestions}</p>
                    <p className="text-sm text-purple-700 mt-2">Questions answered</p>
                </div>
            </motion.div>

            {/* Score Distribution Charts */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Answer Matching Percentage by Question
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="question" tick={{ fontSize: 10 }} stroke="#64748b" />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value: any) => `${value}%`} />
                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.percentage >= 80 ? '#10b981' : entry.percentage >= 60 ? '#3b82f6' : entry.percentage >= 40 ? '#f59e0b' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        Matching vs Not Matching
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={scorePieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {scorePieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${value} questions`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Score Distribution Table */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Score Range Distribution
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {scoreDistribution.map((dist, idx) => {
                        const colorMap = {
                            0: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900' },
                            1: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900' },
                            2: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900' },
                            3: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900' },
                        };
                        const colors = colorMap[idx as keyof typeof colorMap];
                        return (
                            <motion.div
                                key={dist.range}
                                className={`${colors.bg} rounded-lg p-4 border-2 ${colors.border}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <p className={`text-xs font-bold ${colors.text} uppercase mb-2`}>{dist.range}</p>
                                <p className={`text-3xl font-bold ${colors.text}`}>{dist.count}</p>
                                <p className={`text-xs ${colors.text} mt-2`}>{((dist.count / totalQuestions) * 100).toFixed(0)}% of answers</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Individual Question Results */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Detailed Question-by-Question Results
                </p>
                <div className="space-y-3">
                    {answerScore.results.map((result, idx) => {
                        const percentage = Math.round(result.matching_percentage * 100);
                        const colors = getScoreColor(percentage);
                        return (
                            <motion.div
                                key={idx}
                                className={`${colors.bg} ${colors.border} border-2 rounded-lg p-5 hover:shadow-md transition-shadow`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.is_matching ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                                }`}>
                                                Q{idx + 1}
                                            </span>
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${result.is_matching ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {result.is_matching ? '✓ Matching' : '✗ Not Matching'}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-semibold ${colors.text}`}>{result.question}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-3xl font-bold ${colors.accent}`}>{percentage}%</p>
                                        <p className={`text-xs ${colors.accent} font-semibold mt-1`}>{getScoreLabel(percentage)}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2.5 bg-slate-300 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Performance Insights */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Performance Insights & Recommendations
                </p>
                <div className="space-y-4">
                    {overallScorePercent >= 80 ? (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                            <p className="text-sm font-bold text-green-900 mb-2">✓ Excellent Performance</p>
                            <p className="text-sm text-green-800">
                                Your answers demonstrate strong alignment with expected responses. You have clearly understood the questions and provided relevant, comprehensive answers.
                            </p>
                        </div>
                    ) : overallScorePercent >= 60 ? (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                            <p className="text-sm font-bold text-blue-900 mb-2">✓ Good Performance</p>
                            <p className="text-sm text-blue-800">
                                Your answers show good understanding of most questions. Review the lower-scoring answers to identify gaps in knowledge or comprehension.
                            </p>
                        </div>
                    ) : overallScorePercent >= 40 ? (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-300">
                            <p className="text-sm font-bold text-amber-900 mb-2">~ Fair Performance</p>
                            <p className="text-sm text-amber-800">
                                Your answers partially match expected responses. Focus on the questions with lower scores and review the subject matter more thoroughly.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                            <p className="text-sm font-bold text-red-900 mb-2">✗ Needs Improvement</p>
                            <p className="text-sm text-red-800">
                                Your answers show significant gaps from expected responses. Consider reviewing the material and practicing answer formulation skills.
                            </p>
                        </div>
                    )}

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                        <div>
                            <p className="text-xs text-slate-600 font-semibold mb-2">Highest Score</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {Math.round(Math.max(...answerScore.results.map((r) => r.matching_percentage * 100)))}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-semibold mb-2">Lowest Score</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {Math.round(Math.min(...answerScore.results.map((r) => r.matching_percentage * 100)))}%
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div variants={itemVariants} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <p className="text-sm font-bold text-blue-900 mb-4">📋 How to Improve Your Answers</p>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>• <strong>Review Low Scores:</strong> Focus on questions where your match percentage is below 60%</li>
                    <li>• <strong>Understand Expectations:</strong> Study what makes a good answer for similar questions</li>
                    <li>• <strong>Practice Comprehensively:</strong> Ensure your answers cover all key points mentioned in expected responses</li>
                    <li>• <strong>Check for Completeness:</strong> Add missing details or context to improve match rates</li>
                    <li>• <strong>Learn from Matching Answers:</strong> Use your 100% matches as models for improvement</li>
                </ul>
            </motion.div>{"TEST"}
            {JSON.stringify(state)}
        </motion.div>
    );
};

export default QuestionResultsTab;