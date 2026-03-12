use crate::{audio::decoder::AudioDecoder, error::Result};

mod error;
use common::{dto::AudioFormat, file_store::Store};
pub use error::AudioError;
mod decoder;
mod recorder;

pub const TARGET_SAMPLE_RATE: u32 = 16_000;

pub struct Pipeline {
    pipeline: recorder::RecordAudio<AudioDecoder>,
}

impl Pipeline {
    pub fn new(store: Store, audio_format: &AudioFormat, prefix: String) -> Result<Self> {
        let pipeline = AudioDecoder::new(audio_format);
        let pipeline = recorder::RecordAudio::new(pipeline, store, prefix)?;
        Ok(Self { pipeline })
    }

    pub fn recording_file(&self) -> String {
        self.pipeline.recording_file()
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
