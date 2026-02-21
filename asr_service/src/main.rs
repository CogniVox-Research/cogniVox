use common::file_store::Store;
use rocket::{State, response::content::RawHtml};
use rocket_ws::{Channel, WebSocket};

mod audio_processing;
mod config;
mod dto;
pub mod error;
mod transcription;
mod websocket;

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
            websocket::handle_websocket(stream, session_id, transcriber, store)
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

    rocket
        .manage(transcriber)
        .manage(store)
        .mount("/", routes![index, stream_audio])
}
