use crate::{error::Result, game::proto::WebConnection};
use common::{dto::SessionCreate, mq};
use rocket::futures::lock::Mutex;
use std::collections::HashMap;

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
            session_queue: con.sender("", Some("session_start".to_owned())).await?,
        })
    }
}
