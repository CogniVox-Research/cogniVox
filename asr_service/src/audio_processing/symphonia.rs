use crate::{
    audio_processing::AudioConfig,
    error::{Error, Result},
};
use bytes::Buf;
use hound::WavSpec;
use std::{
    fs::File,
    io::{BufWriter, Cursor, Read, Seek, SeekFrom, Write},
    sync::{Mutex, mpsc::Receiver},
};
use symphonia::{
    core::{
        audio::SampleBuffer,
        codecs::DecoderOptions,
        io::{MediaSource, MediaSourceStream},
        probe::Hint,
    },
    default::get_probe,
};

struct ChannelMediaSource {
    receiver: Mutex<Receiver<Vec<u8>>>,
    buffer: Cursor<Vec<u8>>,
}

impl Read for ChannelMediaSource {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let mut is_last_write = false;

        if let Ok(data) = self.receiver.lock().unwrap().recv() {
            let current = self.buffer.position();
            self.buffer
                .seek(SeekFrom::End(0))
                .expect("seek should be valid");

            // out.write_all(&data).expect("Recording should succeed");

            self.buffer
                .write_all(&data)
                .expect("write to memory buffer should succeed");

            self.buffer
                .seek(SeekFrom::Start(current))
                .expect("seek should be valid");
            println!("Read {current}");
        } else {
            is_last_write = true;
        }

        // TODO: compact buffer

        // sender has stopped and no data left. Tell FFmpeg to end the stream
        if is_last_write && !self.buffer.has_remaining() {
            return Ok(0);
        }

        Ok(self.buffer.read(buf).expect("Read should succeed"))
    }
}

impl Seek for ChannelMediaSource {
    fn seek(&mut self, pos: SeekFrom) -> std::io::Result<u64> {
        self.buffer.seek(pos)
    }
}

impl MediaSource for ChannelMediaSource {
    fn is_seekable(&self) -> bool {
        false
    }

    fn byte_len(&self) -> Option<u64> {
        None
    }
}

pub fn audio_preprocessor(cfg: AudioConfig) -> Result<()> {
    let original_out = File::create(cfg.original_path)
        .map_err(Error::Recording)
        .unwrap();
    let mut original_out = BufWriter::new(original_out);

    let converted_out = File::create(cfg.converted_path)
        .map_err(Error::Recording)
        .unwrap();
    let converted_out = hound::WavWriter::new(
        converted_out,
        WavSpec {
            channels: 1,
            sample_rate: 16000,
            sample_format: hound::SampleFormat::Float,
            bits_per_sample: 32,
        },
    )
    .unwrap();

    // original_out.write(&audio_chunk).map_err(Error::Recording)?;

    let channel_source = Box::new(ChannelMediaSource {
        receiver: Mutex::new(cfg.audio_rx),
        buffer: Cursor::new(Vec::new()),
    });

    let mss = MediaSourceStream::new(channel_source, Default::default());

    let format_opts = Default::default();
    let metadata_opts = Default::default();
    let mut hint = Hint::new();
    hint.mime_type("audio/webm");
    let probed = get_probe().format(&hint, mss, &format_opts, &metadata_opts);

    println!("Here {}", probed.is_ok());

    let probed = probed.unwrap();

    let mut format = probed.format;

    let track = format.default_track().unwrap();
    let decoder_opts: DecoderOptions = Default::default();

    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &decoder_opts)
        .unwrap();

    let track_id = track.id;

    let mut sample_count = 0;
    let mut sample_buf = None;

    loop {
        // Get the next packet from the format reader.
        let packet = format.next_packet().unwrap();

        println!("Packet");

        // If the packet does not belong to the selected track, skip it.
        if packet.track_id() != track_id {
            continue;
        }

        // Decode the packet into audio samples, ignoring any decode errors.
        match decoder.decode(&packet) {
            Ok(audio_buf) => {
                // The decoded audio samples may now be accessed via the audio buffer if per-channel
                // slices of samples in their native decoded format is desired. Use-cases where
                // the samples need to be accessed in an interleaved order or converted into
                // another sample format, or a byte buffer is required, are covered by copying the
                // audio buffer into a sample buffer or raw sample buffer, respectively. In the
                // example below, we will copy the audio buffer into a sample buffer in an
                // interleaved order while also converting to a f32 sample format.

                // If this is the *first* decoded packet, create a sample buffer matching the
                // decoded audio buffer format.
                if sample_buf.is_none() {
                    // Get the audio buffer specification.
                    let spec = *audio_buf.spec();

                    // Get the capacity of the decoded buffer. Note: This is capacity, not length!
                    let duration = audio_buf.capacity() as u64;

                    // Create the f32 sample buffer.
                    sample_buf = Some(SampleBuffer::<f32>::new(duration, spec));
                }

                // Copy the decoded audio buffer into the sample buffer in an interleaved format.
                if let Some(buf) = &mut sample_buf {
                    buf.copy_interleaved_ref(audio_buf);

                    // The samples may now be access via the `samples()` function.
                    sample_count += buf.samples().len();
                    print!("\rDecoded {} samples", sample_count);
                }
            }
            Err(symphonia::core::errors::Error::DecodeError(_)) => (),
            Err(_) => break,
        }
    }

    todo!();
}
