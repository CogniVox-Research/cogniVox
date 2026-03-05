use common::{file_store, mq};
use rocket_ws::Message;

pub type Result<T, E = Error> = std::result::Result<T, E>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Protocol error: unexpected message: {0}")]
    UnexpectedMessage(Message),

    #[error("Websocket closed by client")]
    SocketClose,

    #[error("Failed to serialize message: {0}")]
    Serialize(serde_json::Error),

    #[error("Failed to deserialize message: {0}")]
    Deserialize(serde_json::Error),

    #[error("MQ error: {0}")]
    MQ(#[from] mq::MQError),

    #[error("Failed to send request: {0:?}")]
    HTTP(#[from] reqwest::Error),

    #[error("Store error: {0:?}")]
    Store(file_store::StoreError),

    #[error("Invalid transcript document: {0}")]
    InvalidDocument(String),

    /// Not an error. Returned by From<rocket_rs::Message> for pong message.
    /// This should not be returned by out of the ws crate.
    #[error("Pong")]
    SocketPong(Vec<u8>),

    #[error("Socket timeout")]
    SocketTimeout,

    #[error("Auth token error: {0}")]
    Auth(#[from] jwt::Error),
}
