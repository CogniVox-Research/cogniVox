use std::marker::PhantomData;

use crate::mq::{Connection, MQError, error::Result};

use futures_lite::StreamExt;
use lapin::{
    Acker,
    options::{BasicAckOptions, BasicConsumeOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
};
use serde::{Deserialize, de::DeserializeOwned};

#[derive(Debug, Deserialize, Clone)]
pub struct ConsumerConfig {
    pub routing_key: Option<String>,
    pub exchange_name: Option<String>,
    pub queue_name: Option<String>,
}

#[derive(Debug)]
pub struct Message<T> {
    data: T,
    acker: Acker,
}

impl<T> Message<T> {
    pub async fn get(self) -> Result<T> {
        self.acker.ack(BasicAckOptions::default()).await?;
        return Ok(self.data);
    }
}

#[derive(Debug)]
pub struct Consumer<T>
where
    T: DeserializeOwned + Sized,
{
    consumer: lapin::Consumer,

    _msg_type: PhantomData<T>,
}

impl<T> Consumer<T>
where
    T: DeserializeOwned + Sized,
{
    pub(crate) async fn create(con: Connection, cfg: ConsumerConfig) -> Result<Consumer<T>> {
        let (queue_name, _exchabge) = declare_and_bind(&con, cfg).await?;

        let name = format!("{}_consumer", queue_name);
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
            consumer,
            _msg_type: PhantomData,
        })
    }

    /// Receive a single message.
    pub async fn recv(&mut self) -> Option<Result<Message<T>>> {
        let delivery = self.consumer.next().await;

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
}

async fn declare_and_bind(con: &Connection, cfg: ConsumerConfig) -> Result<(String, String)> {
    let mut q_cfg = QueueDeclareOptions::default();
    q_cfg.auto_delete = true;

    let queue = con
        .channel
        .queue_declare(
            cfg.queue_name.unwrap_or_default().into(),
            q_cfg,
            FieldTable::default(),
        )
        .await?;

    let queue_name = queue.name().to_string();

    log::debug!("Created queue {}: {:#?}", queue_name, queue);

    if let Some(ref ex) = cfg.exchange_name {
        con.channel
            .queue_bind(
                queue_name.as_str().into(),
                ex.as_str().into(),
                cfg.routing_key.unwrap_or_default().into(),
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await?;
        log::debug!("Bound {} to exchange {}", queue_name, ex);
    }

    Ok((queue_name, cfg.exchange_name.clone().unwrap_or_default()))
}
