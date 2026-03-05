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
    game::proto::{
        DeviceConnection, DeviceOutbound, GameConnection, GameOutbound, WebConnection, WebOutbound,
    },
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

#[rocket::get("/ws/game/test")]
async fn test_game_session<'r>(ws: WebSocket) -> Channel<'r> {
    let mut con = GameConnection::new();
    let channel = con.handle_websocket(ws);

    game::test_session::start_test_session(con).await.unwrap();

    channel
}

#[rocket::get("/ws/game/<session_id>")]
async fn game_session<'a, 'r>(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &'a State<AppState>,
    store: &'a State<Store>,
) -> Channel<'r> {
    let mut con = GameConnection::new();
    let channel = con.handle_websocket(ws);

    let mut pending_guard = state.pending.lock().await;
    let Some(web) = pending_guard.remove(&session_id) else {
        let result = con
            .send(GameOutbound::Error("Session Not Found".to_string()))
            .await;
        if let Err(e) = result {
            log::error!("WS Error {e}")
        }

        con.disconnect();
        return channel;
    };

    let result = game::start_game(state.inner(), store.inner(), session_id, con, web).await;
    if let Err(e) = result {
        log::error!("WS Error {e}")
    }

    channel
}

#[rocket::get("/ws/device")]
async fn vr_device(ws: WebSocket, state: &State<AppState>) -> Channel<'_> {
    let device_id = uuid::Uuid::now_v7();

    let mut con = DeviceConnection::new();
    con.send(DeviceOutbound::Ok {
        device_id,
        user_name: "Test User".to_owned(),
    })
    .await
    .unwrap();

    let channel = con.handle_websocket(ws);

    let mut vr = state.vr.lock().await;
    vr.insert(device_id, con);
    channel
}

#[rocket::get("/ws/web")]
async fn web_session(ws: WebSocket, state: &State<AppState>) -> Channel<'_> {
    let session_id = uuid::Uuid::now_v7();

    let mut con = WebConnection::new();
    con.send(WebOutbound::Pair(session_id.to_string()))
        .await
        .unwrap();

    // TODO: device filter
    let devices = state.vr.lock().await;
    for device in devices.values() {
        let _ = device.send(DeviceOutbound::Join { session_id }).await;
    }

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
        .mount(
            "/",
            routes![
                index,
                web_session,
                test_game_session,
                game_session,
                vr_device
            ],
        )
        .mount(
            "/ui",
            FileServer::new("assets", Options::Index | Options::NormalizeDirs),
        )
}
