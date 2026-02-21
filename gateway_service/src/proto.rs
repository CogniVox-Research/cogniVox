use rocket_ws::Message;
use serde::{Deserialize, Serialize};

use crate::{dto, error::Error};

/// Protocol for communication Game -> Server
#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum GameInbound {
    #[serde(skip)]
    Audio(Vec<u8>),
    Stress(dto::stress::StressRequest),
    SpeechEnd,
    QuestionEnd,
}

/// Protocol for communication Server -> Game
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum GameOutbound {
    Init(dto::settings::Settings),
    Stress(dto::stress::StressResponse),
    Stuck,
    StuckSuggestion(String),
    Err(String),
    Questions(usize),
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WebInbound {}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum WebOutbound {
    ASR(dto::asr::ASR),
    Stress(dto::stress::StressResponse),
    QR(String),
    GameConnected,
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
