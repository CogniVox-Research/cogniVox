// ─── Speech Analysis ──────────────────────────────────────────────────────────

export interface Scores {
    clarity: number;
    pace: number;
    pauses: number;
    pitch: number;
    loudness: number;
}

export interface Feedback {
    clarity: string;
    pace: string;
    pauses: string;
    pitch: string;
    loudness: string;
}

export interface SpeechAnalysisData {
    scores: Scores;
    feedback: Feedback;
}

// ─── Similarity Analysis ──────────────────────────────────────────────────────

export interface StructuralData {
    sentence_count: number;
    avg_sentence_length: number;
    lexical_density: number;
}

export interface AlignmentItem {
    transcript_sentence: string;
    closest_speech_sentence: string;
    similarity: number;
    paraphrase_type: string;
}

export interface OrderAnalysis {
    in_order_percentage: number;
    out_of_order_percentage: number;
}

export interface SimilarityAnalysisData {
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

// ─── Combined result ──────────────────────────────────────────────────────────

export interface AnalysisResult {
    speech: SpeechAnalysisData;
    similarity: SimilarityAnalysisData;
}
