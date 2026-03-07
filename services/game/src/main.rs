#[macro_use]
extern crate rocket;

use std::vec;

use common::file_store::Store;
use jwt::{Header, RegisteredClaims, VerifyWithKey};
use rocket::{
    State,
    fs::{FileServer, Options},
    response::Redirect,
    serde::json::Json,
    tokio,
};
use rocket_ws::{Channel, WebSocket};

use crate::{
    app::{AppState, Device, get_public_key},
    game::proto::{
        self, DeviceConnection, DeviceInbound, DeviceOutbound, GameConnection, GameOutbound,
        WebConnection, WebOutbound,
    },
    guard::User,
};

mod app;
mod config;
mod dto;
mod error;
mod game;
mod guard;

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
    let channel = con.handle_websocket(ws);

    let devices = state.vr.clone();
    let key = get_public_key();

    tokio::spawn(async move {
        con.send(DeviceOutbound::Ok {
            device_id,
            user_name: "Test User".to_owned(),
        })
        .await
        .unwrap();

        let info = proto::recv_message!(con, DeviceInbound::Connect).unwrap();
        let token: jwt::Token<Header, RegisteredClaims, _> =
            info.auth.verify_with_key(&key).unwrap();
        let user_id = token.claims().subject.clone().unwrap();

        let device = Device {
            con,
            device_id,
            device_name: info.device_name,
            user_id,
        };
        log::info!("Device connected: {device:?}");

        let mut vr = devices.lock().await;
        vr.insert(device.user_id.clone(), device);
    });

    channel
}

#[rocket::get("/devices")]
async fn get_devices(state: &State<AppState>, user: User) -> Json<Vec<(String, uuid::Uuid)>> {
    let devices = state.vr.lock().await;
    let mut user_devices = vec![];

    for (_, device) in devices.iter() {
        user_devices.push((device.device_name.clone(), device.device_id));
    }

    Json(user_devices)
}

#[rocket::get("/ws/web")]
async fn web_session(ws: WebSocket, state: &State<AppState>, user: User) -> Channel<'_> {
    let session_id = uuid::Uuid::now_v7();

    let mut con = WebConnection::new();
    let channel = con.handle_websocket(ws);

    let devices = state.vr.lock().await;
    if let Some(device) = devices.get(&user.user_id) {
        device
            .con
            .send(DeviceOutbound::Join { session_id })
            .await
            .unwrap();
    } else {
        con.send(WebOutbound::Pair { session_id }).await.unwrap();
    }

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
                vr_device,
                get_devices
            ],
        )
        .mount(
            "/ui",
            FileServer::new("assets", Options::Index | Options::NormalizeDirs),
        )
}
