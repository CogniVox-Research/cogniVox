use rocket::{
    futures::{SinkExt, StreamExt},
    tokio::select,
};
use rocket_ws::{Message, stream::DuplexStream};
use tempdir::TempDir;

use crate::{
    RecordingStore, audio_pipeline,
    dto::TranscriptionResult,
    error::{self, Error},
    transcription,
};

pub(crate) async fn handle_websocket(
    mut stream: DuplexStream,
    session_id: String,
    model_config: asr_rs::whisper::Config,
    store: RecordingStore,
) -> error::Result<()> {
    let recording_dir = TempDir::new("asr_recording").map_err(Error::Recording)?;
    let original_path = recording_dir.path().join("original");
    let converted_path = recording_dir.path().join("coverted.wav");

    let (audio_tx, samples_rx) =
        audio_pipeline::audio_preprocessor(original_path.clone(), converted_path.clone())?;
    let mut text_rx = transcription::start_transcription(model_config, samples_rx);

    loop {
        select! {
             Some(data) = stream.next() =>{
                if matches!(data, Err(rocket_ws::result::Error::Io(..))){
                    // conection close
                    break
                }

                match data? {
                    Message::Binary(items) => {
                        audio_tx.send(items).unwrap();
                    }
                    Message::Ping(items) => {
                        stream.send(Message::Pong(items)).await?;
                    }
                    Message::Close(_) => break,
                    Message::Text(_) | Message::Pong(_) | Message::Frame(_) => {
                        panic!("Unexpected message type")
                    }
                }
             },
             Some(t)= text_rx.recv() => {
                let result = TranscriptionResult::new(session_id.clone(), t?);
                let text = serde_json::ser::to_string(&result)?;
                stream.send(Message::Text( text)).await?;
             },
             else => break
        };
    }

    let upload_path = format!("{session_id}/recordings/original");
    store.upload_file(upload_path, original_path).await?;

    let upload_path = format!("{session_id}/recordings/converted.wav");
    store.upload_file(upload_path, converted_path).await?;

    Ok(())
}
