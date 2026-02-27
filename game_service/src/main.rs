#[macro_use]
extern crate rocket;

use common::file_store::Store;
use rocket::{
    State,
    fs::{FileServer, Options},
    response::Redirect,
};
use rocket_ws::{Channel, WebSocket};

use crate::{
    app::AppState,
    game::proto::{GameConnection, WebConnection, WebOutbound},
};

mod app;
mod config;
mod dto;
mod error;
mod game;

#[rocket::get("/")]
async fn index() -> Redirect {
    Redirect::moved(uri!("/ui"))
}

#[rocket::get("/ws/game/<session_id>")]
async fn game_session<'a, 'r>(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &'a State<AppState>,
    store: &'a State<Store>,
) -> Channel<'r> {
    let mut cache_guard = state.pending.lock().await;
    let Some(web) = cache_guard.remove(&session_id) else {
        panic!("Invalid")
    };

    let mut con = GameConnection::new();
    let channel = con.handle_websocket(ws);

    let result = game::start_game(state.inner(), store.inner(), session_id, con, web).await;
    if let Err(e) = result {
        log::error!("WS Error {e}")
    }

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
async fn rocket() -> _ {
    let rocket = rocket::build();
    let figment = rocket.figment();
    let config: config::AppConfig = figment.extract().expect("Config should load");
    let store = Store::from_config(&config.file_store).expect("Store should should create");
    let app_state = AppState::create(config).await.expect("App should init");

    rocket
        .manage(store)
        .manage(app_state)
        .mount("/", routes![index, web_session, game_session])
        .mount(
            "/ui",
            FileServer::new("assets", Options::Index | Options::NormalizeDirs),
        )
}
