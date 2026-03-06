pub type Result<T> = std::result::Result<T, MQError>;

#[derive(Debug, thiserror::Error)]
pub enum MQError {
    /// An error in a queue.
    #[error(transparent)]
    Queue(#[from] lapin::Error),

    /// Json parsing/serializing error.
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}
