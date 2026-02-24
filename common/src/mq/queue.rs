use std::marker::PhantomData;

use crate::mq::error::Result;
use async_rs::Runtime;
use futures_lite::StreamExt;
use lapin::{
    BasicProperties, Channel, ConnectionProperties, Consumer, PublisherConfirm,
    options::{
        BasicAckOptions, BasicConsumeOptions, BasicPublishOptions, QueueBindOptions,
        QueueDeclareOptions,
    },
    types::FieldTable,
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use tokio::sync;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub connection_name: String,
    pub address: String,
}

#[derive(Debug, Clone)]
pub struct Connection {
    pub(crate) channel: Channel,
}

#[derive(Debug, Deserialize, Clone)]
pub struct QueueConfig {
    pub queue_name: Option<String>,
    pub exchange_name: Option<String>,
    pub create_queue: bool,
}

#[derive(Debug)]
/// Queue is a rabbitmq queue that that has only one type of message
pub struct Queue<T>
where
    T: Serialize + DeserializeOwned + Sized,
{
    con: Connection,
    consumer: sync::OnceCell<Consumer>,
    queue_name: String,
    exchange_name: String,

    _msg_type: std::marker::PhantomData<T>,
}

impl<T> Queue<T>
where
    T: Serialize + DeserializeOwned + Sized,
{
    pub async fn create(con: Connection, cfg: QueueConfig) -> Result<Queue<T>> {
        let mut queue_name = cfg.queue_name.unwrap_or("".to_owned());

        if cfg.create_queue {
            let mut queue_config = QueueDeclareOptions::default();
            queue_config.auto_delete = true;

            let queue = con
                .channel
                .queue_declare(
                    queue_name.as_str().into(),
                    queue_config,
                    FieldTable::default(),
                )
                .await?;

            if queue_name.is_empty() {
                queue_name = queue.name().to_string();
            }

            log::debug!("Created queue {}: {queue:?}", queue_name);

            if let Some(ref exchange) = cfg.exchange_name {
                con.channel
                    .queue_bind(
                        queue_name.as_str().into(),
                        exchange.as_str().into(),
                        "".into(),
                        QueueBindOptions::default(),
                        FieldTable::default(),
                    )
                    .await?;
                log::debug!("Created queue {}: {queue:?}", queue_name);
            }
        }

        Ok(Self {
            con,
            consumer: sync::OnceCell::new(),
            queue_name: queue_name,
            exchange_name: cfg.exchange_name.unwrap_or("".to_owned()),
            _msg_type: PhantomData,
        })
    }

    /// sends a message on the channel.
    /// This does not wait for an ack from the reciever.
    pub async fn send(&self, message: &T) -> Result<()> {
        self.send_mesage(message).await?;
        Ok(())
    }

    /// sends a message on the channel and waits for an ack from the reciever.
    pub async fn send_sync(&self, message: &T) -> Result<()> {
        let confirm = self.send_mesage(message).await?;
        confirm.await?;
        Ok(())
    }

    async fn send_mesage(&self, message: &T) -> Result<PublisherConfirm> {
        let payload = serde_json::to_vec(message)?;

        let result = self
            .con
            .channel
            .basic_publish(
                self.exchange_name.as_str().into(),
                self.queue_name.as_str().into(),
                BasicPublishOptions::default(),
                &payload,
                BasicProperties::default(),
            )
            .await?;

        Ok(result)
    }

    /// gets a message from the queue.
    /// This automatically acks the message.
    ///
    /// # Cancel Safety
    /// This cannot be safely canceled and cancelling will result in message loss.
    pub async fn read(&mut self) -> Option<Result<T>> {
        self.read_inner().await.transpose()
    }

    pub async fn read_inner(&mut self) -> Result<Option<T>> {
        self.consumer
            .get_or_try_init(async || {
                Self::create_consumer(&self.con, &self.queue_name, "consumer").await
            })
            .await?;
        let consumer = self.consumer.get_mut().expect("should be init");
        let delivery = consumer.next().await;
        if let Some(maybe_message) = delivery {
            let message = maybe_message?;
            let content = serde_json::de::from_slice(&message.data)?;
            message.ack(BasicAckOptions::default()).await?;

            Ok(Some(content))
        } else {
            Ok(None)
        }
    }

    async fn create_consumer(
        con: &Connection,
        queue_name: &str,
        name: &str,
    ) -> std::result::Result<Consumer, lapin::Error> {
        con.channel
            .basic_consume(
                queue_name.into(),
                format!("{}_consumer_{name}", queue_name).into(),
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
    }
}

impl Connection {
    pub async fn for_config(cfg: Config) -> Result<Connection> {
        let runtime = Runtime::tokio_current();

        let config = ConnectionProperties::default()
            .with_connection_name(cfg.connection_name.into())
            .enable_auto_recover()
            .configure_backoff(|backoff| {
                backoff.with_max_times(3);
            });

        let connection =
            lapin::Connection::connect_with_runtime(&cfg.address, config, runtime.clone()).await?;

        let channel = connection.create_channel().await?;

        Ok(Connection { channel })
    }
}

#[cfg(test)]
#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub(crate) struct TestMessage {
    content: String,
}

#[cfg(test)]
pub(crate) async fn create_test_connection() -> Connection {
    let cfg = Config {
        connection_name: "test".to_string(),
        address: "amqp://appuser:apppass@127.0.0.1".to_string(),
    };

    Connection::for_config(cfg).await.unwrap()
}

#[tokio::test]
async fn test_queue() {
    let queue_config = QueueConfig {
        queue_name: Some("test_queue".to_owned()),
        exchange_name: None,
        create_queue: true,
    };

    let message = TestMessage {
        content: "Hello".to_owned(),
    };
    let con = create_test_connection().await;

    let sender = Queue::create(con.clone(), queue_config.clone())
        .await
        .unwrap();
    sender.send(&message).await.unwrap();

    let mut consumer = Queue::create(con.clone(), queue_config).await.unwrap();
    let data: TestMessage = consumer.read().await.unwrap().unwrap();
    assert!(message == data);
}

#[tokio::test]
async fn test_queue_sync() {
    use std::sync::Arc;
    use tokio::sync::Mutex;

    let queue_config = QueueConfig {
        queue_name: Some("test_queue".to_owned()),
        exchange_name: None,
        create_queue: true,
    };

    let con = create_test_connection().await;

    let message = TestMessage {
        content: "Hello".to_owned(),
    };

    let cond = Arc::new(Mutex::new(false));

    let sender = Queue::create(con.clone(), queue_config.clone())
        .await
        .unwrap();
    let message_copy = message.clone();

    let cond_reader = cond.clone();
    let mut cond_writer = cond.lock().await;

    let sender_task = tokio::spawn(async move {
        sender.send_sync(&message_copy).await.unwrap();
        let value = *cond_reader.lock().await;
        assert!(value == true, "send returned before read")
    });

    let mut consumer = Queue::create(con.clone(), queue_config).await.unwrap();

    *cond_writer = true;
    drop(cond_writer);

    let data: TestMessage = consumer.read().await.unwrap().unwrap();
    assert!(message == data);
    sender_task.await.unwrap();
}
