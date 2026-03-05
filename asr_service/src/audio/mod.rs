use crate::{audio::rust::AudioDecoder, error::Result};

mod error;
use common::{dto::AudioFormat, file_store::Store};
pub use error::AudioError;
mod recorder;

#[cfg(feature = "ffmpeg")]
mod ffmpeg;

#[cfg(feature = "ffmpeg")]
use ffmpeg::audio_preprocessor;

#[cfg(feature = "rust_audio")]
mod rust;

#[cfg(all(feature = "ffmpeg", feature = "rust_audio"))]
compile_error!("ffmpeg and rust_audio are mutually exclusive and cannot be enabled together");
#[cfg(all(not(feature = "ffmpeg"), not(feature = "rust_audio")))]
compile_error!("One of the following features should be enabled: ffmpeg or rust_audio");

pub const TARGET_SAMPLE_RATE: usize = 16_000;

pub struct Pipeline {
    pipeline: recorder::RecordAudio<AudioDecoder>,
}

impl Pipeline {
    pub fn new(store: Store, audio_format: AudioFormat, prefix: String) -> Result<Self> {
        let pipeline = AudioDecoder::new(audio_format)?;
        let pipeline = recorder::RecordAudio::new(pipeline, store, prefix)?;
        Ok(Self { pipeline })
    }

    pub fn process_audio(&mut self, input: Vec<u8>) -> Result<Vec<f32>> {
        self.pipeline.process_audio(input)
    }

    pub async fn finish(self) -> Result<Option<Vec<f32>>> {
        self.pipeline.finish().await
    }
}

pub trait PipelineStep {
    fn process_audio(&mut self, input: Vec<u8>) -> Result<Vec<f32>>;
    async fn finish(self) -> Result<Option<Vec<f32>>>;
}
