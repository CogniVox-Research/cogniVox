use std::time::Duration;

use crate::mq::{Consumer, Sender, error::Result};
use async_rs::Runtime;
use lapin::{
    BasicProperties, Channel, ConnectionProperties, ExchangeKind, options::BasicPublishOptions,
    types::FieldTable,
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use tokio::time::sleep;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub connection_name: String,
    pub address: String,
}

#[derive(Debug, Clone)]
pub struct Connection {
    pub channel: Channel,
}

impl Connection {
    pub async fn for_config(cfg: Config) -> Result<Connection> {
        loop {
            let result = Self::for_config_inner(&cfg).await;
            match result {
                Ok(v) => return Ok(v),
                Err(err) => {
                    log::error!("Failed to connect to rabbitmq: {err}");
                    sleep(Duration::from_secs(10)).await;
                }
            }
        }
    }

    async fn for_config_inner(cfg: &Config) -> Result<Connection> {
        let runtime = Runtime::tokio_current();

        let config = ConnectionProperties::default()
            .with_connection_name(cfg.connection_name.as_str().into())
            .enable_auto_recover()
            .configure_backoff(|backoff| backoff.with_max_times(3));

        let connection =
            lapin::Connection::connect_with_runtime(&cfg.address, config, runtime.clone()).await?;

        let channel = connection.create_channel().await?;

        Ok(Connection { channel })
    }

    pub async fn create_exchange(&self, exchange_name: &str) -> Result<()> {
        self._create_exchange(exchange_name, ExchangeKind::Direct)
            .await
    }

    pub async fn create_topic_exchange(&self, exchange_name: &str) -> Result<()> {
        self._create_exchange(exchange_name, ExchangeKind::Topic)
            .await
    }

    pub async fn create_broadcast_exchange(&self, exchange_name: &str) -> Result<()> {
        self._create_exchange(exchange_name, ExchangeKind::Fanout)
            .await
    }

    /// Creates a new exchange for message.
    async fn _create_exchange(&self, exchange_name: &str, type_of: ExchangeKind) -> Result<()> {
        self.channel
            .exchange_declare(
                exchange_name.into(),
                type_of,
                lapin::options::ExchangeDeclareOptions::default(),
                FieldTable::default(),
            )
            .await?;
        Ok(())
    }

    /// Creates a sender that sends messages on the given exchange.
    /// If exchange_name is None, the default exchange is used.
    pub async fn sender<T: Serialize>(
        &self,
        routing_key: &str,
        exchange_name: Option<String>,
    ) -> Result<Sender<T>> {
        Sender::create(
            self.to_owned(),
            exchange_name.unwrap_or_default(),
            routing_key.to_owned(),
        )
        .await
    }

    pub async fn recieve<T: DeserializeOwned>(
        &self,
        queue_name: Option<String>,
    ) -> Result<Consumer<T>> {
        Consumer::create(self.to_owned(), queue_name).await
    }

    pub(crate) async fn send_message(
        &self,
        payload: Vec<u8>,
        exchange_name: &str,
        route_key: &str,
        content_type: &'static str,
    ) -> Result<()> {
        log::debug!("Sending to {exchange_name} with key {route_key}");
        self.channel
            .basic_publish(
                exchange_name.into(),
                route_key.into(),
                BasicPublishOptions::default(),
                &payload,
                BasicProperties::default().with_content_type(content_type.into()),
            )
            .await?
            .await?;
        Ok(())
    }
}
