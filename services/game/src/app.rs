use crate::{
    config::AppConfig,
    error::Result,
    game::proto::{self, APIRequest, Connection, DeviceConnection, WebConnection},
};
use common::{dto::ASRSessionCreate, mq};
use jwt::PKeyWithDigest;
use openssl::pkey::Public;
use rocket::{
    futures::lock::Mutex,
    tokio::{self, time::sleep},
};
use std::{cmp, collections::HashMap, fmt::Debug, hash::Hash, sync::Arc, time::Duration};

pub struct AppState {
    pub pending: Arc<Mutex<HashMap<uuid::Uuid, WebConnection>>>,
    pub vr: Arc<Mutex<HashMap<String, Device>>>,

    pub mq_connection: mq::Connection,
    pub asr_session_queue: mq::Sender<ASRSessionCreate>,

    pub endpoints: Arc<proto::Endpoints>,
    pub public_key: PKeyWithDigest<Public>,
}

pub struct Device {
    pub con: DeviceConnection,
    pub device_id: uuid::Uuid,
    pub user_id: String,
    pub device_name: String,
}

impl Debug for Device {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Device")
            .field("device_id", &self.device_id)
            .field("user_id", &self.user_id)
            .field("device_name", &self.device_name)
            .finish()
    }
}

impl Connection for Device {
    fn is_connected(&self) -> bool {
        self.con.is_connected()
    }
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
        let pub_key = fetch_public_key();

        let state = Self {
            pending: Default::default(),
            vr: Default::default(),
            public_key: pub_key,
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

pub fn fetch_public_key() -> PKeyWithDigest<Public> {
    use jwt::PKeyWithDigest;
    use openssl::hash::MessageDigest;
    use openssl::pkey::PKey;

    let pub_key_str = include_bytes!("../../auth_service/keys/public.pem");

    let rs256_public_key = PKeyWithDigest {
        digest: MessageDigest::sha256(),
        key: PKey::public_key_from_pem(pub_key_str).unwrap(),
    };

    rs256_public_key
}

async fn remove_disconnected<C: Connection, A: cmp::Eq + Hash + Clone>(
    connections: &Arc<Mutex<HashMap<A, C>>>,
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
