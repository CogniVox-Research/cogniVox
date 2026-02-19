use common::file_store::Store;
use rocket::fs::TempFile;

use crate::dto;

pub async fn upload_to_store(
    store: &Store,
    session_id: &str,
    original: &TempFile<'_>,
    content: &dto::FileContent,
) -> Result<(), Box<dyn std::error::Error>> {
    let filename = &content.file_type;
    let dir = format!("{session_id}/documents/");

    let upload_path = format!("{dir}/{filename}");
    store
        .upload_from_reader(upload_path, original.open().await?, Some(original.len()))
        .await?;

    let content_json = serde_json::to_vec(content)?;
    let upload_path = format!("{dir}/content.json");
    store.upload(upload_path, content_json).await?;

    Ok(())
}
