import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Volume2,
    Clock,
    Pause,
    TrendingUp,
    Lightbulb,
    Award,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Radio
} from 'lucide-react';

interface Scores {
    clarity: number;
    pace: number;
    pauses: number;
    pitch: number;
    loudness: number;
}

interface Feedback {
    clarity: string;
    pace: string;
    pauses: string;
    pitch: string;
    loudness: string;
}

interface SpeechAnalysisData {
    scores: Scores;
    feedback: Feedback;
}

interface Props {
    data: SpeechAnalysisData;
}

const SpeechAnalysisDashboard: React.FC<Props> = ({ data }) => {
    const getScoreColor = (score: number) => {
        if (score >= 4) return {
            text: 'text-green-400',
            bg: 'bg-green-950/30',
            border: 'border-green-800/50',
            gradient: 'from-green-500 to-emerald-600',
            ring: 'ring-green-500/20'
        };
        if (score >= 3) return {
            text: 'text-blue-400',
            bg: 'bg-blue-950/30',
            border: 'border-blue-800/50',
            gradient: 'from-blue-500 to-cyan-600',
            ring: 'ring-blue-500/20'
        };
        if (score >= 2) return {
            text: 'text-yellow-400',
            bg: 'bg-yellow-950/30',
            border: 'border-yellow-800/50',
            gradient: 'from-yellow-500 to-amber-600',
            ring: 'ring-yellow-500/20'
        };
        return {
            text: 'text-red-400',
            bg: 'bg-red-950/30',
            border: 'border-red-800/50',
            gradient: 'from-red-500 to-rose-600',
            ring: 'ring-red-500/20'
        };
    };

    const getScoreIcon = (score: number) => {
        if (score >= 4) return <CheckCircle2 className="w-6 h-6 text-green-400" />;
        if (score >= 3) return <Award className="w-6 h-6 text-blue-400" />;
        if (score >= 2) return <AlertCircle className="w-6 h-6 text-yellow-400" />;
        return <XCircle className="w-6 h-6 text-red-400" />;
    };

    const getScoreLabel = (score: number) => {
        if (score >= 4) return 'Excellent';
        if (score >= 3) return 'Good';
        if (score >= 2) return 'Fair';
        return 'Needs Improvement';
    };

    const categories = [
        { key: 'clarity', label: 'Clarity', icon: Radio },
        { key: 'pace', label: 'Pace', icon: TrendingUp },
        { key: 'pauses', label: 'Pauses', icon: Pause },
        { key: 'pitch', label: 'Pitch Variation', icon: Volume2 },
        { key: 'loudness', label: 'Loudness', icon: Volume2 }
    ];

    // Calculate overall score
    const overallScore = (
        Object.values(data.scores).reduce((a, b) => a + b, 0) /
        Object.values(data.scores).length
    ).toFixed(1);

    const overallPercentage = (parseFloat(overallScore) / 5) * 100;

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header with Overall Score */}
            <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-700/30">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        Speech Performance Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Comprehensive evaluation of your speaking performance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        {/* Overall Score Circle */}
                        <div className="relative">
                            <div className="relative w-48 h-48">
                                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="85"
                                        fill="none"
                                        stroke="#1e293b"
                                        strokeWidth="20"
                                    />
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="85"
                                        fill="none"
                                        stroke="url(#overallGradient)"
                                        strokeWidth="20"
                                        strokeDasharray={`${(parseFloat(overallScore) / 5) * 534.07} 534.07`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="overallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#a855f7" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                                        {overallScore}
                                    </div>
                                    <div className="text-slate-400 text-sm mt-1">out of 5.0</div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Stats */}
                        <div className="flex-1 space-y-4">
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold text-slate-200 mb-2">Overall Performance</h3>
                                <p className="text-slate-400">
                                    {overallPercentage >= 80 ? 'Outstanding delivery! Your speech shows excellent command.' :
                                        overallPercentage >= 60 ? 'Good performance with room for improvement in key areas.' :
                                            overallPercentage >= 40 ? 'Fair delivery. Focus on the highlighted areas below.' :
                                                'Several areas need attention. Review the feedback carefully.'}
                                </p>
                            </div>

                            <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                                    style={{ width: `${overallPercentage}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-2 rounded-full transition-all ${parseFloat(overallScore) >= level
                                                ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                                : 'bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual Category Scores */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                    const score = data.scores[category.key as keyof Scores];
                    const colors = getScoreColor(score);
                    const Icon = category.icon;

                    return (
                        <Card
                            key={category.key}
                            className={`${colors.bg} ${colors.border} border backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border ring-4 ${colors.ring}`}>
                                            <Icon className={`w-6 h-6 ${colors.text}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-200">{category.label}</h3>
                                            <p className={`text-xs ${colors.text} font-medium`}>
                                                {getScoreLabel(score)}
                                            </p>
                                        </div>
                                    </div>
                                    {getScoreIcon(score)}
                                </div>

                                {/* Score Visualization */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl font-bold text-slate-200">{score.toFixed(1)}</span>
                                        <span className="text-sm text-slate-400">/ 5.0</span>
                                    </div>

                                    <div className="relative">
                                        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000`}
                                                style={{ width: `${(score / 5) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            {[1, 2, 3, 4, 5].map((tick) => (
                                                <div
                                                    key={tick}
                                                    className={`w-0.5 h-2 ${score >= tick ? colors.text.replace('text-', 'bg-') : 'bg-slate-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Stats */}
                                <div className="grid grid-cols-5 gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 rounded-full transition-all ${score >= level
                                                    ? `bg-gradient-to-r ${colors.gradient}`
                                                    : 'bg-slate-700/50'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Detailed Feedback */}
            <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-400">
                        <Lightbulb className="w-6 h-6" />
                        Detailed Feedback & Recommendations
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Personalized insights to improve your speaking performance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {categories.map((category) => {
                            const score = data.scores[category.key as keyof Scores];
                            const feedback = data.feedback[category.key as keyof Feedback];
                            const colors = getScoreColor(score);
                            const Icon = category.icon;

                            return (
                                <Alert
                                    key={category.key}
                                    className={`${colors.bg} ${colors.border} border hover:border-opacity-100 transition-all`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border mt-1`}>
                                            <Icon className={`w-5 h-5 ${colors.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className={`font-semibold ${colors.text}`}>{category.label}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.border} border ${colors.text} font-medium`}>
                                                        {getScoreLabel(score)}
                                                    </span>
                                                    <span className={`text-sm font-bold ${colors.text}`}>
                                                        {score.toFixed(1)}/5.0
                                                    </span>
                                                </div>
                                            </div>
                                            <AlertDescription className="text-slate-300 leading-relaxed">
                                                {feedback}
                                            </AlertDescription>
                                        </div>
                                    </div>
                                </Alert>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-slate-200">Performance Summary</CardTitle>
                    <CardDescription className="text-slate-400">
                        Quick overview of your scores across all categories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {categories.map((category) => {
                            const score = data.scores[category.key as keyof Scores];
                            const colors = getScoreColor(score);

                            return (
                                <div key={category.key} className="flex items-center gap-3">
                                    <div className="w-32 text-sm text-slate-300 font-medium">
                                        {category.label}
                                    </div>
                                    <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors.gradient} flex items-center justify-between px-4 transition-all duration-1000`}
                                            style={{ width: `${(score / 5) * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">
                                                {score.toFixed(1)}
                                            </span>
                                            {score >= 2 && (
                                                <span className="text-xs font-semibold text-white">
                                                    {((score / 5) * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-24 text-sm ${colors.text} font-medium text-right`}>
                                        {getScoreLabel(score)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Overall Statistics */}
                    <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 md:grid-cols-5 gap-4">
                        {categories.map((category) => {
                            const score = data.scores[category.key as keyof Scores];
                            const colors = getScoreColor(score);

                            return (
                                <div
                                    key={category.key}
                                    className={`p-4 ${colors.bg} ${colors.border} border rounded-lg text-center`}
                                >
                                    <div className={`text-xs ${colors.text} mb-1 font-medium`}>
                                        {category.label}
                                    </div>
                                    <div className={`text-2xl font-bold ${colors.text}`}>
                                        {score.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {getScoreLabel(score)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SpeechAnalysisDashboard;