use std::{fmt::Debug, io::Cursor};

use byteorder::{LittleEndian, ReadBytesExt};
use common::dto::AudioFormat;
use once_cell::sync::OnceCell;
use opus::Decoder as OpusDecoder;
use rubato::{FftFixedIn, Resampler};
use webm_iterable::{
    WebmIterator,
    matroska_spec::{MatroskaSpec, SimpleBlock},
};

use crate::audio::{
    AudioError, PipelineStep, TARGET_SAMPLE_RATE,
    rust::{Header, get_header},
};

pub enum AudioDecoder {
    PCM32F(PCM32FDecoder),
    WebM(WebmAudioDecoder),
}

impl AudioDecoder {
    pub fn new(fmt: AudioFormat) -> crate::error::Result<Self> {
        let decoder = match fmt {
            AudioFormat::WebM => AudioDecoder::WebM(WebmAudioDecoder::new()),
            AudioFormat::PCMF32 => AudioDecoder::PCM32F(PCM32FDecoder {}),
        };

        Ok(decoder)
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

pub struct PCM32FDecoder {}

impl PipelineStep for PCM32FDecoder {
    fn process_audio(&mut self, input: Vec<u8>) -> crate::error::Result<Vec<f32>> {
        let mut cursor = Cursor::new(&input);
        let mut floats = Vec::with_capacity(input.len() / 4);

        while let Ok(n) = cursor.read_f32::<LittleEndian>() {
            floats.push(n);
        }

        Ok(floats)
    }

    async fn finish(self) -> crate::error::Result<Option<Vec<f32>>> {
        Ok(None)
    }
}

struct WebmAudioDecoderInner {
    opus_decoder: OpusDecoder,
    resampler: FftFixedIn<f32>,
    channels: usize,
    decoder_buf: Vec<f32>,
}

pub struct WebmAudioDecoder {
    inner: OnceCell<WebmAudioDecoderInner>,
}

impl Debug for WebmAudioDecoder {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WebmAudioDecoder").finish()
    }
}

impl WebmAudioDecoder {
    pub fn new() -> Self {
        return Self {
            inner: OnceCell::new(),
        };
    }
}

impl PipelineStep for WebmAudioDecoder {
    fn process_audio(&mut self, input: Vec<u8>) -> crate::error::Result<Vec<f32>> {
        self.inner.get_or_try_init(|| {
            let header = get_header(&input)?;
            WebmAudioDecoderInner::new(header)
        })?;

        let inner = self.inner.get_mut().expect("should init");

        Ok(inner.decode_webm_chunk(&input)?)
    }

    async fn finish(self) -> crate::error::Result<Option<Vec<f32>>> {
        Ok(None)
    }
}

impl WebmAudioDecoderInner {
    pub fn new(header: Header) -> Result<Self, AudioError> {
        let opus_decoder = OpusDecoder::new(header.sample_rate as u32, header.channels)?;

        let resampler = FftFixedIn::<f32>::new(
            header.sample_rate,
            TARGET_SAMPLE_RATE,
            header.chunk_size,
            2,
            1,
        )?;

        Ok(Self {
            opus_decoder,
            resampler,
            channels: header.channels as usize,
            decoder_buf: vec![
                0f32;
                header.sample_rate / (header.n_chunks - 1) * header.channels as usize
            ],
        })
    }

    pub fn decode_webm_chunk(&mut self, data: &[u8]) -> Result<Vec<f32>, AudioError> {
        let mut samples_out = Vec::new();
        let mut reader = WebmIterator::new(data, &[]);

        while let Some(tag) = reader.next() {
            match tag? {
                MatroskaSpec::SimpleBlock(block) => {
                    let simple_block: SimpleBlock = (&block).try_into()?;
                    if !simple_block.lacing.is_none() {
                        return Err(AudioError::Interlaced);
                    }

                    let packet = simple_block.raw_frame_data();

                    let frame_size =
                        self.opus_decoder
                            .decode_float(&packet, &mut self.decoder_buf, false)?;

                    let decoded = &self.decoder_buf[..frame_size * self.channels];

                    // De-interleave to mono if stereo
                    let mono: Vec<f32> = if self.channels == 2 {
                        decoded
                            .chunks_exact(2)
                            .map(|c| (c[0] + c[1]) * 0.5)
                            .collect()
                    } else {
                        decoded.to_vec()
                    };

                    let input = vec![mono];
                    let resampled = self.resampler.process(&input, None)?;
                    samples_out.extend(&resampled[0]);
                }
                _ => {}
            }
        }

        Ok(samples_out)
    }
}
