use rocket_ws::Message;
use serde::{Deserialize, Serialize};

use crate::{
    dto,
    error::{Error, Result},
};

/// Protocol for communication Game -> Server
#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum GameInbound {
    #[serde(skip)]
    Audio(Vec<u8>),
    Ready(dto::settings::GameFeatures),
    SpeechStart,
    Stress(dto::stress::StressRequest),
    SpeechEnd,
    QuestionStart,
    QuestionEnd,
}

/// Protocol for communication Server -> Game
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum GameOutbound {
    Init(dto::settings::GameSettings),
    ASR(common::dto::asr::ASR),
    Stress(dto::stress::StressResponse),
    Stuck,
    StuckSuggestion(String),
    Question(String),
    Error(String),
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WebInbound {
    Start(dto::settings::Settings),
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum WebOutbound {
    ASR(common::dto::asr::ASR),
    Stress(dto::stress::StressResponse),
    Pair(String),
    GameConnected,
    Error(String),
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum ServiceInbound {
    ASR(common::dto::asr::ASR),
    Stress(dto::stress::StressResponse),
    Stuck,
    StuckSuggestion(String),
}

pub trait Inbound: Sized + Send + 'static {
    fn from_message(m: Message) -> Result<Self>;
}

pub trait Outbound: Sized + Send + 'static {
    fn into_message(self) -> Result<Message>;
}

impl Inbound for GameInbound {
    fn from_message(value: Message) -> Result<Self> {
        match value {
            Message::Text(text) => serde_json::de::from_str(&text).map_err(Error::Deserialize),
            Message::Binary(items) => Ok(GameInbound::Audio(items)),
            Message::Pong(items) => Err(Error::SocketPong(items)),
            Message::Close(_) => Err(Error::SocketClose),
            _ => Err(Error::UnexpectedMessage(value)),
        }
    }
}

impl Outbound for GameOutbound {
    fn into_message(self) -> Result<Message> {
        let data = serde_json::ser::to_string(&self).map_err(Error::Serialize)?;
        Ok(Message::Text(data))
    }
}

impl Inbound for WebInbound {
    fn from_message(value: Message) -> Result<Self> {
        match value {
            Message::Text(text) => serde_json::de::from_str(&text).map_err(Error::Deserialize),
            Message::Pong(items) => Err(Error::SocketPong(items)),
            Message::Close(_) => Err(Error::SocketClose),
            _ => Err(Error::UnexpectedMessage(value)),
        }
    }
}

impl Outbound for WebOutbound {
    fn into_message(self) -> Result<Message> {
        let data = serde_json::ser::to_string(&self).map_err(Error::Serialize)?;
        Ok(Message::Text(data))
    }
}
