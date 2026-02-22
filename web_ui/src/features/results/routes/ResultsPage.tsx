import { SpeechScoresPanel } from '../components/SpeechScoresPanel';
import { SimilarityPanel } from '../components/SimilarityPanel';
import { KeyPointsPanel } from '../components/KeyPointsPanel';
import { MOCK_RESULT } from '../mock';
import type { AnalysisResult } from '../types';

type Props = {
    /** Pass real analysis result here; falls back to mock data if omitted. */
    result?: AnalysisResult;
};

export function ResultsPage({ result }: Props) {
    const data = result ?? MOCK_RESULT;

    const avgScore = Math.round(
        Object.values(data.speech.scores).reduce((a, b) => a + b, 0) /
        Object.keys(data.speech.scores).length
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">CogniVox</h1>
                        <p className="text-xs text-muted-foreground">VR public speaking platform</p>
                    </div>
                    <a
                        href="/options"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Session
                    </a>
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">

                {/* Page heading + summary strip */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Session Results</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Comprehensive analysis of your VR public speaking session.
                        </p>
                    </div>

                    {/* Summary stat pills */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: 'Speech Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'text-emerald-500' : avgScore >= 60 ? 'text-amber-400' : 'text-rose-500' },
                            { label: 'Similarity', value: `${data.similarity.overall_similarity}%`, color: data.similarity.overall_similarity >= 80 ? 'text-emerald-500' : data.similarity.overall_similarity >= 60 ? 'text-amber-400' : 'text-rose-500' },
                            { label: 'In-order delivery', value: `${data.similarity.order_analysis.in_order_percentage}%`, color: 'text-indigo-400' },
                            { label: 'Missing points', value: `${data.similarity.missing_points.length}`, color: data.similarity.missing_points.length === 0 ? 'text-emerald-500' : 'text-rose-500' },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-2 text-center shadow-sm">
                                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel 1: Speech scores */}
                <SpeechScoresPanel data={data.speech} />

                {/* Panel 2: Similarity & structure */}
                <SimilarityPanel data={data.similarity} />

                {/* Panel 3: Key points & alignment */}
                <KeyPointsPanel data={data.similarity} />

            </main>
        </div>
    );
}
