use common::{file_store::StoreConfig, mq};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub file_store: StoreConfig,
    pub rabbitmq: mq::Config,
    pub min_answer_words: usize,
    pub max_answer_silence: f64,
    pub urls: URL,
}

#[derive(Debug, Deserialize)]
pub struct URL {
    pub sds_service: String,
    pub transcript_analysis: String,
    pub llm: LLMService,
}

#[derive(Debug, Deserialize)]
pub struct LLMService {
    pub base: String,
    pub interview_question: String,
    pub stress_management: String,
    pub speech_question: String,
    pub evaluate: String,
}
