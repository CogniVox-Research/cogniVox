use rocket::{State, fs::NamedFile};
use rocket_ws::{Channel, WebSocket};

use crate::config::Config;

mod audio_pipeline;
mod config;
mod dto;
pub mod error;
mod file_store;
mod transcription;
mod websocket;

pub use file_store::RecordingStore;

#[macro_use]
extern crate rocket;

#[get("/")]
async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("assets/index.html").await
}

#[get("/audio/<session_id>")]
fn stream_audio(
    ws: WebSocket,
    config: &State<Config>,
    store: &State<RecordingStore>,
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
    let store = RecordingStore::from_config(&cfg.recording_store);

    rocket
        .manage(cfg)
        .manage(store)
        .mount("/", routes![index, stream_audio])
}
