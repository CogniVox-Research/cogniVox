use rocket_ws::Message;
use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::error::Error;

#[derive(Debug, Deserialize)]
pub struct Stress {
    pub eda_mean: Option<f64>,
    pub eda_std: Option<f64>,
    pub eda_min: Option<f64>,
    pub eda_max: Option<f64>,
    pub bvp_mean: f64,
    pub bvp_std: f64,
    pub temp_mean: Option<f64>,
    pub temp_std: Option<f64>,
    pub acc_mag_mean: Option<f64>,
    pub acc_mag_std: Option<f64>,

    // Lite specific
    pub bvp_min: Option<f64>,
    pub bvp_max: Option<f64>,
    pub bvp_range: Option<f64>,
    pub bvp_energy: Option<f64>,
    pub acc_mean: Option<f64>,
    pub acc_std: Option<f64>,
    pub acc_max: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct StressResult {
    model_used: String,
    label: i64,
    stress_score: f64,
    suggestion: String,
}

#[derive(Debug, Serialize)]
pub struct ClientSettings {
    #[serde(flatten)]
    pub scene: SceneType,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}
#[derive(Debug, Serialize)]
#[serde(tag = "scene")]
pub enum SceneType {
    Interview,
    BoardRoom { size: i64 },
    Stage { size: i64 },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AudienceDifficulty {
    Easy,
    Medium,
    Hard,
}

/// Protocol for communication Game -> Server
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum GameInbound {
    #[serde(skip)]
    Audio(Vec<u8>),
    Stress(Stress),
    SpeechEnd,
    QuestionEnd,
}

/// Protocol for communication Server -> Game
#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum GameOutbound {
    Init(ClientSettings),
    Stress(StressResult),
    Stuck,
    StuckSuggestion(String),
    Err(String),
    Questions(usize),
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum WebInbound {}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum WebOutbound {
    ASR,
    Stress(StressResult),
}

impl TryFrom<Message> for GameInbound {
    type Error = Error;

    fn try_from(value: Message) -> Result<Self, Self::Error> {
        match value {
            Message::Text(text) => Ok(serde_json::de::from_str(&text)?),
            Message::Binary(items) => Ok(GameInbound::Audio(items)),
            Message::Ping(items) => Err(Error::SocketPing(items)),
            Message::Pong(_) => Err(Error::UnexpectedMessage(format!("Pong"))),
            Message::Close(_) => Err(Error::SocketClose),
            Message::Frame(v) => Err(Error::UnexpectedMessage(format!("Frame {}", v))),
        }
    }
}

impl TryInto<Message> for GameOutbound {
    type Error = Error;

    fn try_into(self) -> Result<Message, Self::Error> {
        Ok(Message::Text(serde_json::ser::to_string(&self)?))
    }
}

impl TryFrom<Message> for WebInbound {
    type Error = Error;

    fn try_from(value: Message) -> Result<Self, Self::Error> {
        match value {
            Message::Text(text) => Ok(serde_json::de::from_str(&text)?),
            Message::Ping(items) => Err(Error::SocketPing(items)),
            Message::Binary(_) => Err(Error::UnexpectedMessage(format!("Binary"))),
            Message::Pong(_) => Err(Error::UnexpectedMessage(format!("Pong"))),
            Message::Close(_) => Err(Error::SocketClose),
            Message::Frame(v) => Err(Error::UnexpectedMessage(format!("Frame {}", v))),
        }
    }
}

impl TryInto<Message> for WebOutbound {
    type Error = Error;

    fn try_into(self) -> Result<Message, Self::Error> {
        Ok(Message::Text(serde_json::ser::to_string(&self)?))
    }
}
