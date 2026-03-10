use common::{file_store::StoreConfig, mq};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub file_store: StoreConfig,
    pub rabbitmq: mq::Config,
    pub sds_service_url: String,
    pub transcript_analysis_url: String,
    pub min_answer_words: usize,
    pub max_answer_silence: f64,
}
