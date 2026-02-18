use bytes::Buf;
use ez_ffmpeg::{FfmpegContext, Output, core::context::filter_complex::FilterComplex};

use rocket::{
    fs::NamedFile,
    futures::{SinkExt, StreamExt},
};
use rocket_ws::{Channel, Message, WebSocket};
use std::{
    io::{Cursor, Read, Seek, SeekFrom, Write},
    path::PathBuf,
    sync::{Mutex, mpsc},
    thread, vec,
};

#[macro_use]
extern crate rocket;

#[get("/")]
async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("assets/index.html").await
}

#[get("/audio/<session_id>")]
fn stream_audio(ws: WebSocket, session_id: &str) -> Channel<'static> {
    let (audio_tx, audio_rx) = mpsc::channel::<Vec<u8>>();
    let (samples_tx, samples_rx) = mpsc::channel::<Vec<f32>>();

    thread::spawn(|| audio_thread(audio_rx, samples_tx));
    thread::spawn(move || {
        let mut ts =
            asr_rs::StreamTranscriber::create(asr_rs::Backend::Whisper(asr_rs::whisper::Config {
                model: asr_rs::whisper::WhisperModel::Small,
                vad: asr_rs::whisper::VadModel::Silero,
                model_dir: PathBuf::from("./models"),
                segment_buffer: 4,
            }))
            .unwrap();

        let mut sample_buffer = Vec::with_capacity(16000);
        while let Ok(mut samples) = samples_rx.recv() {
            sample_buffer.append(&mut samples);

            while let Ok(mut samples) = samples_rx.try_recv() {
                sample_buffer.append(&mut samples);
            }

            if sample_buffer.len() >= 16000 {
                let text = ts.transcribe_audio(sample_buffer).unwrap();
                println!("{text}");
                sample_buffer = Vec::with_capacity(16000);
            }
        }
        if !sample_buffer.is_empty() {
            let text = ts.transcribe_audio(sample_buffer).unwrap();
            println!("{text}");
        }

        ts.finish_transcribing().unwrap()
    });

    ws.channel(move |mut stream| {
        Box::pin(async move {
            while let Some(message) = stream.next().await {
                let data = match message {
                    Ok(v) => v,
                    Err(err) => {
                        println!("Websocket error {err:?}");
                        break;
                    }
                };
                match data {
                    Message::Binary(items) => {
                        audio_tx.send(items).unwrap();
                    }
                    Message::Ping(items) => {
                        stream.send(Message::Pong(items)).await?;
                    }
                    Message::Close(_) => return Ok(()),
                    Message::Text(_) | Message::Pong(_) | Message::Frame(_) => {
                        panic!("Unexpected message type")
                    }
                }
            }

            Ok(())
        })
    })
}

fn audio_thread(audio_in: mpsc::Receiver<Vec<u8>>, samples_out: mpsc::Sender<Vec<f32>>) {
    let mut buffer = Mutex::new(Cursor::new(vec![]));
    let audio_in = Mutex::new(audio_in);

    let input = ez_ffmpeg::Input::new_by_read_callback(move |buf| {
        let audio_in = audio_in.lock().unwrap();
        let buffer = buffer.get_mut().unwrap();
        let mut is_last_write = false;

        if let Ok(mut data) = audio_in.recv() {
            let current = buffer.position();
            buffer.seek(SeekFrom::End(0)).unwrap();

            buffer.write_all(&mut data).unwrap();
            while let Ok(mut data) = audio_in.try_recv() {
                buffer.write_all(&mut data).unwrap();
            }

            let end = buffer.position();
            buffer.seek(SeekFrom::Start(current)).unwrap();
        } else {
            is_last_write = true;
        }

        if is_last_write && !buffer.has_remaining() {
            return ffmpeg_next::Error::Eof.into();
        }

        buffer.read(buf).unwrap() as i32
    })
    .set_seek_callback(|_offset, _whence| ffmpeg_sys_next::AVERROR(ffmpeg_sys_next::ESPIPE) as i64);

    FfmpegContext::builder()
        .input(input)
        .filter_desc("highpass=200,lowpass=3000,afftdn")
        .output(
            Output::new_by_write_callback(move |mut data| {
                assert!(data.len() % 4 == 0, "invalid number of bytes");
                let mut samples = Vec::with_capacity(data.len() / 4);

                while !data.is_empty() {
                    samples.push(data.get_f32_le());
                }

                samples_out.send(samples).unwrap();
                data.len() as i32
            })
            .set_format("f32le")
            .set_audio_channels(1)
            .set_audio_sample_rate(16000),
        )
        .build()
        .unwrap()
        .start()
        .unwrap()
        .wait()
        .unwrap();
}

#[launch]
async fn rocket() -> _ {
    rocket::build().mount("/", routes![index, stream_audio])
}
