use std::fmt::Debug;

use chrono::{DateTime, Utc};
use common::dto::asr::{ASR, ASRContent};
use derive_builder::Builder;
use serde::{Deserialize, Serialize};

use crate::{dto::stress::{StressRequest, StressResponse}, game::proto::SessionResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestionAnswer{
    pub question: String,
    pub sample_answer: String,
    pub given_answer: ASRContent,
    pub recording_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timestamped<T: Clone+Serialize+Debug>{
    pub value:T,
    pub  time: DateTime<Utc>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StuckEvent{
    Stuck,
    Unstuck,
    Suggestion(String)
}

#[derive(Builder, Serialize, Deserialize)]
pub struct SessionModel{
    #[serde(rename = "_id")]
    pub session_id: uuid::Uuid,

    pub transcript: ASRContent,

    #[builder(setter(each(name = "stress")), default)]
    pub stress_values: Vec<Timestamped<StressRequest>>,

    #[builder(setter(each(name = "stress_event")), default)]
    pub stress_events: Vec<Timestamped<StressResponse>>,

    #[builder(setter(each(name = "stuck")), default)]
    pub stuck_events: Vec<Timestamped<StuckEvent>>,

    #[builder(setter(each(name = "question")), default)]
    pub questions: Vec<QuestionAnswer>,

    pub result: SessionResult
}
