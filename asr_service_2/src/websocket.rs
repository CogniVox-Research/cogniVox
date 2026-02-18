use std::path::PathBuf;

use rocket::{
    futures::{SinkExt, StreamExt},
    tokio::select,
};
use rocket_ws::{Message, stream::DuplexStream};

use crate::{audio_pipeline, error, transcription};

pub(crate) async fn handle_websocket(
    mut stream: DuplexStream,
    recording_file: PathBuf,
) -> error::Result<()> {
    let (audio_tx, samples_rx) = audio_pipeline::audio_preprocessor(recording_file)?;
    let mut text_rx = transcription::start_transcription(samples_rx);

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
                let text = serde_json::ser::to_string(&t?)?;
                stream.send(Message::Text( text)).await?;
             },
             else => break
        };
    }

    Ok(())
}
