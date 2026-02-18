pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("FFmpeg returned an error: {0}")]
    FFmpeg(#[from] ez_ffmpeg::error::Error),

    #[error("ASR returned an error: {0}")]
    ASR(#[from] asr_rs::Error),

    #[error("Websocket returned an error: {0}")]
    WS(#[from] rocket_ws::result::Error),

    #[error("Failed to serialize: {0}")]
    Serialize(#[from] serde_json::Error),

    #[error("Error while recording audio: {0}")]
    Recording(std::io::Error),

    #[error("Error while uploading audio to storage: {0}")]
    Upload(#[from] object_store::Error),
}
