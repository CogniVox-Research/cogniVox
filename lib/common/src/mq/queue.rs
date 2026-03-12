use std::marker::PhantomData;

use crate::mq::{Connection, MQError, error::Result};

use futures_lite::StreamExt;
use lapin::{
    Acker,
    options::{BasicAckOptions, BasicConsumeOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
};
use serde::de::DeserializeOwned;

/// A Wrapper around a message that should be acked.
/// This is used so that `Consumer::recv` can be cancel safe.
#[derive(Debug)]
pub struct Message<T> {
    data: T,
    acker: Acker,
}

impl<T> Message<T> {
    /// Gets the message and sends an ack to the broker.
    ///
    /// # Errors
    ///
    /// Returns an error if the ack failed
    pub async fn get(self) -> Result<T> {
        self.acker.ack(BasicAckOptions::default()).await?;
        Ok(self.data)
    }
}

#[derive(Debug)]
pub struct Consumer<T>
where
    T: DeserializeOwned + Sized,
{
    con: Connection,
    queue_name: String,
    inner: lapin::Consumer,

    _msg_type: PhantomData<T>,
}

impl<T> Consumer<T>
where
    T: DeserializeOwned + Sized,
{
    pub(crate) async fn create(con: Connection, queue_name: Option<String>) -> Result<Consumer<T>> {
        let options = QueueDeclareOptions {
            auto_delete: queue_name.is_none(),
            exclusive: queue_name.is_none(),
            ..Default::default()
        };

        let queue = con
            .channel
            .queue_declare(
                queue_name.unwrap_or_default().into(),
                options,
                FieldTable::default(),
            )
            .await?;

        let queue_name = queue.name().to_string();

        let name = format!("{queue_name}_consumer");
        let consumer = con
            .channel
            .basic_consume(
                queue_name.as_str().into(),
                name.into(),
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await?;

        Ok(Consumer {
            inner: consumer,
            con,
            queue_name,
            _msg_type: PhantomData,
        })
    }

    /// Receive a single message.
    pub async fn recv(&mut self) -> Option<Result<Message<T>>> {
        let delivery = self.inner.next().await;

        match delivery {
            None => None,
            Some(Err(e)) => Some(Err(MQError::Queue(e))),
            Some(Ok(delivery)) => match serde_json::from_slice(&delivery.data) {
                Ok(message) => Some(Ok(Message {
                    acker: delivery.acker,
                    data: message,
                })),
                Err(e) => Some(Err(MQError::Json(e))),
            },
        }
    }

    pub async fn recv_ack(&mut self) -> Option<Result<T>> {
        let result = self.recv().await;
        match result {
            Some(Ok(msg)) => Some(msg.get().await),
            Some(Err(e)) => Some(Err(e)),
            None => None,
        }
    }

    #[deprecated = "use ConsumerBuilder::on_exchange"]
    #[allow(clippy::missing_errors_doc)]
    pub async fn bind_exchange(self, exhange: String, route_key: String) -> Result<Self> {
        self.con
            .channel
            .queue_bind(
                self.queue_name.as_str().into(),
                exhange.as_str().into(),
                route_key.as_str().into(),
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await?;

        Ok(self)
    }
}
