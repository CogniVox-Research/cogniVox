use common::file_store::StoreConfig;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub asr: asr_rs::Config,
    pub recording_store: StoreConfig,
}
