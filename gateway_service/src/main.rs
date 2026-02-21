#[macro_use]
extern crate rocket;

use common::file_store::Store;

mod config;
mod dto;
mod error;
mod proto;

#[rocket::get("/")]
async fn index() -> &'static str {
    "Hello World!"
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
        .mount("/", routes![index])
}
