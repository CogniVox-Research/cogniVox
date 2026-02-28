use crate::{
    config::AppConfig,
    error::Result,
    game::proto::{self, APIRequest, WebConnection},
};
use common::{dto::SessionCreate, mq};
use rocket::futures::lock::Mutex;
use std::{collections::HashMap, sync::Arc};

#[derive(Debug)]
pub struct AppState {
    pub pending: Mutex<HashMap<uuid::Uuid, WebConnection>>,

    pub mq_connection: mq::Connection,
    pub session_queue: mq::Sender<SessionCreate>,

    pub endpoints: Arc<proto::Endpoints>,
}

impl AppState {
    pub async fn create(config: AppConfig) -> Result<Self> {
        let rabbitmq = common::mq::Connection::for_config(config.rabbitmq).await?;

        rabbitmq.create_broadcast_exchange("session_start").await?;

        rabbitmq.create_exchange("audio").await?;
        rabbitmq.create_topic_exchange("asr").await?;
        rabbitmq.create_broadcast_exchange("stress").await?;
        rabbitmq.create_exchange("results").await?;

        let request_client = reqwest::Client::new();

        Ok(Self {
            pending: Default::default(),
            mq_connection: rabbitmq.clone(),
            session_queue: rabbitmq
                .sender("", Some("session_start".to_owned()))
                .await?,

            endpoints: Arc::new(proto::Endpoints {
                transcript: APIRequest::new(request_client.clone(), config.transcript_analysis_url),
                speech_score: APIRequest::new(request_client.clone(), config.sds_service_url),
            }),
        })
    }
}
