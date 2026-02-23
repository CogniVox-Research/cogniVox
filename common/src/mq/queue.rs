use std::marker::PhantomData;

use crate::mq::error::Result;
use async_rs::Runtime;
use futures_lite::StreamExt;
use lapin::{
    BasicProperties, Channel, Connection, ConnectionProperties, Consumer, PublisherConfirm,
    options::{BasicAckOptions, BasicConsumeOptions, BasicPublishOptions, QueueDeclareOptions},
    types::FieldTable,
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use tokio::sync;

#[derive(Debug, Clone)]
pub struct QueueConnection {
    channel: Channel,
    queue_name: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct QueueConfig {
    connection_name: String,
    address: String,
    queue_name: String,
}

/// Queue is a rabbitmq queue that that has only one type of message
pub struct Queue<T>
where
    T: Serialize + DeserializeOwned + Sized,
{
    con: QueueConnection,
    consumer: sync::OnceCell<Consumer>,

    _msg_type: std::marker::PhantomData<T>,
}

impl<T> Queue<T>
where
    T: Serialize + DeserializeOwned + Sized,
{
    pub async fn create(cfg: QueueConfig) -> Result<Queue<T>> {
        let con = connect(cfg, true).await?;
        Self::from_connection(con)
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
                "".into(),
                self.con.queue_name.as_str().into(),
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
            .get_or_try_init(async || Self::create_consumer(&self.con, "consumer").await)
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
        con: &QueueConnection,
        name: &str,
    ) -> std::result::Result<Consumer, lapin::Error> {
        con.channel
            .basic_consume(
                con.queue_name.as_str().into(),
                format!("{}_consumer_{name}", con.queue_name).into(),
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
    }

    fn from_connection(con: QueueConnection) -> Result<Queue<T>> {
        Ok(Self {
            con,
            consumer: sync::OnceCell::new(),
            _msg_type: PhantomData,
        })
    }
}

async fn connect(cfg: QueueConfig, create_queue: bool) -> Result<QueueConnection> {
    let runtime = Runtime::tokio_current();

    let config = ConnectionProperties::default()
        .with_connection_name(cfg.connection_name.into())
        .enable_auto_recover()
        .configure_backoff(|backoff| {
            backoff.with_max_times(3);
        });

    let conn = Connection::connect_with_runtime(&cfg.address, config, runtime.clone()).await?;

    let channel = conn.create_channel().await?;

    if create_queue {
        let mut queue_config = QueueDeclareOptions::default();
        queue_config.auto_delete = true;

        let queue = channel
            .queue_declare(
                cfg.queue_name.clone().into(),
                queue_config,
                FieldTable::default(),
            )
            .await?;

        log::debug!("Created queue {}: {queue:?}", cfg.queue_name);
    }

    Ok(QueueConnection {
        channel,
        queue_name: cfg.queue_name,
    })
}

#[cfg(test)]
#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
struct TestMessage {
    content: String,
}
#[cfg(test)]
async fn create_test_connection() -> QueueConnection {
    let cfg = QueueConfig {
        connection_name: "test".to_string(),
        address: "amqp://appuser:apppass@127.0.0.1".to_string(),
        queue_name: "test-queue".to_string(),
    };

    connect(cfg, true).await.unwrap()
}

#[tokio::test]
async fn test_queue() {
    let message = TestMessage {
        content: "Hello".to_owned(),
    };
    let con = create_test_connection().await;

    let sender = Queue::from_connection(con.clone()).unwrap();
    sender.send(&message).await.unwrap();

    let mut consumer = Queue::from_connection(con.clone()).unwrap();
    let data: TestMessage = consumer.read().await.unwrap().unwrap();
    assert!(message == data);
}

#[tokio::test]
async fn test_queue_sync() {
    use std::sync::Arc;
    use tokio::sync::Mutex;

    let con = create_test_connection().await;

    let message = TestMessage {
        content: "Hello".to_owned(),
    };

    let cond = Arc::new(Mutex::new(false));

    let sender = Queue::from_connection(con.clone()).unwrap();
    let message_copy = message.clone();

    let cond_reader = cond.clone();
    let mut cond_writer = cond.lock().await;

    let sender_task = tokio::spawn(async move {
        sender.send_sync(&message_copy).await.unwrap();
        let value = *cond_reader.lock().await;
        assert!(value == true, "send returned before read")
    });

    let mut consumer = Queue::from_connection(con.clone()).unwrap();

    *cond_writer = true;
    drop(cond_writer);

    let data: TestMessage = consumer.read().await.unwrap().unwrap();
    assert!(message == data);
    sender_task.await.unwrap();
}
