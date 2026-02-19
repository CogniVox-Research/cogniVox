use common::file_store::StoreConfig;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub model: asr_rs::whisper::Config,
    pub recording_store: StoreConfig,
}
