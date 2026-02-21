use rocket::{futures::stream::SplitSink, tokio::sync::mpsc};

use rocket::{
    futures::{SinkExt, StreamExt},
    tokio,
};
use rocket_ws::{Channel, Message, WebSocket, stream::DuplexStream};

use crate::{
    error::{Error, Result},
    ws::proto::{GameInbound, GameOutbound, Inbound, Outbound, WebInbound, WebOutbound},
};

pub type WebConnection = Connection<WebInbound, WebOutbound>;
pub type GameConnection = Connection<GameInbound, GameOutbound>;

pub struct Connection<In, Out> {
    inbound: mpsc::Receiver<In>,
    outbound: mpsc::Sender<Out>,

    handler: Option<(mpsc::Sender<In>, mpsc::Receiver<Out>)>,
}

impl<In: Inbound, Out: Outbound> Connection<In, Out> {
    pub fn new() -> Self {
        let (inbound_tx, inbound_rx) = mpsc::channel::<In>(100);
        let (outbound_tx, outbound_rx) = mpsc::channel::<Out>(100);
        Connection {
            inbound: inbound_rx,
            outbound: outbound_tx,
            handler: Some((inbound_tx, outbound_rx)),
        }
    }

    pub async fn send(&self, message: Out) -> Result<()> {
        self.outbound
            .send(message)
            .await
            .map_err(|_e| Error::SocketClose)
    }

    pub async fn recv(&mut self) -> Result<In> {
        self.inbound.recv().await.ok_or(Error::SocketClose)
    }

    pub fn try_recv(&mut self) -> Result<Option<In>> {
        match self.inbound.try_recv() {
            Ok(data) => Ok(Some(data)),
            Err(mpsc::error::TryRecvError::Empty) => Ok(None),
            Err(mpsc::error::TryRecvError::Disconnected) => Err(Error::SocketClose),
        }
    }

    pub fn handle_websocket<'r>(&mut self, ws: WebSocket) -> Channel<'r> {
        let Some((inbound_tx, mut outbound_rx)) = self.handler.take() else {
            panic!("multiple calls to handle_websocket");
        };

        ws.channel(move |stream| {
            Box::pin(async move {
                tokio::spawn(async move {
                    let (mut ws_sink, mut ws_stream) = stream.split();
                    loop {
                        let result = tokio::select! {
                            Some(msg) = outbound_rx.recv() => {
                                Self::send_message(&mut ws_sink, msg).await.err()
                            }
                            Some(Ok(msg)) = ws_stream.next() => {
                                Self::read_message(&mut ws_sink, &inbound_tx, msg).await.err()
                            }
                            else => Some(Error::SocketClose),
                        };

                        if let Some(err) = result {
                            if !matches!(err, Error::SocketClose) {
                                log::error!("Closed ws connection due to error: {err}")
                            }
                            break;
                        }
                    }
                });
                Ok(())
            })
        })
    }

    async fn send_message(ws_sink: &mut SplitSink<DuplexStream, Message>, msg: Out) -> Result<()> {
        let message = msg.into_message()?;
        match ws_sink.send(message).await {
            Ok(_) => Ok(()),
            Err(e) => {
                log::error!("Websocket write returned error {e}");
                Err(Error::SocketClose)
            }
        }
    }

    async fn read_message(
        ws_sink: &mut SplitSink<DuplexStream, Message>,
        inbound_tx: &mpsc::Sender<In>,
        message: Message,
    ) -> Result<()> {
        let result = In::from_message(message);
        match result {
            Ok(v) => {
                if inbound_tx.send(v).await.is_err() {
                    Err(Error::SocketClose)
                } else {
                    Ok(())
                }
            }
            Err(Error::SocketPing(v)) => {
                if let Err(_e) = ws_sink.send(Message::Pong(v)).await {
                    Err(Error::SocketClose)
                } else {
                    Ok(())
                }
            }
            Err(Error::SocketPong(_v)) => {
                // TODO: handle this
                Ok(())
            }
            Err(e) => Err(e),
        }
    }
}
