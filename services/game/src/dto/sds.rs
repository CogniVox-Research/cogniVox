use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct Request {
    pub speech_type: String,
    pub audio_key: String,
    pub transcript: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Response {
    pub speech_type: String,
    pub speech_type_number: String,
    pub metrics: Metrics,
    pub scores: Scores,
    pub feedback: Feedback,
    pub delivery: Delivery,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metrics {
    pub wpm: f64,
    pub avg_pause: f64,
    pub max_pause: f64,
    pub pause_count: u32,
    pub pitch_variability: f64,
    pub disfluencies: u32,
    pub filled_pauses: u32,
    pub loudness_variance: f64,
    pub articulation_rate: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Scores {
    pub clarity: f64,
    pub pace: f64,
    pub pauses: f64,
    pub pitch: f64,
    pub loudness: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Feedback {
    pub clarity: String,
    pub pace: String,
    pub pauses: String,
    pub pitch: String,
    pub loudness: String,
    pub context_summary: String,
    pub priority_metric: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Delivery {
    pub delivery_score: f64,
    pub delivery_score_label: String,
    pub weighted_breakdown: WeightedBreakdown,
    pub weights_used: WeightsUsed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeightedBreakdown {
    pub clarity: f64,
    pub pace: f64,
    pub pauses: f64,
    pub pitch: f64,
    pub loudness: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeightsUsed {
    pub clarity: f64,
    pub pace: f64,
    pub pauses: f64,
    pub pitch: f64,
    pub loudness: f64,
}
