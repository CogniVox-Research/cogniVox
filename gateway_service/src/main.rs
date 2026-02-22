#[macro_use]
extern crate rocket;

use std::collections::HashMap;

use common::file_store::Store;
use rocket::{State, futures::lock::Mutex, response::content::RawHtml};
use rocket_ws::{Channel, WebSocket};

use crate::ws::{GameConnection, WebConnection, proto::WebOutbound};

mod config;
mod dto;
mod error;
mod game;
mod ws;

#[rocket::get("/")]
async fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}

type Pending = Mutex<HashMap<uuid::Uuid, WebConnection>>;

#[rocket::get("/test")]
async fn test(state: &State<Pending>) {
    let mut data = state.lock().await;
    for (session_id, con) in data.iter_mut() {
        println!("id: {}", session_id);
        while let Ok(s) = con.try_recv() {
            println!("Got: {:?}", s);
        }

        con.send(WebOutbound::QR("Hello".to_owned())).await.unwrap();
    }
}

#[rocket::get("/ws/game/<session_id>")]
async fn game_session(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &State<Pending>,
) -> Channel<'_> {
    let mut cache_guard = state.lock().await;
    let Some(web) = cache_guard.remove(&session_id) else {
        panic!("Invalid")
    };

    let mut game = GameConnection::new();
    let channel = game.handle_websocket(ws);

    web.send(WebOutbound::GameConnected).await.unwrap();
    channel
}

#[rocket::get("/ws/web")]
async fn web_session(ws: WebSocket, state: &State<Pending>) -> Channel<'_> {
    let session_id = uuid::Uuid::now_v7();

    let mut con = WebConnection::new();
    con.send(WebOutbound::QR(session_id.to_string()))
        .await
        .unwrap();

    let channel = con.handle_websocket(ws);

    let mut pending = state.lock().await;
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
        .manage(Mutex::new(HashMap::<uuid::Uuid, WebConnection>::new()))
        .mount("/", routes![index, web_session, test, game_session])
}
