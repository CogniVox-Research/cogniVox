use serde::{Deserialize, Serialize};

pub mod asr;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum AudioFormat {
    WebM,
    PCMF32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameFeatures {
    pub stress: bool,
    pub audio_format: AudioFormat,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum ASRSessionType {
    Speech,
    Answer,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ASRSessionCreate {
    pub session_id: uuid::Uuid,
    pub audio_format: AudioFormat,
    pub session_type: ASRSessionType,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum MQMessage {
    ASR(asr::ASR),
}
