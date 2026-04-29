use common::{
    dto::{self},
    mq::{Consumer, Sender},
};

use rocket::futures::{SinkExt, StreamExt};
use rocket_ws::{Message, stream::DuplexStream};

use crate::{dto::TranscriptionResult, error};

pub enum AudioStreamInput {
    WS(DuplexStream),
    MQ(Consumer<Vec<u8>>, Sender<dto::MQMessage>),
}

impl AudioStreamInput {
    pub(super) async fn next_chunk(&mut self) -> error::Result<Option<Vec<u8>>> {
        match self {
            AudioStreamInput::WS(stream) => {
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
                            }

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
            AudioStreamInput::MQ(consumer, _sender) => {
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

    pub(super) async fn send_result(&mut self, result: TranscriptionResult) -> error::Result<()> {
        match self {
            AudioStreamInput::WS(stream) => {
                let text = serde_json::ser::to_string(&result)?;
                stream.send(Message::Text(text)).await?;
                Ok(())
            }
            AudioStreamInput::MQ(_consumer, sender) => {
                sender.send(dto::MQMessage::ASR(result.dto)).await?;
                Ok(())
            }
        }
    }
}
