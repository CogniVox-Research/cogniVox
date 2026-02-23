use common::file_store::StoreConfig;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub file_store: StoreConfig,
}
