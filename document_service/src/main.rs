#[macro_use]
extern crate rocket;

use common::file_store::Store;
use rocket::form::Form;
use rocket::response::content::RawHtml;
use rocket::response::status::Custom;
use rocket::serde::json::Json;
use rocket::{State, fs::TempFile};

mod config;
mod dto;
mod extractor;
mod upload;

#[rocket::get("/")]
async fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}
#[rocket::post("/parse", data = "<file>")]
async fn parse_file(
    file: Form<TempFile<'_>>,
) -> Result<Json<dto::ParseResponse>, Custom<Json<String>>> {
    let (mime_type, text) = extractor::extract_text(&file).await?;

    Ok(Json(dto::ParseResponse {
        file_type: mime_type.to_string(),
        text,
    }))
}

#[rocket::post("/upload/<session_id>", data = "<file>")]
async fn upload_file(
    file: Form<TempFile<'_>>,
    store: &State<Store>,
    session_id: uuid::Uuid,
) -> Result<Json<dto::FileToken>, Custom<Json<String>>> {
    let (mime_type, text) = extractor::extract_text(&file).await?;

    let dir = format!("{session_id}/documents");
    let extension = mime_type.extension().map(|v| v.as_str()).unwrap_or("bin");

    let content = dto::FileToken {
        document_id: session_id,
        //TODO: user id
        content_path: format!("{dir}/content"),
        original_path: format!("{dir}/original.{extension}"),
    };

    upload::upload_to_store(store, &file, &content, text)
        .await
        .unwrap();

    Ok(Json(content))
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
        .mount("/", routes![index, upload_file, parse_file])
}
