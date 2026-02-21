use std::{
    fs,
    io::{Cursor, Read, Seek, SeekFrom, Write},
    path::PathBuf,
    sync::mpsc,
};

use bytes::Buf;

use crate::{
    audio_processing::AudioConfig,
    error::{Error, Result},
};
use ez_ffmpeg::{FfmpegContext, Output};

pub fn audio_preprocessor(cfg: AudioConfig) -> Result<()> {
    let input = reciever_input(cfg.audio_rx, cfg.original_path);

    FfmpegContext::builder()
        .input(input?)
        .filter_desc("afftdn")
        .output(
            sender_output(cfg.samples_tx)
                .set_format("f32le")
                .set_audio_channels(1)
                .set_audio_sample_rate(16000),
        )
        .output(
            Output::from(cfg.converted_path.to_str().unwrap())
                .set_format("wav")
                .set_audio_channels(1)
                .set_audio_sample_rate(16000),
        )
        .build()?
        .start()?
        .wait()?;
    Ok(())
}

fn reciever_input(
    audio_rx: mpsc::Receiver<Vec<u8>>,
    record_path: PathBuf,
) -> Result<ez_ffmpeg::Input> {
    let mut buffer = Cursor::new(vec![]);
    let audio_in = audio_rx;

    let mut out = fs::File::create(record_path).map_err(Error::Recording)?;

    let input = ez_ffmpeg::Input::new_by_read_callback(move |buf| {
        let mut is_last_write = false;

        if let Ok(data) = audio_in.recv() {
            let current = buffer.position();
            buffer.seek(SeekFrom::End(0)).expect("seek should be valid");

            out.write_all(&data).expect("Recording should succeed");

            buffer
                .write_all(&data)
                .expect("write to memory buffer should succeed");

            buffer
                .seek(SeekFrom::Start(current))
                .expect("seek should be valid");
        } else {
            is_last_write = true;
        }

        // TODO: compact buffer

        // sender has stopped and no data left. Tell FFmpeg to end the stream
        if is_last_write && !buffer.has_remaining() {
            return ffmpeg_next::Error::Eof.into();
        }

        buffer.read(buf).expect("Read should succeed") as i32
    })
    // disable seeking
    .set_seek_callback(|_offset, _whence| ffmpeg_sys_next::AVERROR(ffmpeg_sys_next::ESPIPE) as i64)
    .set_readrate(1.0);

    return Ok(input);
}

fn sender_output(samples_tx: mpsc::Sender<Vec<f32>>) -> Output {
    Output::new_by_write_callback(move |mut data| {
        assert!(data.len() % 4 == 0, "invalid number of bytes");
        let mut samples = Vec::with_capacity(data.len() / 4);

        while !data.is_empty() {
            samples.push(data.get_f32_le());
        }

        if let Ok(_) = samples_tx.send(samples) {
            data.len() as i32
        } else {
            ffmpeg_sys_next::AVERROR(ffmpeg_sys_next::EIO)
        }
    })
}
