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
    Ready(common::dto::GameFeatures),
    SpeechStart,
    Stress(Box<dto::stress::StressRequest>),
    SpeechEnd,
    QuestionStart,
    QuestionEnd,
}

/// Protocol for communication Server -> Game
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum GameOutbound {
    Init(dto::settings::GameSettings),
    Stress(dto::stress::StressResponse),
    Stuck,
    Unstuck,
    StuckSuggestion(String),
    AnswerEnd,
    Question(String),
    End,
    Error(String),
}

impl super::Inbound for GameInbound {
    fn from_message(value: Message) -> Result<Self> {
        match value {
            Message::Text(text) => serde_json::de::from_str(&text).map_err(Error::Deserialize),
            Message::Binary(items) => Ok(GameInbound::Audio(items)),
            Message::Pong(items) => Err(Error::SocketPong(items)),
            Message::Ping(items) => Err(Error::SocketPing(items)),
            Message::Close(_) => Err(Error::SocketClose),
            _ => Err(Error::UnexpectedMessage(value)),
        }
    }
}

impl super::Outbound for GameOutbound {
    fn into_message(self) -> Result<Message> {
        let data = serde_json::ser::to_string(&self).map_err(Error::Serialize)?;
        Ok(Message::Text(data))
    }
}
