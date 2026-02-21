use rocket::tokio::sync::mpsc;
use std::fmt::Debug;

use rocket::{
    futures::{SinkExt, StreamExt},
    tokio,
};
use rocket_ws::{Channel, Message, WebSocket};

use crate::{
    error::{Error, Result},
    ws::proto::{GameInbound, GameOutbound, WebInbound, WebOutbound},
};

pub type WebConnection = Connection<WebInbound, WebOutbound>;
pub type GameConnection = Connection<GameInbound, GameOutbound>;

pub struct Connection<In, Out> {
    inbound: mpsc::Receiver<In>,
    outbound: mpsc::Sender<Out>,

    handler: Option<(mpsc::Sender<In>, mpsc::Receiver<Out>)>,
}

impl<In, Out> Connection<In, Out>
where
    In: TryFrom<Message> + Send + 'static,
    Out: TryInto<Message> + Send + 'static,
    <Out as TryInto<rocket_ws::Message>>::Error: Debug + Send,
    <In as TryFrom<rocket_ws::Message>>::Error: Debug + Send,
{
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
                        tokio::select! {
                            Some(msg) = outbound_rx.recv() => {
                                match TryInto::<Message>::try_into(msg){
                                    Ok(message)=>{
                                        if !ws_sink.send(message).await.is_ok(){
                                            log::error!("closed ws sender");
                                            break;
                                        }
                                    },
                                    Err(e)=> {
                                         log::error!("Failed to convert message: {e:?}");
                                    }
                                }
                            }

                            Some(Ok(msg)) = ws_stream.next() => {
                                match TryFrom::<Message>::try_from(msg){
                                    Ok(data)=>{
                                       if !inbound_tx.send(data).await.is_ok(){
                                           log::error!("inbound rx sender");
                                           break;
                                       }
                                    },
                                    Err(e)=> {
                                         log::error!("Failed to convert message: {e:?}");
                                    }
                                }
                            }
                            else => {
                                log::error!("select close");
                                break;
                            },
                        };
                    }
                    log::error!("closed");
                });
                Ok(())
            })
        })
    }
}
