use crate::mq::{Connection, error::Result};
use serde::Serialize;
use std::marker::PhantomData;

#[derive(Debug, Clone)]
pub struct Sender<T: Serialize + Sized> {
    con: Connection,
    exchange_name: String,
    routing_key: String,

    _data_type: PhantomData<T>,
}

impl<T: Serialize + Sized> Sender<T> {
    pub(crate) fn create(con: Connection, exchange_name: String, routing_key: String) -> Sender<T> {
        Sender {
            con,
            routing_key,
            exchange_name,
            _data_type: PhantomData,
        }
    }

    /// Send a message.
    ///
    /// # Errors
    ///
    /// Returns an error if the message cannot be added to the queue
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
