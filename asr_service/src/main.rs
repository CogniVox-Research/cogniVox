use common::file_store::Store;
use rocket::{State, response::content::RawHtml};
use rocket_ws::{Channel, WebSocket};

use crate::config::Config;

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
    config: &State<Config>,
    store: &State<Store>,
    session_id: &str,
) -> Channel<'static> {
    let model_config = config.model.clone();
    let session_id = session_id.to_owned();
    let store = store.inner().clone();

    ws.channel(move |stream| {
        Box::pin(async move {
            websocket::handle_websocket(stream, session_id, model_config, store)
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
    let store = Store::from_config(&cfg.recording_store);

    rocket
        .manage(cfg)
        .manage(store)
        .mount("/", routes![index, stream_audio])
}
