// Mock data for ResultsPage demo
import type { AnalysisResult } from '../types';

export const MOCK_RESULT: AnalysisResult = {
    speech: {
        scores: {
            clarity: 78,
            pace: 65,
            pauses: 82,
            pitch: 71,
            loudness: 88,
        },
        feedback: {
            clarity:
                'Your articulation was generally clear. Focus on slowing down complex terminology so listeners can follow.',
            pace: 'You spoke slightly faster than ideal in the middle section. Aim for 130–150 words per minute for presentations.',
            pauses: 'Good use of strategic pauses to allow key points to land. A couple of filler pauses could be trimmed.',
            pitch:
                'Pitch variation was adequate, though the conclusion felt monotone. Rising inflection on questions would help engagement.',
            loudness:
                'Excellent projection throughout. Volume was consistent and confident without being overpowering.',
        },
    },
    similarity: {
        overall_similarity: 74,
        sentence_count_transcript: 12,
        sentence_count_speech: 15,
        structural_transcript: {
            sentence_count: 12,
            avg_sentence_length: 18.4,
            lexical_density: 0.61,
        },
        structural_speech: {
            sentence_count: 15,
            avg_sentence_length: 14.2,
            lexical_density: 0.54,
        },
        missing_points: [
            'Discussion of long-term environmental impact',
            'Reference to third-party research findings',
        ],
        key_points_transcript: [
            'Introduction to the topic and its relevance',
            'Three core strategies for improving communication',
            'Statistical evidence supporting the claims',
            'Long-term environmental impact data',
            'Third-party research and citations',
            'Call to action for the audience',
        ],
        key_points_speech: [
            'Introduction and personal anecdote',
            'Core strategies explained with examples',
            'Statistical evidence presented',
            'Call to action',
        ],
        alignment: [
            {
                transcript_sentence: 'Communication is the foundation of every successful organisation.',
                closest_speech_sentence: 'At the heart of every great organisation is effective communication.',
                similarity: 0.87,
                paraphrase_type: 'Semantic paraphrase',
            },
            {
                transcript_sentence: 'Research shows that active listening improves team performance by 30%.',
                closest_speech_sentence: 'Studies indicate a 30% boost in team output when listening is prioritised.',
                similarity: 0.91,
                paraphrase_type: 'Near-synonym substitution',
            },
            {
                transcript_sentence: 'Three strategies can transform how you speak in public settings.',
                closest_speech_sentence: 'I have three key methods to share that will change how you present.',
                similarity: 0.76,
                paraphrase_type: 'Structural paraphrase',
            },
            {
                transcript_sentence: 'Know your audience before you prepare a single slide.',
                closest_speech_sentence: 'Always understand who is in the room before you even open your laptop.',
                similarity: 0.69,
                paraphrase_type: 'Contextual paraphrase',
            },
        ],
        order_analysis: {
            in_order_percentage: 68,
            out_of_order_percentage: 32,
        },
        redundant_speech_segments: [
            'Repeated opening anecdote near the halfway point',
            'Restated the definition of lexical density twice consecutively',
        ],
    },
};
