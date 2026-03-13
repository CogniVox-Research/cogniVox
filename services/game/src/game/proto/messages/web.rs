use rocket_ws::Message;
use serde::{Deserialize, Serialize};

use crate::{
    dto,
    error::{Error, Result},
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum WebInbound {
    Start(dto::settings::Settings),
    Ready,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum WebOutbound {
    Asr(common::dto::asr::ASR),
    Stress(dto::stress::StressResponse),
    Pair { session_id: uuid::Uuid },
    Session { session_id: uuid::Uuid },
    GameConnected,
    HeartRate(Box<dto::stress::StressRequest>),
    Stuck,
    Unstuck,
    StuckSuggestion(String),

    QuestionsBegin,
    Question(String),
    QuestionASR(common::dto::asr::ASR),
    QuestionEnd,

    Results(Box<SessionResult>),
}

#[derive(Debug, Serialize)]
pub struct SessionResult {
    pub transcript_analysis: Option<dto::transcript::Response>,
    pub speech_score: Option<dto::sds::Response>,
    pub answer_score: Option<dto::llm::EvaluateResult>,
    pub stress_result: Option<dto::stress::OverallResponse>,
}

impl super::Inbound for WebInbound {
    fn from_message(value: Message) -> Result<Self> {
        match value {
            Message::Text(text) => serde_json::de::from_str(&text).map_err(Error::Deserialize),
            Message::Pong(items) => Err(Error::SocketPong(items)),
            Message::Close(_) => Err(Error::SocketClose),
            Message::Ping(data) => Err(Error::SocketPing(data)),
            _ => Err(Error::UnexpectedMessage(value)),
        }
    }
}

impl super::Outbound for WebOutbound {
    fn into_message(self) -> Result<Message> {
        let data = serde_json::ser::to_string(&self).map_err(Error::Serialize)?;
        Ok(Message::Text(data))
    }
}
