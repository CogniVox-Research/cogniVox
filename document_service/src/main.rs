#[macro_use]
extern crate rocket;

use std::fs;
use std::path::PathBuf;

use regex::Regex;
use rocket::response::status::Custom;
use rocket::serde::Deserialize;
use rocket::serde::json::Json;
use rocket::tokio::fs as async_fs;
use rocket::tokio::io::AsyncReadExt;
use rocket::{State, fs::TempFile, http::Status};
use serde::Serialize;

#[derive(Debug, Clone, Deserialize)]
struct AppConfig {
    upload_dir: PathBuf,
}

#[derive(Debug, Serialize, Deserialize)]
struct FileData {
    filename: String,
    file_type: String,
    text: String,
}

type AllowedContentTypes = &'static [&'static str];
const ALLOWED_TYPES: AllowedContentTypes = &["text/plain", "application/pdf"];

async fn extract_text_from_pdf(pdf_bytes: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
    let doc = lopdf::Document::load_from(pdf_bytes)?;
    let mut text = Vec::new();

    for (_, page_ref) in doc.get_pages().iter() {
        let mut page_content = doc.get_page_content(*page_ref)?.to_owned();
        text.append(&mut page_content);
        text.push('\n' as u8);
    }

    Ok(String::from_utf8_lossy(text.trim_ascii_end()).into_owned())
}

#[rocket::post("/upload/<session_id>", data = "<file>")]
async fn upload_file(
    session_id: String,
    file: TempFile<'_>,
    config: &State<AppConfig>,
) -> Result<Json<FileData>, Custom<String>> {
    let mime_type = match file.content_type() {
        Some(mime) => mime.0.to_string(),
        None => return Err(Custom(Status::BadRequest, "Missing MIME type".into())),
    };

    if !ALLOWED_TYPES.contains(&mime_type.as_str()) {
        return Err(Custom(
            Status::BadRequest,
            format!("Only TXT and PDF files are supported (got {})", mime_type),
        ));
    }

    let mut content = Vec::new();
    file.open()
        .await
        .unwrap()
        .read_to_end(&mut content)
        .await
        .map_err(|e| Custom(Status::InternalServerError, format!("Read error: {}", e)))?;

    let text = if mime_type == "text/plain" {
        String::from_utf8_lossy(&content).to_string()
    } else {
        extract_text_from_pdf(&content).await.map_err(|e| {
            Custom(
                Status::InternalServerError,
                format!("PDF extraction error: {}", e),
            )
        })?
    };

    let filename = file
        .name()
        .map_or_else(|| "unknown".to_string(), |n| n.to_string());
    let file_data = FileData {
        filename,
        file_type: mime_type.into(),
        text,
    };

    let re = Regex::new(r#"[/\\?%*:|"<>[\x7F\x00-\x1F]]"#).unwrap();
    let clean_session_id = re.replace_all(&session_id, "-").into_owned();
    let upload_dir = config.upload_dir.join(&clean_session_id);
    if upload_dir.exists() {
        println!("Upload dir already exists – removing it");
        fs::remove_dir_all(&upload_dir)
            .map_err(|e| Custom(Status::InternalServerError, format!("Remove error: {}", e)))?;
    }
    async_fs::create_dir_all(&upload_dir).await.map_err(|e| {
        Custom(
            Status::InternalServerError,
            format!("Create dir error: {}", e),
        )
    })?;

    let doc_path = upload_dir.join("document");
    async_fs::write(&doc_path, &content).await.map_err(|e| {
        Custom(
            Status::InternalServerError,
            format!("Write document error: {}", e),
        )
    })?;

    let meta_json = serde_json::to_string_pretty(&file_data).unwrap();
    let meta_path = upload_dir.join("transcript.json");
    async_fs::write(meta_path, &meta_json).await.map_err(|e| {
        Custom(
            Status::InternalServerError,
            format!("Write json error: {}", e),
        )
    })?;

    Ok(Json(file_data))
}

#[rocket::launch]
fn rocket() -> _ {
    let rocket = rocket::build();
    let config: AppConfig = rocket.figment().extract().expect("Config should load");

    fs::create_dir_all(&config.upload_dir).unwrap_or_else(|e| {
        panic!(
            "Could not create uploads dir {:?}: {}",
            &config.upload_dir, e
        );
    });

    rocket.manage(config).mount("/", routes![upload_file])
}
