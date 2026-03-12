#![warn(clippy::pedantic)]
#![deny(clippy::unwrap_used)]
#![allow(clippy::cast_possible_truncation)]

use common::{
    dto::{ASRSessionType, AudioFormat},
    file_store::Store,
    util::fail::Fail,
};
use rocket::{State, response::content::RawHtml, tokio};
use rocket_ws::{Channel, WebSocket};

mod asr;
mod audio;
mod config;
mod dto;
pub mod error;
mod mq;

#[macro_use]
extern crate rocket;

#[get("/")]
fn index() -> RawHtml<&'static str> {
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
            asr::run_asr(
                asr::AudioStreamInput::WS(stream),
                session_id,
                AudioFormat::WebM,
                ASRSessionType::Speech,
                transcriber,
                store,
            )
            .await
            .log_err("Error in asr session");
            Ok(())
        })
    })
}

#[launch]
fn rocket() -> _ {
    let rocket = rocket::build();
    let cfg: config::Config = rocket.figment().extract().fail("Failed to load config");
    let store = Store::from_config(&cfg.recording_store).fail("Failed to setup store");
    let transcriber = asr_rs::Transcriber::new(cfg.asr).fail("Failed to initalize ASR");

    transcriber
        .download_models()
        .expect("Models should download successfully");

    if let Some(mq_config) = cfg.rabbitmq {
        log::info!("Started rabbit mq listener");

        tokio::spawn(mq::start_mq_listener(
            mq_config,
            store.clone(),
            transcriber.clone(),
        ));
    } else {
        log::info!("MQ config not found. Skipping mq listener");
    }

    rocket
        .manage(transcriber)
        .manage(store)
        .mount("/", routes![index, stream_audio])
}
