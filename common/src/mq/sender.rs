use crate::mq::{Connection, error::Result};
use serde::Serialize;
use std::marker::PhantomData;

#[derive(Debug)]
pub struct Sender<T: Serialize + Sized> {
    con: Connection,
    exchange_name: String,
    routing_key: String,

    _data_type: PhantomData<T>,
}

impl<T: Serialize + Sized> Sender<T> {
    pub(crate) async fn create(
        con: Connection,
        routing_key: String,
        exchange_name: String,
    ) -> Result<Sender<T>> {
        Ok(Sender {
            con,
            routing_key,
            exchange_name,
            _data_type: PhantomData,
        })
    }

    /// Send a message.
    pub async fn send(&self, msg: T) -> Result<()> {
        let payload = serde_json::to_vec(&msg)?;
        self.con
            .send_message(
                payload,
                &self.exchange_name,
                &self.routing_key,
                "application/json",
            )
            .await
    }
}
