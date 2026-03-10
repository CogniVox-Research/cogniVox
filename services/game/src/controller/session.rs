use std::sync::Arc;

use common::file_store::Store;
use rocket::{State, tokio};
use rocket_ws::{Channel, WebSocket};

use crate::{
    app::{AppState, PendingSession},
    config::AppConfig,
    game::{
        self,
        proto::{
            self, DeviceOutbound, GameConnection, GameOutbound, WebConnection, WebInbound,
            WebOutbound,
        },
    },
    services::documents::fetch_document,
};

#[rocket::get("/ws/web")]
pub async fn web_session<'a, 'r>(
    ws: WebSocket,
    state: &'a State<Arc<AppState>>,
    store: &'a State<Store>,
    user: super::guard::User,
) -> Channel<'r> {
    let session_id = uuid::Uuid::new_v4();

    let mut con = WebConnection::new();
    let channel = con.handle_websocket(ws);

    let devices = state.vr.clone();
    let pending = state.pending.clone();
    let store = store.inner().clone();

    log::info!("Web Connected {session_id}");

    tokio::spawn(async move {
        con.send(WebOutbound::Session { session_id }).await.unwrap();

        let settings = proto::recv_message!(con, WebInbound::Start).unwrap();

        // TODO: validate document and settings.
        log::info!("Got game settings {settings:?}");

        log::info!("Got document {}", settings.document_id);
        let expected_speech = fetch_document(&store, session_id, &settings.document_id)
            .await
            .unwrap();

        proto::wait_for!(con, WebInbound::Ready).unwrap();

        if let Some(device) = devices.lock().await.get(&user.user_id) {
            device
                .con
                .send(DeviceOutbound::Join { session_id })
                .await
                .unwrap();
        } else {
            con.send(WebOutbound::Pair { session_id }).await.unwrap();
        }

        pending.lock().await.insert(
            session_id,
            PendingSession {
                con,
                session_id,
                document: expected_speech,
                user_id: user.user_id,
                settings,
            },
        );
    });

    channel
}

#[rocket::get("/ws/game/<session_id>")]
pub async fn game_session<'a, 'b, 'r>(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &'a State<Arc<AppState>>,
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

    let result = game::start_game(state.inner(), con, web).await;
    if let Err(e) = result {
        log::error!("WS Error {e}")
    }

    channel
}

#[rocket::get("/ws/game/test")]
pub async fn test_game_session<'r>(ws: WebSocket) -> Channel<'r> {
    let mut con = GameConnection::new();
    let channel = con.handle_websocket(ws);

    game::test_session::start_test_session(con).await.unwrap();

    channel
}
