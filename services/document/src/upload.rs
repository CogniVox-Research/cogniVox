use common::file_store::Store;
use rocket::fs::TempFile;

use crate::dto;

pub async fn upload_to_store(
    store: &Store,
    original: &TempFile<'_>,
    content: &dto::FileToken,
    text: String,
) -> Result<(), Box<dyn std::error::Error>> {
    store
        .upload_from_reader(
            &content.original_path,
            original.open().await?,
            Some(original.len()),
        )
        .await?;

    store
        .upload(&content.content_path, text.into_bytes())
        .await?;

    Ok(())
}
