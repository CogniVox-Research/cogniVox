use rubato::{ResampleError, ResamplerConstructionError};
use webm_iterable::errors::{TagIteratorError, WebmCoercionError};

#[derive(Debug, thiserror::Error)]
pub enum AudioError {
    #[error(transparent)]
    Hound(#[from] hound::Error),

    #[error("Error while recording audio: {0}")]
    Recording(std::io::Error),

    #[error("Invalid number of channels: {0}")]
    Channels(usize),

    #[error("Error processing webm: {0}")]
    Webm(#[from] TagIteratorError),

    #[error("Error processing webm: {0}")]
    InvalidWebm(#[from] WebmCoercionError),

    #[error("Failed to resample audio: {0}")]
    ResampleInit(#[from] ResamplerConstructionError),

    #[error("Failed to resample audio: {0}")]
    Resample(#[from] ResampleError),

    #[error("Codec error: {0}")]
    Codec(#[from] opus::Error),

    #[error("Failed to get stream details from header")]
    Header,

    #[error("Interlaced audio is not supported")]
    Interlaced,

    #[cfg(feature = "ffmpeg")]
    #[error("Error while processing audio: {0}")]
    FFmpeg(#[from] ez_ffmpeg::error::Error),

    #[error("{0}")]
    Custom(String),
}
