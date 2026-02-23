#[macro_use]
extern crate rocket;

use std::collections::HashMap;

use common::file_store::Store;
use rocket::{State, futures::lock::Mutex, response::content::RawHtml};
use rocket_ws::{Channel, WebSocket};

use crate::game::proto::{GameConnection, WebConnection, WebOutbound};

mod config;
mod dto;
mod error;
mod game;
mod service;

#[rocket::get("/")]
async fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}

#[derive(Debug, Default)]
pub struct AppState {
    pending: Mutex<HashMap<uuid::Uuid, WebConnection>>,
}

#[rocket::get("/ws/game/<session_id>")]
async fn game_session(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &State<AppState>,
) -> Channel<'_> {
    let mut cache_guard = state.pending.lock().await;
    let Some(web) = cache_guard.remove(&session_id) else {
        panic!("Invalid")
    };

    let mut con = GameConnection::new();
    let channel = con.handle_websocket(ws);

    game::start_game(session_id, con, web).await.unwrap();

    channel
}

#[rocket::get("/ws/web")]
async fn web_session(ws: WebSocket, state: &State<AppState>) -> Channel<'_> {
    let session_id = uuid::Uuid::now_v7();

    let mut con = WebConnection::new();
    con.send(WebOutbound::Pair(session_id.to_string()))
        .await
        .unwrap();

    let channel = con.handle_websocket(ws);

    let mut pending = state.pending.lock().await;
    pending.insert(session_id, con);
    channel
}

#[rocket::launch]
fn rocket() -> _ {
    let rocket = rocket::build();
    let figment = rocket.figment();
    let config: config::AppConfig = figment.extract().expect("Config should load");
    let store = Store::from_config(&config.file_store).expect("Store should should create");

    rocket
        .manage(config)
        .manage(store)
        .manage(AppState::default())
        .mount("/", routes![index, web_session, game_session])
}
