use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct Request {
    pub speech_text: String,
    pub expected_text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub similarity: Similarity,
    pub grammar: Vec<Grammar>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Similarity {
    pub overall_similarity: f64,
    pub structural_transcript: StructuralInfo,
    pub structural_speech: StructuralInfo,
    pub missing_points: Vec<String>,
    pub key_points_transcript: Vec<String>,
    pub key_points_speech: Vec<String>,
    pub alignment: Vec<Alignment>,
    pub order_analysis: OrderAnalysis,
    pub redundant_speech_segments: Vec<String>,
    pub sentence_count_transcript: usize,
    pub sentence_count_speech: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StructuralInfo {
    pub sentence_count: usize,
    pub avg_sentence_length: f64,
    pub lexical_density: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Alignment {
    pub transcript_sentence: String,
    pub closest_speech_sentence: String,
    pub similarity: f64,
    pub paraphrase_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderAnalysis {
    pub in_order_percentage: f64,
    pub out_of_order_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Grammar {
    pub original: String,
    pub corrected: String,
}
