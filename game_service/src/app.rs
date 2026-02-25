use crate::{dto, error::Result, game::proto::WebConnection};
use common::mq;
use rocket::futures::lock::Mutex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionCreate {
    pub session_id: uuid::Uuid,
    pub features: dto::settings::GameFeatures,
}

#[derive(Debug)]
pub struct AppState {
    pub pending: Mutex<HashMap<uuid::Uuid, WebConnection>>,

    pub mq_connection: mq::Connection,
    pub session_queue: mq::Sender<SessionCreate>,
}

impl AppState {
    pub async fn create(con: mq::Connection) -> Result<Self> {
        Ok(Self {
            pending: Default::default(),
            mq_connection: con.clone(),
            session_queue: con.sender("session_start", None).await?,
        })
    }
}
