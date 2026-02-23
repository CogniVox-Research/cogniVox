use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Token {
    pub text: String,
    pub probability: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Segment {
    pub text: String,

    pub tokens: Vec<Token>,
    pub probability: f32,
    pub timestamp: Timestamp,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Silence {
    pub timestamp: Timestamp,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Timestamp {
    pub start: f64,
    pub end: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResultType {
    Partial,
    Complete,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Line {
    Complete(Segment),
    Partial(Segment),
    Silence(Silence),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ASR {
    #[serde(rename = "type")]
    type_of: ResultType,
    session_id: String,
    lines: Vec<Line>,
    full_text: String,
    current_silence: Option<Silence>,
}
