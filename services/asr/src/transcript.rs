use common::{
    dto::{self, ASRSessionType, AudioFormat},
    file_store::Store,
    mq::{Consumer, Sender},
};

use rocket::{
    futures::{SinkExt, StreamExt},
    tokio::task::block_in_place,
};
use rocket_ws::{Message, stream::DuplexStream};

use crate::{audio, dto::TranscriptionResult, error};

pub(crate) async fn run_transcription(
    mut input: Input,
    session_id: String,
    audio_format: AudioFormat,
    session_type: ASRSessionType,
    transcriber: asr_rs::Transcriber,
    store: Store,
) -> error::Result<()> {
    let prefix = format!("{session_id}/recordings");
    let mut audio_pipeline = audio::Pipeline::new(store, audio_format, prefix)?;

    let ts = transcriber.create_async_stream().await?;

    while let Some(chunk) = input.next_chunk().await? {
        let samples = block_in_place(|| audio_pipeline.process_audio(chunk))?;

        let transcript = ts.transcribe_audio(samples).await?;

        input
            .send_result(TranscriptionResult::new(
                &session_id,
                transcript,
                session_type,
            ))
            .await?;
    }

    let recording_file = audio_pipeline.recording_file();

    let final_sample = audio_pipeline.finish().await?;
    let transcript = ts.finish_transcribing(final_sample).await?;

    input
        .send_result(TranscriptionResult::new_complete(
            &session_id,
            recording_file,
            transcript,
            session_type,
        ))
        .await?;

    Ok(())
}

pub enum Input {
    WS(DuplexStream),
    MQ(Consumer<Vec<u8>>, Sender<dto::MQMessage>),
}

impl Input {
    async fn next_chunk(&mut self) -> error::Result<Option<Vec<u8>>> {
        match self {
            Input::WS(stream) => {
                while let Some(chunk) = stream.next().await {
                    if matches!(chunk, Err(rocket_ws::result::Error::Io(..))) {
                        // conection close
                        return Ok(None);
                    }

                    return match chunk? {
                        Message::Binary(items) => Ok(Some(items)),
                        Message::Ping(items) => {
                            stream.send(Message::Pong(items)).await?;
                            continue;
                        }
                        Message::Close(_) => Ok(None),
                        Message::Text(msg) => {
                            if msg != "END" {
                                log::error!("Unexpected text message {msg}");
                                continue;
                            };

                            Ok(None)
                        }

                        Message::Pong(_) | Message::Frame(_) => {
                            log::error!("Unexpected message type");
                            continue;
                        }
                    };
                }

                Ok(None)
            }
            Input::MQ(consumer, _sender) => {
                if let Some(message) = consumer.recv().await {
                    let content = message?.get().await?;
                    if content == "END".as_bytes() {
                        Ok(None)
                    } else {
                        Ok(Some(content))
                    }
                } else {
                    Ok(None)
                }
            }
        }
    }

    async fn send_result(&mut self, result: TranscriptionResult) -> error::Result<()> {
        match self {
            Input::WS(stream) => {
                let text = serde_json::ser::to_string(&result)?;
                stream.send(Message::Text(text)).await?;
                Ok(())
            }
            Input::MQ(_consumer, sender) => {
                sender.send(dto::MQMessage::ASR(result.dto)).await?;
                Ok(())
            }
        }
    }
}
