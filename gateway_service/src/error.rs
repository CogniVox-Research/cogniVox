pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Protocol error: unexpected message: {0}")]
    UnexpectedMessage(String),

    #[error("Websocket closed by client")]
    SocketClose,

    #[error("Ping")]
    /// Not an error. Returned by From<rocket_rs::Message> for ping message.
    /// Should respond with Pong.
    SocketPing(Vec<u8>),

    #[error("Json error: {0}")]
    Json(#[from] serde_json::Error),
}
