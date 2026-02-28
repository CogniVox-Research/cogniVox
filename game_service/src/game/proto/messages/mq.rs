use serde::{Deserialize, Serialize};

use crate::dto;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum ServiceInbound {
    ASR(common::dto::asr::ASR),
    Stress(dto::stress::StressResponse),
    Stuck,
    Unstuck,
    StuckSuggestion(String),
}
