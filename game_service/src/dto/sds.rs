use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct Request {
    pub audio_key: String,
    pub transcript: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub metrics: Metrics,
    pub scores: Scores,
    pub feedback: Feedback,
}

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Scores {
    pub clarity: u8,
    pub pace: u8,
    pub pauses: u8,
    pub pitch: u8,
    pub loudness: u8,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Feedback {
    pub clarity: String,
    pub pace: String,
    pub pauses: String,
    pub pitch: String,
    pub loudness: String,
}
