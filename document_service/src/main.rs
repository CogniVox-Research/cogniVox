#[macro_use]
extern crate rocket;

use common::file_store::Store;
use rocket::form::Form;
use rocket::response::content::RawHtml;
use rocket::response::status::Custom;
use rocket::serde::json::Json;
use rocket::{State, fs::TempFile, http::Status};

mod config;
mod dto;
mod extractor;
mod upload;

#[rocket::get("/")]
async fn index() -> RawHtml<&'static str> {
    RawHtml(include_str!("../assets/index.html"))
}

#[rocket::post("/upload/<session_id>", data = "<file>")]
async fn upload_file(
    session_id: &str,
    file: Form<TempFile<'_>>,
    store: &State<Store>,
) -> Result<Json<dto::FileContent>, Custom<Json<String>>> {
    let mime_type = match file.content_type() {
        Some(mime) => mime.to_owned(),
        None => return Err(Custom(Status::BadRequest, Json("Missing MIME type".into()))),
    };

    let extension = mime_type.extension().map(|v| v.as_str()).unwrap_or("bin");

    let text = match extractor::extract_text(&file, &mime_type).await {
        Ok(Some(text)) => text,
        Ok(None) => {
            return Err(Custom(
                Status::BadRequest,
                Json(format!("Unsupported file type (got {})", mime_type)),
            ));
        }
        Err(err) => {
            return Err(Custom(
                Status::InternalServerError,
                Json(format!("Failed to parse document: {}", err)),
            ));
        }
    };

    let content = dto::FileContent {
        filename: format!("original.{extension}"),
        file_type: mime_type.to_string(),
        text,
    };

    upload::upload_to_store(store, session_id, &file, &content)
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
        .mount("/", routes![index, upload_file])
}
