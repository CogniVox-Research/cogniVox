use common::{file_store::StoreConfig, mq};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub file_store: StoreConfig,
    pub rabbitmq: mq::Config,
}
