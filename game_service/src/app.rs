use crate::{
    config::AppConfig,
    error::Result,
    game::proto::{
        self, APIRequest, DeviceConnection, Inbound, Outbound, WebConnection, WebSocket,
    },
};
use common::{dto::ASRSessionCreate, mq};
use rocket::{
    futures::lock::Mutex,
    tokio::{self, time::sleep},
};
use std::{collections::HashMap, sync::Arc, time::Duration};

#[derive(Debug)]
pub struct AppState {
    pub pending: Arc<Mutex<HashMap<uuid::Uuid, WebConnection>>>,

    pub vr: Arc<Mutex<HashMap<uuid::Uuid, DeviceConnection>>>,

    pub mq_connection: mq::Connection,
    pub asr_session_queue: mq::Sender<ASRSessionCreate>,

    pub endpoints: Arc<proto::Endpoints>,
}

impl AppState {
    pub async fn create(config: AppConfig) -> Result<Self> {
        let rabbitmq = common::mq::Connection::for_config(config.rabbitmq).await?;

        rabbitmq.create_exchange("asr_start").await?;
        rabbitmq.create_exchange("audio").await?;
        rabbitmq.create_topic_exchange("asr").await?;
        rabbitmq.create_broadcast_exchange("stress").await?;
        rabbitmq.create_exchange("results").await?;

        let request_client = reqwest::Client::new();

        let state = Self {
            pending: Default::default(),
            vr: Default::default(),
            mq_connection: rabbitmq.clone(),
            asr_session_queue: rabbitmq
                .sender("start", Some("asr_start".to_owned()))
                .await?,

            endpoints: Arc::new(proto::Endpoints {
                transcript: APIRequest::new(request_client.clone(), config.transcript_analysis_url),
                speech_score: APIRequest::new(request_client.clone(), config.sds_service_url),
            }),
        };

        // cleanup disconnected connections.
        let pending = state.pending.clone();
        let vr = state.vr.clone();
        tokio::spawn(async move {
            loop {
                let mut removed = 0;
                removed += remove_disconnected(&pending).await;
                removed += remove_disconnected(&vr).await;

                if removed > 0 {
                    log::info!("Removed {removed} disconnected connections")
                }

                sleep(Duration::from_secs(10)).await;
            }
        });

        Ok(state)
    }
}

async fn remove_disconnected<A: Inbound, B: Outbound>(
    connections: &Arc<Mutex<HashMap<uuid::Uuid, WebSocket<A, B>>>>,
) -> usize {
    let mut connections_guard = connections.lock().await;
    let to_remove = connections_guard
        .iter()
        .filter_map(|c| {
            if !c.1.is_connected() {
                Some(c.0.to_owned())
            } else {
                None
            }
        })
        .collect::<Vec<_>>();

    let removed = to_remove.len();
    for key in to_remove {
        connections_guard.remove(&key);
    }

    removed
}
