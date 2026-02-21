use rocket::tokio::sync::mpsc;
use std::fmt::Debug;

use rocket::{
    futures::{SinkExt, StreamExt},
    tokio,
};
use rocket_ws::{Message, stream::DuplexStream};

pub struct Recv<In, Out>(pub mpsc::Receiver<In>, pub mpsc::Sender<Out>)
where
    In: TryFrom<Message> + Send,
    Out: TryInto<Message> + Send,
    <Out as TryInto<rocket_ws::Message>>::Error: Debug + Send,
    <In as TryFrom<rocket_ws::Message>>::Error: Debug + Send;

pub struct Trx<In, Out>(pub mpsc::Sender<In>, pub mpsc::Receiver<Out>)
where
    In: TryFrom<Message> + Send,
    Out: TryInto<Message> + Send,
    <Out as TryInto<rocket_ws::Message>>::Error: Debug + Send,
    <In as TryFrom<rocket_ws::Message>>::Error: Debug + Send;

pub fn make_con_pair<In, Out>() -> (Recv<In, Out>, Trx<In, Out>)
where
    In: TryFrom<Message> + Send + 'static,
    Out: TryInto<Message> + Send + 'static,
    <Out as TryInto<rocket_ws::Message>>::Error: Debug + Send,
    <In as TryFrom<rocket_ws::Message>>::Error: Debug + Send,
{
    let (inbound_tx, inbound_rx) = mpsc::channel::<In>(100);
    let (outbound_tx, outbound_rx) = mpsc::channel::<Out>(100);

    return (Recv(inbound_rx, outbound_tx), Trx(inbound_tx, outbound_rx));
}

pub async fn socket_handler<In, Out>(stream: DuplexStream, tx: Trx<In, Out>)
where
    In: TryFrom<Message> + Send + 'static,
    Out: TryInto<Message> + Send + 'static,
    <Out as TryInto<rocket_ws::Message>>::Error: Debug + Send,
    <In as TryFrom<rocket_ws::Message>>::Error: Debug + Send,
{
    let inbound_tx = tx.0;
    let mut outbound_rx = tx.1;

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
}
