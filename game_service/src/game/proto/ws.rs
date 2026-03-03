use std::sync::atomic::AtomicBool;
use std::sync::{self, Arc};
use std::time::Duration;

use rocket::{futures::stream::SplitSink, tokio::sync::mpsc};

use rocket::{
    futures::{SinkExt, StreamExt},
    tokio,
};
use rocket_ws::{Channel, Message, stream::DuplexStream};

use crate::error::{Error, Result};

pub trait Inbound: Sized + Send + 'static {
    fn from_message(m: Message) -> Result<Self>;
}

pub trait Outbound: Sized + Send + 'static {
    fn into_message(self) -> Result<Message>;
}

pub struct WebSocket<In: Inbound, Out: Outbound> {
    inbound: mpsc::Receiver<In>,
    outbound: mpsc::Sender<Out>,

    handler: Option<(mpsc::Sender<In>, mpsc::Receiver<Out>)>,
    disconnect: Arc<AtomicBool>,
}

impl<In: Inbound, Out: Outbound> WebSocket<In, Out> {
    pub fn new() -> Self {
        let (inbound_tx, inbound_rx) = mpsc::channel::<In>(100);
        let (outbound_tx, outbound_rx) = mpsc::channel::<Out>(100);
        WebSocket {
            inbound: inbound_rx,
            outbound: outbound_tx,
            handler: Some((inbound_tx, outbound_rx)),
            disconnect: Default::default(),
        }
    }

    pub fn is_connected(&self) -> bool {
        !self.disconnect.load(sync::atomic::Ordering::Relaxed)
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

    pub fn handle_websocket<'r>(&mut self, ws: rocket_ws::WebSocket) -> Channel<'r> {
        let Some((inbound_tx, mut outbound_rx)) = self.handler.take() else {
            panic!("multiple calls to handle_websocket");
        };
        let disconnect = self.disconnect.clone();

        let mut timer = tokio::time::interval(Duration::from_secs(15));
        let mut last_ping = None;

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
                                Self::read_message(&inbound_tx, &mut last_ping, msg).await.err()
                            }
                            _ = timer.tick() =>{
                                Self::ping_client(&mut ws_sink, &mut last_ping).await.err()
                            },
                            else => Some(Error::SocketClose),
                        };

                        if let Some(err) = result {
                            if !matches!(err, Error::SocketClose) {
                                log::error!("Closed ws connection due to error: {err}")
                            }
                            break;
                        }
                    }
                    disconnect.store(true, sync::atomic::Ordering::Relaxed);
                });
                Ok(())
            })
        })
    }

    async fn ping_client(
        ws_sink: &mut SplitSink<DuplexStream, Message>,
        last_ping: &mut Option<Vec<u8>>,
    ) -> Result<()> {
        if last_ping.is_some() {
            return Err(Error::SocketTimeout);
        }

        let mut ping = vec![0; 32];
        rand::fill(&mut ping);

        *last_ping = Some(ping.clone());
        let result = ws_sink.send(Message::Ping(ping)).await;

        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                log::error!("Websocket write returned error {e}");
                Err(Error::SocketClose)
            }
        }
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
        inbound_tx: &mpsc::Sender<In>,
        last_ping: &mut Option<Vec<u8>>,
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
            Err(Error::SocketPong(data)) => {
                if let Some(expected_pong) = last_ping {
                    if *expected_pong == data {
                        last_ping.take();
                    }
                }
                Ok(())
            }
            Err(e) => Err(e),
        }
    }
}

/// waits until the given message is recieved from the connection and returns its content.
/// Other messages and unexpected websocket messages are ignored.
#[macro_export]
macro_rules! recv_message {
    ($expression:expr, $variant:path) => {{
        loop {
            let result = match $expression.recv().await {
                #[allow(unreachable_patterns)]
                Ok(message) => match message {
                    $variant(v) => Ok(v),
                    _ => {
                        log::debug!("Recieved unexpected message: {message:?}");
                        continue;
                    }
                },
                Err(crate::error::Error::UnexpectedMessage(err)) => {
                    log::debug!("Recieved unexpected message: {err}");
                    continue;
                }
                Err(e) => Err(e),
            };
            break result;
        }
    }};
}

/// waits until the given message is recieved from the connection.
/// Other messages and unexpected websocket messages are ignored.
#[macro_export]
macro_rules! wait_for {
    ($expression:expr, $variant:path) => {{
        loop {
            let result = match $expression.recv().await {
                #[allow(unreachable_patterns)]
                Ok(message) => match message {
                    $variant => Ok(()),
                    _ => {
                        log::debug!("Recieved unexpected message: {message:?}");
                        continue;
                    }
                },
                Err(crate::error::Error::UnexpectedMessage(err)) => {
                    log::debug!("Recieved unexpected message: {err}");
                    continue;
                }
                Err(e) => Err(e),
            };
            break result;
        }
    }};
}

pub use recv_message;
pub use wait_for;
