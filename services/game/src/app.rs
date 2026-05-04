use crate::{
    config::AppConfig, db::sessions::SessionRepo, dto::settings::Settings, error::Result, game::proto::{self, Connection, DeviceConnection, WebConnection}
};
use common::{
    dto::ASRSessionCreate,
    mq::{self, ExchageType},
};
use jwt::PKeyWithDigest;
use openssl::hash::MessageDigest;
use openssl::pkey::PKey;
use openssl::pkey::Public;
use rocket::{
    futures::lock::Mutex,
    tokio::{self, time::sleep},
};
use std::{
    cmp,
    collections::HashMap,
    fmt::Debug,
    fs::File,
    hash::Hash,
    io::Read,
    path::Path,
    sync::{Arc, LazyLock},
    time::Duration,
};

pub struct AppState {
    pub pending: Arc<Mutex<HashMap<uuid::Uuid, PendingSession>>>,
    pub vr: Arc<Mutex<HashMap<String, Device>>>,

    pub mq_connection: Arc<mq::Connection>,
    pub asr_session_queue: mq::Sender<ASRSessionCreate>,

    pub endpoints: Arc<proto::Endpoints>,
    pub config: AppConfig,

    pub session_repo: Option<crate::db::sessions::SessionRepo>
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

pub struct PendingSession {
    pub con: WebConnection,
    pub session_id: uuid::Uuid,
    pub user_id: String,
    pub settings: Settings,
    pub document: String,
    pub questions: Option<Vec<crate::dto::llm::Question>>,
}

impl Connection for PendingSession {
    fn is_connected(&self) -> bool {
        self.con.is_connected()
    }
}

impl Debug for PendingSession {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PendingSession")
            .field("session_id", &self.session_id)
            .field("user_id", &self.user_id)
            .field("settings", &self.settings)
            .field("documet", &self.document)
            .finish()
    }
}

impl AppState {
    pub async fn create(config: AppConfig) -> Result<Self> {
        let con = common::mq::Connection::from_config(config.rabbitmq.clone()).await?;

        con.declare_exchange(ExchageType::Direct, "asr_start")
            .await?;
        con.declare_exchange(ExchageType::Direct, "audio").await?;
        con.declare_exchange(ExchageType::Topic, "asr").await?;
        con.declare_exchange(ExchageType::Fanout, "stress").await?;
        con.declare_exchange(ExchageType::Direct, "results").await?;

        let db = if let Some(ref uri) = config.mongo_url{
           Some( SessionRepo::init(uri.to_owned()).await)
        } else{
            None
        };

        let state = Self {
            pending: Default::default(),
            vr: Default::default(),
            mq_connection: Arc::new(con.clone()),
            asr_session_queue: con.sender("start", Some("asr_start".to_owned())),

            endpoints: Arc::new(proto::Endpoints::from_config(&config.urls)),
            session_repo: db,
            config,
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

static PUBLIC_KEY: LazyLock<PKey<Public>> = {
    std::sync::LazyLock::new(|| {
        let mut public_key_data = String::new();
        let paths = ["public.pem", "../auth/keys/public.pem"];
        let key_path = paths
            .iter()
            .find(|path| Path::new(path).exists())
            .expect("Public key should exist");

        File::open(key_path)
            .expect("Public key should be accessable")
            .read_to_string(&mut public_key_data)
            .expect("Read should succeed");
        PKey::public_key_from_pem(public_key_data.as_bytes()).expect("Public key should be valid")
    })
};

pub fn get_public_key() -> PKeyWithDigest<Public> {
    PKeyWithDigest {
        digest: MessageDigest::sha256(),
        key: PUBLIC_KEY.clone(),
    }
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
