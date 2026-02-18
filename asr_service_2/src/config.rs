use std::path::PathBuf;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum StoreMode {
    InMemory,
    Local { path: PathBuf },
    S3,
}

#[derive(Debug, Deserialize)]
pub struct Config {
    pub model: asr_rs::whisper::Config,
    pub recording_store: StoreMode,
}
