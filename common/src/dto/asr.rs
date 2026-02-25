use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Token {
    pub text: String,
    pub probability: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Segment {
    pub text: String,

    pub tokens: Vec<Token>,
    pub probability: f32,
    pub timestamp: Timestamp,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Silence {
    pub timestamp: Timestamp,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Timestamp {
    pub start: f64,
    pub end: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ResultType {
    Partial,
    Complete,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Line {
    Complete(Segment),
    Partial(Segment),
    Silence(Silence),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ASR {
    #[serde(rename = "type")]
    pub type_of: ResultType,
    pub session_id: String,
    pub lines: Vec<Line>,
    pub full_text: String,
    pub current_silence: Option<Silence>,
}
