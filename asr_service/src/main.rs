use common::{
    dto::{ASRSessionCreate, MQMessage},
    file_store::Store,
    mq,
};
use rocket::{State, response::content::RawHtml, tokio};
use rocket_ws::{Channel, WebSocket};

use crate::transcript::{Input, run_transcription};

mod audio;
mod config;
mod dto;
pub mod error;
mod transcript;

#[macro_use]
extern crate rocket;

#[get("/")]
async fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}

#[get("/audio/<session_id>")]
fn stream_audio(
    ws: WebSocket,
    transcriber: &State<asr_rs::Transcriber>,
    store: &State<Store>,
    session_id: &str,
) -> Channel<'static> {
    let transcriber = transcriber.inner().clone();
    let session_id = session_id.to_owned();
    let store = store.inner().clone();

    ws.channel(move |stream| {
        Box::pin(async move {
            transcript::run_transcription(
                transcript::Input::WS(stream),
                session_id,
                transcriber,
                store,
            )
            .await
            .unwrap();
            Ok(())
        })
    })
}

#[launch]
async fn rocket() -> _ {
    let rocket = rocket::build();
    let cfg: config::Config = rocket.figment().extract().expect("config");
    let store = Store::from_config(&cfg.recording_store).expect("store should load");
    let transcriber = asr_rs::Transcriber::new(cfg.asr).expect("transcriber should be created");
    transcriber
        .download_models()
        .expect("Models should download successfully");

    let rabbit_mq = mq::Connection::for_config(cfg.rabbitmq)
        .await
        .expect("connection should succeed");

    let mut listener = rabbit_mq
        .recieve::<ASRSessionCreate>(Some("start".to_owned()))
        .await
        .unwrap()
        .bind_exchange("asr_start".to_string(), "start".to_string())
        .await
        .unwrap();

    let mq_store = store.clone();
    let mq_transcriber = transcriber.clone();
    tokio::spawn(async move {
        while let Some(data) = listener.recv().await {
            let data = data.unwrap().get().await.unwrap();
            log::info!("got session start {data:?}");
            let session_id = data.session_id.to_string();

            let recv = rabbit_mq
                .recieve::<Vec<u8>>(None)
                .await
                .unwrap()
                .bind_exchange("audio".to_owned(), session_id.clone())
                .await
                .unwrap();

            let send = rabbit_mq
                .sender::<MQMessage>(&session_id, Some("asr".to_owned()))
                .await
                .unwrap();

            let mq_store = mq_store.clone();
            let mq_transcriber = mq_transcriber.clone();
            tokio::spawn(async move {
                run_transcription(
                    Input::MQ(recv, send),
                    session_id,
                    mq_transcriber.clone(),
                    mq_store.clone(),
                )
                .await
                .unwrap()
            });
        }
    });

    rocket
        .manage(transcriber)
        .manage(store)
        .mount("/", routes![index, stream_audio])
}
