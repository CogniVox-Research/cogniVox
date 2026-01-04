import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Volume2,
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
            text: 'text-chart-3',
            bg: 'bg-chart-3/10',
            border: 'border-chart-3/20',
            solid: 'bg-chart-3',
            ring: 'ring-chart-3/20'
        };
        if (score >= 3) return {
            text: 'text-chart-1',
            bg: 'bg-chart-1/10',
            border: 'border-chart-1/20',
            solid: 'bg-chart-1',
            ring: 'ring-chart-1/20'
        };
        if (score >= 2) return {
            text: 'text-chart-4',
            bg: 'bg-chart-4/10',
            border: 'border-chart-4/20',
            solid: 'bg-chart-4',
            ring: 'ring-chart-4/20'
        };
        return {
            text: 'text-destructive',
            bg: 'bg-destructive/10',
            border: 'border-destructive/20',
            solid: 'bg-destructive',
            ring: 'ring-destructive/20'
        };
    };

    const getScoreIcon = (score: number) => {
        if (score >= 4) return <CheckCircle2 className="w-6 h-6 text-chart-3" />;
        if (score >= 3) return <Award className="w-6 h-6 text-chart-1" />;
        if (score >= 2) return <AlertCircle className="w-6 h-6 text-chart-4" />;
        return <XCircle className="w-6 h-6 text-destructive" />;
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
        <div className="space-y-6 p-6 bg-background">
            {/* Header with Overall Score */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-chart-1">
                        Speech Performance Analysis
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
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
                                        stroke="currentColor"
                                        className="text-secondary"
                                        strokeWidth="20"
                                    />
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="85"
                                        fill="none"
                                        stroke="var(--chart-1)"
                                        strokeWidth="20"
                                        strokeDasharray={`${(parseFloat(overallScore) / 5) * 534.07} 534.07`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-5xl font-bold text-chart-1">
                                        {overallScore}
                                    </div>
                                    <div className="text-muted-foreground text-sm mt-1">out of 5.0</div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Stats */}
                        <div className="flex-1 space-y-4">
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold text-foreground mb-2">Overall Performance</h3>
                                <p className="text-muted-foreground">
                                    {overallPercentage >= 80 ? 'Outstanding delivery! Your speech shows excellent command.' :
                                        overallPercentage >= 60 ? 'Good performance with room for improvement in key areas.' :
                                            overallPercentage >= 40 ? 'Fair delivery. Focus on the highlighted areas below.' :
                                                'Several areas need attention. Review the feedback carefully.'}
                                </p>
                            </div>

                            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-full bg-chart-1 transition-all duration-1000"
                                    style={{ width: `${overallPercentage}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-2 rounded-full transition-all ${parseFloat(overallScore) >= level
                                            ? 'bg-chart-1'
                                            : 'bg-muted'
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
                                            <h3 className="font-semibold text-foreground">{category.label}</h3>
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
                                        <span className="text-2xl font-bold text-foreground">{score.toFixed(1)}</span>
                                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                                    </div>

                                    <div className="relative">
                                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full ${colors.solid} transition-all duration-1000`}
                                                style={{ width: `${(score / 5) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            {[1, 2, 3, 4, 5].map((tick) => (
                                                <div
                                                    key={tick}
                                                    className={`w-0.5 h-2 ${score >= tick ? colors.text.replace('text-', 'bg-') : 'bg-muted'
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
                                                ? colors.solid
                                                : 'bg-muted/50'
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
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-chart-1">
                        <Lightbulb className="w-6 h-6" />
                        Detailed Feedback & Recommendations
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
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
                                            <AlertDescription className="text-foreground/90 leading-relaxed">
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
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Performance Summary</CardTitle>
                    <CardDescription className="text-muted-foreground">
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
                                    <div className="w-32 text-sm text-foreground font-medium">
                                        {category.label}
                                    </div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className={`h-full ${colors.solid} flex items-center justify-between px-4 transition-all duration-1000`}
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
                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                    <div className="text-xs text-muted-foreground mt-1">
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