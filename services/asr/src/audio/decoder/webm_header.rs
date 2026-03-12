use opus::Channels;
use webm_iterable::{
    WebmIterator,
    matroska_spec::{MatroskaSpec, SimpleBlock},
};

use crate::audio::{AudioError, TARGET_SAMPLE_RATE};

#[derive(Debug)]
pub struct WebmHeader {
    pub channels: Channels,
    pub sample_rate: usize,
    pub chunk_size: usize,
    pub n_chunks: usize,
}

#[allow(clippy::cast_sign_loss, reason = "checked before cast")]
pub fn get_webm_header(data: &[u8]) -> Result<WebmHeader, AudioError> {
    let reader = WebmIterator::new(data, &[]);
    let mut channels = None;
    let mut sample_rate = 0;
    let mut chunk_size = 0;
    let mut n_chunks = 0;

    for tag in reader {
        let tag = tag?;
        match &tag {
            MatroskaSpec::Channels(v) => {
                log::debug!(target:"opus_decode", "Got Num channels: {v}");
                channels = match *v {
                    1 => Some(Channels::Mono),
                    2 => Some(Channels::Stereo),
                    _ => {
                        return Err(AudioError::Channels(*v as usize));
                    }
                };
            }
            MatroskaSpec::SamplingFrequency(v) => {
                log::debug!(target:"opus_decode", "Frequency: {v}");
                if v % 1.0 != 0.0 {
                    return Err(AudioError::Custom("Frequency is not an integer".to_owned()));
                }
                sample_rate = *v as usize;
            }
            MatroskaSpec::CodecName(n) => {
                log::debug!(target:"opus_decode", "Codec {n}");
                if !n.eq_ignore_ascii_case("opus") {
                    return Err(AudioError::Custom(format!("Unsupported codec: {n}")));
                }
            }
            MatroskaSpec::SimpleBlock(packet) => {
                if channels.is_none() || sample_rate == 0 {
                    return Err(AudioError::Header);
                }

                let mut decode_buf = vec![0f32; TARGET_SAMPLE_RATE as usize * 40];

                let simple_block: SimpleBlock = (packet).try_into()?;
                if simple_block.lacing.is_some() {
                    return Err(AudioError::Interlaced);
                }

                let packet = simple_block.raw_frame_data();

                let mut opus_decoder =
                    opus::Decoder::new(sample_rate as u32, channels.expect("checked above"))?;
                let frame_size = opus_decoder.decode_float(packet, &mut decode_buf, false)?;

                if chunk_size == 0 {
                    chunk_size = frame_size;
                } else if chunk_size != frame_size {
                    return Err(AudioError::Custom("Frames have variying sizes".to_owned()));
                }

                n_chunks += 1;
            }
            _ => {
                log::debug!(target:"opus_decode", "tag : {tag:?}");
            }
        }
    }

    log::debug!(target:"opus_decode", "chunk size: {chunk_size} {n_chunks}");

    if let Some(channels) = channels
        && sample_rate != 0
        && chunk_size != 0
        && n_chunks != 0
    {
        Ok(WebmHeader {
            channels,
            sample_rate,
            chunk_size,
            n_chunks,
        })
    } else {
        Err(AudioError::Header)
    }
}
