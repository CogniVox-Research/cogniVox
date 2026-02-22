pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Protocol error: unexpected message: {0}")]
    UnexpectedMessage(String),

    #[error("Websocket closed by client")]
    SocketClose,

    #[error("Failed to serialize message: {0}")]
    Serialize(serde_json::Error),

    #[error("Failed to deserialize message: {0}")]
    Deserialize(serde_json::Error),

    /// Not an error. Returned by From<rocket_rs::Message> for pong message.
    /// This should not be returned by out of the ws crate.
    #[error("Pong")]
    SocketPong(Vec<u8>),

    #[error("Socket timeout")]
    SocketTimeout,
}
