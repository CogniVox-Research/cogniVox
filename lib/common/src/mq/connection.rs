use std::time::Duration;

use crate::mq::{MQError, Sender, builder, error::Result};
use async_rs::Runtime;
use lapin::{
    BasicProperties, Channel, ConnectionProperties, options::BasicPublishOptions, types::FieldTable,
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

pub type ExchageType = lapin::ExchangeKind;

impl Connection {
    /// Creates an mq connection from the given config.
    /// If the connection fails due to an network errors,
    ///  this function automatically retries connecting.
    ///
    /// # Errors
    ///
    /// Returns an error if the connection failed.
    pub async fn from_config(cfg: Config) -> Result<Connection> {
        let mut timeout = 1;
        loop {
            let result = Self::for_config_inner(&cfg).await;
            match result {
                Ok(v) => return Ok(v),
                Err(err) if err.is_io_error() => {
                    log::error!("MQ connection failed: {err}. Retrying in {timeout} seconds");
                    sleep(Duration::from_secs(timeout)).await;
                    timeout = (timeout * 2).max(10);
                }
                Err(err) => {
                    return Err(MQError::Queue(err));
                }
            }
        }
    }

    async fn for_config_inner(cfg: &Config) -> std::result::Result<Connection, lapin::Error> {
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

    /// Creates a new exchange in the broker.
    ///
    /// # Errors
    ///
    /// Returns an error if creating the exchage failed.
    ///
    pub async fn declare_exchange(&self, type_of: ExchageType, exchange_name: &str) -> Result<()> {
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
    /// If `exchange_name` is None, the default exchange is used.
    #[must_use]
    pub fn sender<T: Serialize>(
        &self,
        routing_key: &str,
        exchange_name: Option<String>,
    ) -> Sender<T> {
        Sender::create(
            self.to_owned(),
            exchange_name.unwrap_or_default(),
            routing_key.to_owned(),
        )
    }

    #[must_use]
    pub fn consumer<T: DeserializeOwned>(&self) -> builder::ConsumerBuilder<T> {
        builder::ConsumerBuilder::new(self.clone())
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
