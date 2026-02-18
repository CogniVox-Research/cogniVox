use rocket::{State, fairing::AdHoc, fs::NamedFile};
use rocket_ws::{Channel, WebSocket};

use crate::config::Config;

mod audio_pipeline;
mod config;
pub mod error;
mod transcription;
mod websocket;

#[macro_use]
extern crate rocket;

#[get("/")]
async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("assets/index.html").await
}

#[get("/audio/<session_id>")]
fn stream_audio(ws: WebSocket, config: &State<Config>, session_id: &str) -> Channel<'static> {
    let path = config.recording_dir.join(session_id);
    let model_config = config.model.clone();

    ws.channel(move |stream| {
        Box::pin(async move {
            websocket::handle_websocket(stream, path, model_config)
                .await
                .unwrap();
            Ok(())
        })
    })
}

#[launch]
async fn rocket() -> _ {
    rocket::build()
        .attach(AdHoc::config::<config::Config>())
        .mount("/", routes![index, stream_audio])
}
