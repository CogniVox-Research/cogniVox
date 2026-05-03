use std::sync::Arc;

use common::file_store::Store;
use rocket::State;
use rocket_ws::{Channel, WebSocket};

use crate::{
    app::{AppState, PendingSession},
    game::{
        self,
        proto::{
            self, DeviceOutbound, GameConnection, GameOutbound, WebConnection, WebInbound,
            WebOutbound,
        },
    },
    services::{Llm, documents::fetch_document},
    util,
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

    let state = state.inner().clone();
    let store = store.inner().clone();

    log::info!("Web Connected {session_id}");

    util::websocket_task(async move {
        con.send(WebOutbound::Session { session_id }).await?;

        let settings = proto::recv_message!(con, WebInbound::Start)?;

        log::info!("Got game settings {settings:?}");
        con.send(WebOutbound::ServerPrepair).await?;

        log::info!("Got document {}", settings.document_id);
        let expected_speech = fetch_document(&store, session_id, &settings.document_id).await?;

        let questions = if settings.scene.is_inteview() || settings.qa {
            log::info!("Generating questions");
            let questions = state
                .endpoints
                .get_questions(settings.scene.is_inteview(), &expected_speech)
                .await;
            log::info!("Generated questions: {:?}", questions);
            questions
        } else {
            None
        };

        proto::wait_for!(con, WebInbound::Ready)?;

        if let Some(device) = state.vr.lock().await.get(&user.user_id) {
            device.con.send(DeviceOutbound::Join { session_id }).await?;
        } else {
            con.send(WebOutbound::Pair { session_id }).await?;
        }

        state.pending.lock().await.insert(
            session_id,
            PendingSession {
                con,
                session_id,
                document: expected_speech,
                user_id: user.user_id,
                settings,
                questions,
            },
        );

        Ok(())
    });

    channel
}

#[rocket::get("/ws/game/<session_id>")]
pub async fn game_session<'r>(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &'_ State<Arc<AppState>>,
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

    game::test_session::start_test_session(con).await;

    channel
}
