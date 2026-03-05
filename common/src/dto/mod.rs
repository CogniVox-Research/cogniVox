use serde::{Deserialize, Serialize};

pub mod asr;

#[derive(Debug, Serialize, Deserialize)]
pub struct GameFeatures {
    pub stress: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ASRSessionCreate {
    pub session_id: uuid::Uuid,
    pub audio_format: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum MQMessage {
    ASR(asr::ASR),
}
