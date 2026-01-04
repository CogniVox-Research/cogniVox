import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ChevronDown,
    ChevronUp,
    FileText,
    Mic,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowUpDown,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react';

interface StructuralData {
    sentence_count: number;
    avg_sentence_length: number;
    lexical_density: number;
}

interface AlignmentItem {
    transcript_sentence: string;
    closest_speech_sentence: string;
    similarity: number;
    paraphrase_type: string;
}

interface OrderAnalysis {
    in_order_percentage: number;
    out_of_order_percentage: number;
}

interface SimilarityAnalysisData {
    overall_similarity: number;
    structural_transcript: StructuralData;
    structural_speech: StructuralData;
    missing_points: string[];
    key_points_transcript: string[];
    key_points_speech: string[];
    alignment: AlignmentItem[];
    order_analysis: OrderAnalysis;
    redundant_speech_segments: string[];
    sentence_count_transcript: number;
    sentence_count_speech: number;
}

interface Props {
    data: SimilarityAnalysisData;
}

const SimilarityAnalysisDashboard: React.FC<Props> = ({ data }) => {
    const [expandedAlignments, setExpandedAlignments] = useState<Set<number>>(new Set());

    const toggleAlignment = (index: number) => {
        const newExpanded = new Set(expandedAlignments);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedAlignments(newExpanded);
    };

    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.7) return 'text-chart-3 bg-chart-3/10 border-chart-3/20'; // Greenish -> Chart 3
        if (similarity >= 0.5) return 'text-chart-4 bg-chart-4/10 border-chart-4/20'; // Yellowish -> Chart 4 (Orange)
        return 'text-destructive bg-destructive/10 border-destructive/20';
    };

    const getParaphraseIcon = (type: string) => {
        if (type === 'Strong Paraphrase') return <CheckCircle2 className="w-4 h-4 text-chart-3" />;
        if (type === 'Missing') return <XCircle className="w-4 h-4 text-destructive" />;
        return <AlertCircle className="w-4 h-4 text-chart-4" />;
    };

    const paraphraseDistribution = data.alignment.reduce((acc, item) => {
        acc[item.paraphrase_type] = (acc[item.paraphrase_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const maxStructuralValue = Math.max(
        data.structural_transcript.sentence_count,
        data.structural_speech.sentence_count,
        data.structural_transcript.avg_sentence_length,
        data.structural_speech.avg_sentence_length,
        data.structural_transcript.lexical_density * 100,
        data.structural_speech.lexical_density * 100
    );

    return (
        <div className="space-y-6 p-6 bg-background">
            {/* Header with Overall Similarity */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-chart-1">
                        Transcript vs Speech Similarity Analysis
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Comprehensive comparison of written transcript and spoken content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="text-6xl font-bold text-chart-1">
                                {(data.overall_similarity * 100).toFixed(1)}%
                            </div>
                            <div className="text-muted-foreground text-lg">Overall Similarity Score</div>
                            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-full bg-chart-1 transition-all duration-1000"
                                    style={{ width: `${data.overall_similarity * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Custom Donut Chart */}
                        <div className="flex items-center justify-center">
                            <div className="relative w-48 h-48">
                                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="80"
                                        fill="none"
                                        stroke="currentColor"
                                        className="text-secondary"
                                        strokeWidth="30"
                                    />
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="80"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="30"
                                        strokeDasharray={`${data.overall_similarity * 502.65} 502.65`}
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="var(--chart-1)" />
                                            <stop offset="100%" stopColor="var(--chart-1)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PieChartIcon className="w-12 h-12 text-chart-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Structural Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-chart-1">
                            <BarChart3 className="w-5 h-5" />
                            Structural Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Sentence Count */}
                        <div>
                            <div className="text-sm text-muted-foreground mb-2">Sentence Count</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-chart-1">Transcript</div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="h-full bg-chart-1 flex items-center justify-end pr-3"
                                            style={{ width: `${(data.structural_transcript.sentence_count / maxStructuralValue) * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">{data.structural_transcript.sentence_count}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-chart-2">Speech</div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="h-full bg-chart-2 flex items-center justify-end pr-3"
                                            style={{ width: `${(data.structural_speech.sentence_count / maxStructuralValue) * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">{data.structural_speech.sentence_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Average Sentence Length */}
                        <div>
                            <div className="text-sm text-muted-foreground mb-2">Average Sentence Length</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-chart-1">Transcript</div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="h-full bg-chart-1 flex items-center justify-end pr-3"
                                            style={{ width: `${(data.structural_transcript.avg_sentence_length / maxStructuralValue) * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">{data.structural_transcript.avg_sentence_length.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-chart-2">Speech</div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="h-full bg-chart-2 flex items-center justify-end pr-3"
                                            style={{ width: `${(data.structural_speech.avg_sentence_length / maxStructuralValue) * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">{data.structural_speech.avg_sentence_length.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lexical Density */}
                        <div>
                            <div className="text-sm text-muted-foreground mb-2">Lexical Density (%)</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-chart-1">Transcript</div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="h-full bg-chart-1 flex items-center justify-end pr-3"
                                            style={{ width: `${data.structural_transcript.lexical_density * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">{(data.structural_transcript.lexical_density * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-chart-2">Speech</div>
                                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="h-full bg-chart-2 flex items-center justify-end pr-3"
                                            style={{ width: `${data.structural_speech.lexical_density * 100}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white">{(data.structural_speech.lexical_density * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-chart-2">
                            <ArrowUpDown className="w-5 h-5" />
                            Content Order Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-full">
                            <div className="w-full max-w-sm space-y-6">
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block text-chart-3">
                                                In Order
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold inline-block text-chart-3">
                                                {data.order_analysis.in_order_percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-secondary">
                                        <div
                                            style={{ width: `${data.order_analysis.in_order_percentage}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-chart-3"
                                        />
                                    </div>
                                </div>

                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block text-chart-4">
                                                Out of Order
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold inline-block text-chart-4">
                                                {data.order_analysis.out_of_order_percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-secondary">
                                        <div
                                            style={{ width: `${data.order_analysis.out_of_order_percentage}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-chart-4"
                                        />
                                    </div>
                                </div>

                                {/* Visual Pie Representation */}
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="text-center p-4 bg-chart-3/10 rounded-lg border border-chart-3/20">
                                        <div className="text-3xl font-bold text-chart-3 mb-1">
                                            {data.order_analysis.in_order_percentage}%
                                        </div>
                                        <div className="text-xs text-chart-3/80">In Order</div>
                                    </div>
                                    <div className="text-center p-4 bg-chart-4/10 rounded-lg border border-chart-4/20">
                                        <div className="text-3xl font-bold text-chart-4 mb-1">
                                            {data.order_analysis.out_of_order_percentage}%
                                        </div>
                                        <div className="text-xs text-chart-4/80">Out of Order</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Paraphrase Type Distribution */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-chart-5">
                        <CheckCircle2 className="w-5 h-5" />
                        Paraphrase Type Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(paraphraseDistribution).map(([type, count]) => {
                            const percentage = (count / data.alignment.length) * 100;
                            // Map existing colors to our charts
                            // Strong -> Purple (Chart 2) | Missing -> Red (Destructive) | Other -> Cyan (Chart 1)
                            const colorClass = type === 'Strong Paraphrase' ? 'text-chart-2' : type === 'Missing' ? 'text-destructive' : 'text-chart-1';
                            const bgClass = type === 'Strong Paraphrase' ? 'bg-chart-2' : type === 'Missing' ? 'bg-destructive' : 'bg-chart-1';

                            return (
                                <div key={type}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getParaphraseIcon(type)}
                                            <span className={`text-sm font-medium ${colorClass}`}>{type}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${colorClass}`}>{count} ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-6 overflow-hidden">
                                        <div
                                            className={`h-full ${bgClass} flex items-center justify-center transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        >
                                            {percentage > 15 && <span className="text-xs font-semibold text-white">{count}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Missing Points */}
            {data.missing_points.length > 0 && (
                <Card className="bg-destructive/10 border-destructive/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            Missing Points from Speech
                        </CardTitle>
                        <CardDescription className="text-destructive/70">
                            Key points from transcript not adequately covered in speech
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.missing_points.map((point, idx) => (
                                <Alert key={idx} className="bg-destructive/10 border-destructive/20">
                                    <AlertDescription className="text-destructive-foreground">
                                        {point}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sentence Alignment */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-chart-3">
                        <FileText className="w-5 h-5" />
                        Detailed Sentence Alignment
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Click on each alignment to expand and view details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.alignment.map((item, idx) => (
                            <div
                                key={idx}
                                className={`border rounded-lg overflow-hidden transition-all ${getSimilarityColor(item.similarity)}`}
                            >
                                <button
                                    onClick={() => toggleAlignment(idx)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 text-left">
                                        {getParaphraseIcon(item.paraphrase_type)}
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm">{item.paraphrase_type}</div>
                                            <div className="text-xs opacity-70 mt-1 truncate">
                                                {item.transcript_sentence}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className="text-xs opacity-70">Similarity</div>
                                                <div className="text-lg font-bold">
                                                    {(item.similarity * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                            {expandedAlignments.has(idx) ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {expandedAlignments.has(idx) && (
                                    <div className="p-4 border-t border-current/20 bg-muted/30 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-sm font-semibold">Transcript Sentence</span>
                                            </div>
                                            <p className="text-sm leading-relaxed pl-6">
                                                {item.transcript_sentence}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Mic className="w-4 h-4" />
                                                <span className="text-sm font-semibold">Closest Speech Sentence</span>
                                            </div>
                                            <p className="text-sm leading-relaxed pl-6">
                                                {item.closest_speech_sentence}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-current/20">
                                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-chart-1"
                                                    style={{ width: `${item.similarity * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Key Points Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-chart-1/10 border-chart-1/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-chart-1">
                            <FileText className="w-5 h-5" />
                            Transcript Key Points ({data.key_points_transcript.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.key_points_transcript.map((point, idx) => (
                                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-chart-1/20">
                                    <p className="text-sm text-foreground leading-relaxed">{point}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-chart-2/10 border-chart-2/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-chart-2">
                            <Mic className="w-5 h-5" />
                            Speech Key Points ({data.key_points_speech.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.key_points_speech.map((point, idx) => (
                                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-chart-2/20">
                                    <p className="text-sm text-foreground leading-relaxed">{point}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Statistics Summary */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Summary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted rounded-lg border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Transcript Sentences</div>
                            <div className="text-2xl font-bold text-chart-1">{data.sentence_count_transcript}</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Speech Sentences</div>
                            <div className="text-2xl font-bold text-chart-2">{data.sentence_count_speech}</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Missing Points</div>
                            <div className="text-2xl font-bold text-destructive">{data.missing_points.length}</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Alignments</div>
                            <div className="text-2xl font-bold text-chart-3">{data.alignment.length}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SimilarityAnalysisDashboard;