#[macro_use]
extern crate rocket;

use std::collections::HashMap;

use common::file_store::Store;
use rocket::{
    State,
    futures::lock::Mutex,
    response::content::RawHtml,
    tokio::{self},
};
use rocket_ws::{Channel, WebSocket};

use crate::{
    proto::{GameInbound, GameOutbound, WebInbound, WebOutbound},
    ws::{Recv, socket_handler},
};

mod config;
mod dto;
mod error;
mod proto;
mod ws;

#[rocket::get("/")]
async fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}

type Pending = Mutex<HashMap<uuid::Uuid, Recv<WebInbound, WebOutbound>>>;

#[rocket::get("/test")]
async fn test(state: &State<Pending>) {
    let mut data = state.lock().await;
    for f in data.iter_mut() {
        println!("id: {}", f.0);
        while let Ok(s) = f.1.0.try_recv() {
            println!("Got: {:?}", s);
        }
        f.1.1.send(WebOutbound::QR("Hello".to_owned())).await;
    }
}

#[rocket::get("/ws/game/<session_id>")]
async fn game_session(
    ws: WebSocket,
    session_id: uuid::Uuid,
    state: &State<Pending>,
) -> Channel<'_> {
    let (inp, out) = crate::ws::make_con_pair::<GameInbound, GameOutbound>();

    let mut cache_guard = state.lock().await;
    let Some(web) = cache_guard.remove(&session_id) else {
        panic!("Invalid")
    };

    web.1.send(WebOutbound::GameConnected).await.unwrap();

    ws.channel(move |stream| {
        Box::pin(async move {
            tokio::spawn(async {
                socket_handler(stream, out).await;
                // TODO: remove from pending
            });
            Ok(())
        })
    })
}

#[rocket::get("/ws/web")]
async fn web_session(ws: WebSocket, state: &State<Pending>) -> Channel<'_> {
    let (inp, out) = crate::ws::make_con_pair::<WebInbound, WebOutbound>();

    let session_id = uuid::Uuid::now_v7();
    inp.1
        .send(WebOutbound::QR(session_id.to_string()))
        .await
        .unwrap();

    let mut cache_guard = state.lock().await;

    cache_guard.insert(session_id, inp);

    ws.channel(move |stream| {
        Box::pin(async move {
            tokio::spawn(async {
                socket_handler(stream, out).await;
                // TODO: remove from pending
            });
            Ok(())
        })
    })
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
        .manage(Mutex::new(HashMap::<
            uuid::Uuid,
            Recv<WebInbound, WebOutbound>,
        >::new()))
        .mount("/", routes![index, web_session, test, game_session])
}
