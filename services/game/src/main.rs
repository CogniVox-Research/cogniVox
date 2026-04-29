#![warn(clippy::all)]
#![deny(clippy::unwrap_used)]

#[macro_use]
extern crate rocket;

use std::{sync::Arc, vec};

use common::file_store::Store;
use rocket::{
    fs::{FileServer, Options},
    response::Redirect,
};

use crate::app::AppState;

mod app;
pub mod config;
mod controller;
mod dto;
mod error;
mod game;
mod services;
mod util;

#[rocket::get("/")]
async fn index() -> Redirect {
    Redirect::moved(uri!("/ui"))
}

#[rocket::get("/health")]
async fn health() -> &'static str {
    "OK"
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
        .manage(Arc::new(app_state))
        .mount("/", routes![index, health])
        .mount("/", controller::route_list())
        .mount(
            "/ui",
            FileServer::new("assets", Options::Index | Options::NormalizeDirs),
        )
}
