use std::io::Write;

use opus::Decoder as OpusDecoder;
use rubato::{FftFixedIn, Resampler};
use webm_iterable::{
    WebmIterator,
    matroska_spec::{MatroskaSpec, SimpleBlock},
};

use crate::audio_processing::{
    AudioConfig,
    rust::{AudioError, Header, TARGET_SAMPLE_RATE, get_header},
};

pub fn audio_preprocessor(mut cfg: AudioConfig) -> Result<(), AudioError> {
    let Ok(chunk) = cfg.audio_rx.recv() else {
        return Ok(());
    };

    let header = get_header(&chunk)?;
    let mut writer = hound::WavWriter::new(
        cfg.converted,
        hound::WavSpec {
            channels: 1,
            sample_rate: TARGET_SAMPLE_RATE as u32,
            bits_per_sample: 32,
            sample_format: hound::SampleFormat::Float,
        },
    )?;
    log::debug!(target:"opus_decode", "Parsed header {header:?}");

    let mut decoder = WebmAudioDecoder::new(header)?;

    let samples = decoder.decode_webm_chunk(&chunk)?;
    log::debug!(target:"opus_decode", "Received {} samples", samples.len());

    cfg.original.write(&chunk).map_err(AudioError::Recording)?;
    for sample in &samples {
        writer.write_sample(*sample)?;
    }
    if cfg.samples_tx.send(samples).is_err() {
        return Ok(());
    }

    while let Ok(chunk) = cfg.audio_rx.recv() {
        let samples = decoder.decode_webm_chunk(&chunk)?;
        cfg.original.write(&chunk).map_err(AudioError::Recording)?;

        log::debug!(target:"opus_decode", "Received {} samples", samples.len());

        cfg.original.write(&chunk).map_err(AudioError::Recording)?;
        for sample in &samples {
            writer.write_sample(*sample)?;
        }
        if cfg.samples_tx.send(samples).is_err() {
            return Ok(());
        }
    }

    Ok(())
}

pub struct WebmAudioDecoder {
    opus_decoder: OpusDecoder,
    resampler: FftFixedIn<f32>,
    channels: usize,
    decoder_buf: Vec<f32>,
}

impl WebmAudioDecoder {
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
