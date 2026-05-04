mod pcm32f;
mod webm;
mod webm_header;

use common::dto::AudioFormat;
pub use pcm32f::*;
pub use webm::*;
pub(crate) use webm_header::{WebmHeader, get_webm_header};

use crate::audio::PipelineStep;

/// A decoder that converts the given audio format into f32 audio samples at 16khz sample rate.
pub enum AudioDecoder {
    PCM32F(PCM32FDecoder),
    WebM(WebmAudioDecoder),
}

impl AudioDecoder {
    pub fn new(fmt: &AudioFormat) -> Self {
        match fmt {
            AudioFormat::WebM => AudioDecoder::WebM(WebmAudioDecoder::new()),
            AudioFormat::PCMF32 => AudioDecoder::PCM32F(PCM32FDecoder {}),
        }
    }
}

impl PipelineStep for AudioDecoder {
    fn process_audio(&mut self, input: Vec<u8>) -> crate::error::Result<Vec<f32>> {
        match self {
            AudioDecoder::PCM32F(d) => d.process_audio(input),
            AudioDecoder::WebM(d) => d.process_audio(input),
        }
    }

    async fn finish(self) -> crate::error::Result<Option<Vec<f32>>> {
        match self {
            AudioDecoder::PCM32F(d) => d.finish().await,
            AudioDecoder::WebM(d) => d.finish().await,
        }
    }
}
