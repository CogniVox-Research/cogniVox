use jwt::{Header, RegisteredClaims, VerifyWithKey};
use rocket::{State, serde::json::Json, tokio};
use rocket_ws::{Channel, WebSocket};

use crate::{
    app::{AppState, Device, get_public_key},
    game::proto::{self, DeviceConnection, DeviceInbound, DeviceOutbound},
};

#[rocket::get("/ws/device")]
pub async fn vr_device(ws: WebSocket, state: &State<AppState>) -> Channel<'_> {
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
pub async fn get_devices(
    state: &State<AppState>,
    user: super::guard::User,
) -> Json<Vec<(String, uuid::Uuid)>> {
    let devices = state.vr.lock().await;
    let mut user_devices = vec![];

    for (_, device) in devices.iter() {
        user_devices.push((device.device_name.clone(), device.device_id));
    }

    Json(user_devices)
}
