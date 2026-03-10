use std::ops::{Deref, DerefMut};

use serde::{Deserialize, Serialize};

use crate::dto::ASRSessionType;

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
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Line {
    Complete(Segment),
    Partial(Segment),
    Silence(Silence),
}

impl Line {
    pub fn num_tokens(&self) -> usize {
        match self {
            Line::Complete(segment) => segment.tokens.len(),
            Line::Partial(segment) => segment.tokens.len(),
            Line::Silence(_) => 0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ASR {
    Partial(ASRContent),
    Complete(ASRContentComplete),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ASRContentComplete {
    #[serde(flatten)]
    pub content: ASRContent,
    pub recording_file: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ASRContent {
    pub session_id: String,
    pub session_type: ASRSessionType,
    pub lines: Vec<Line>,
    pub full_text: String,
    pub current_silence: Option<Silence>,
}

impl DerefMut for ASR {
    fn deref_mut(&mut self) -> &mut Self::Target {
        match self {
            ASR::Partial(c) => c,
            ASR::Complete(cc) => &mut cc.content,
        }
    }
}

impl Deref for ASR {
    type Target = ASRContent;

    fn deref(&self) -> &Self::Target {
        match self {
            ASR::Partial(c) => c,
            ASR::Complete(cc) => &cc.content,
        }
    }
}

impl DerefMut for ASRContentComplete {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.content
    }
}

impl Deref for ASRContentComplete {
    type Target = ASRContent;

    fn deref(&self) -> &Self::Target {
        &self.content
    }
}
