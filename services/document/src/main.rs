#![warn(clippy::pedantic)]
#![deny(clippy::unwrap_used)]
#[macro_use]
extern crate rocket;

use common::file_store::Store;
use common::util::fail::Fail;
use rocket::form::Form;
use rocket::http::Status;
use rocket::response::content::RawHtml;
use rocket::response::status::Custom;
use rocket::serde::json::Json;
use rocket::{State, fs::TempFile};

mod config;
mod dto;
mod extractor;
mod upload;

#[rocket::get("/")]
fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}

#[rocket::get("/health")]
fn health() -> &'static str {
    "OK"
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
    let extension = mime_type.extension().map_or("bin", |v| v.as_str());

    let content = dto::FileToken {
        document_id: session_id,
        //TODO: user id
        content_path: format!("{dir}/content"),
        original_path: format!("{dir}/original.{extension}"),
    };

    let result = upload::upload_to_store(store, &file, &content, text).await;
    match result {
        Ok(()) => Ok(Json(content)),
        Err(e) => {
            log::error!("Failed to upload file: {e}");
            Err(Custom(
                Status::InternalServerError,
                Json("Failed to upload file".to_owned()),
            ))
        }
    }
}

#[rocket::launch]
fn rocket() -> _ {
    let rocket = rocket::build();
    let figment = rocket.figment();
    let config: config::AppConfig = figment.extract().fail("Failed to load config");
    let store = Store::from_config(&config.file_store).fail("Failed to create store");

    rocket
        .manage(config)
        .manage(store)
        .mount("/", routes![index, upload_file, parse_file, health])
}
