use common::{file_store::StoreConfig, mq};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub asr: asr_rs::Config,
    pub recording_store: StoreConfig,
    pub rabbitmq: mq::Config,
}
