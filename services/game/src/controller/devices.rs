use std::sync::Arc;

use rocket::{State, serde::json::Json};
use rocket_ws::{Channel, WebSocket};

use crate::{
    app::{AppState, Device},
    game::proto::{self, DeviceConnection, DeviceInbound, DeviceOutbound},
    util,
};

#[rocket::get("/ws/device")]
pub async fn vr_device(
    ws: WebSocket,
    state: &State<Arc<AppState>>,
    user: super::guard::User,
) -> Channel<'_> {
    let device_id = uuid::Uuid::now_v7();

    let mut con = DeviceConnection::new();
    let channel = con.handle_websocket(ws);
    let state = state.inner().clone();

    util::websocket_task(async move {
        con.send(DeviceOutbound::Ok {
            device_id,
            user_name: user.username.clone(),
        })
        .await?;

        let info = proto::recv_message!(con, DeviceInbound::Connect)?;

        let pending_devices = state.pending.lock().await;
        for pending in pending_devices.values() {
            if pending.user_id == user.user_id {
                con.send(DeviceOutbound::Join {
                    session_id: pending.session_id,
                })
                .await?;
                break;
            }
        }

        let device = Device {
            con,
            device_id,
            device_name: info.device_name,
            user_id: user.user_id.clone(),
        };

        log::info!("Device connected: {device:?} for user {user:?}");

        let mut vr = state.vr.lock().await;
        vr.insert(device.user_id.clone(), device);

        Ok(())
    });

    channel
}

#[rocket::get("/devices")]
pub async fn get_devices(
    state: &State<Arc<AppState>>,
    _user: super::guard::User,
) -> Json<Vec<(String, uuid::Uuid)>> {
    let devices = state.vr.lock().await;
    let mut user_devices = vec![];

    for (_, device) in devices.iter() {
        user_devices.push((device.device_name.clone(), device.device_id));
    }

    Json(user_devices)
}
