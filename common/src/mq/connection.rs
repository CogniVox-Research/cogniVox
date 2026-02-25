use crate::mq::{Consumer, ConsumerConfig, Sender, error::Result};
use async_rs::Runtime;
use lapin::{
    BasicProperties, Channel, ConnectionProperties, options::BasicPublishOptions, types::FieldTable,
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};

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

    /// Creates a new exchange for message.
    pub async fn create_exchange(&self, exchange_name: &str, is_broadcast: bool) -> Result<()> {
        self.channel
            .exchange_declare(
                exchange_name.into(),
                if is_broadcast {
                    lapin::ExchangeKind::Fanout
                } else {
                    lapin::ExchangeKind::Direct
                },
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
            routing_key.to_owned(),
            exchange_name.unwrap_or_default(),
        )
        .await
    }

    pub async fn recieve<T: DeserializeOwned>(&self, cfg: ConsumerConfig) -> Result<Consumer<T>> {
        Consumer::create(self.to_owned(), cfg).await
    }

    pub(crate) async fn send_message(
        &self,
        payload: Vec<u8>,
        exchange_name: &str,
        route_key: &str,
        content_type: &'static str,
    ) -> Result<()> {
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

#[cfg(test)]
pub(crate) async fn create_test_connection() -> Connection {
    let cfg = Config {
        connection_name: "test".to_string(),
        address: "amqp://appuser:apppass@127.0.0.1".to_string(),
    };

    Connection::for_config(cfg).await.unwrap()
}
