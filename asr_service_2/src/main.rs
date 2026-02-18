use rocket::fs::NamedFile;
use rocket_ws::{Channel, WebSocket};
use std::path::PathBuf;

mod audio_pipeline;
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
fn stream_audio(ws: WebSocket, session_id: &str) -> Channel<'static> {
    let path = PathBuf::from("./recordings/").join(session_id);

    ws.channel(move |stream| {
        Box::pin(async move {
            websocket::handle_websocket(stream, path).await.unwrap();
            Ok(())
        })
    })
}

#[launch]
async fn rocket() -> _ {
    rocket::build().mount("/", routes![index, stream_audio])
}
