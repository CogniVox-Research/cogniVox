use rocket::{
    form::Form,
    fs::TempFile,
    http::{ContentType, Status},
    response::status::Custom,
    serde::json::Json,
    tokio::io::AsyncReadExt,
};

pub async fn extract_text(
    file: &Form<TempFile<'_>>,
) -> Result<(ContentType, String), Custom<Json<String>>> {
    let mime_type = match file.content_type() {
        Some(mime) => mime.to_owned(),
        None => return Err(Custom(Status::BadRequest, Json("Missing MIME type".into()))),
    };

    let text = match extract_content(&file, &mime_type).await {
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

    Ok((mime_type, text))
}

async fn extract_content(
    file: &TempFile<'_>,
    content_type: &ContentType,
) -> Result<Option<String>, Box<dyn std::error::Error>> {
    if content_type.is_text() {
        let mut file = file.open().await?;
        let mut content = String::new();
        file.read_to_string(&mut content).await?;
        Ok(Some(content))
    } else if content_type.is_pdf() {
        let text = extract_from_pdf(file).await?;
        Ok(Some(text))
    } else {
        Ok(None)
    }
}

async fn extract_from_pdf(file: &TempFile<'_>) -> Result<String, Box<dyn std::error::Error>> {
    let doc = if let Some(path) = file.path() {
        lopdf::Document::load(path)?
    } else {
        let mut doc_bytes = Vec::with_capacity(file.len() as usize);
        let mut file = file.open().await?;
        file.read_to_end(&mut doc_bytes).await?;
        lopdf::Document::load_from(&doc_bytes as &[u8])?
    };

    let mut text = String::new();

    for (page_no, _) in doc.get_pages().iter() {
        let page_content = doc
            .extract_text(&vec![*page_no])?
            .to_owned()
            .replace("\n", "");
        text.push_str(&page_content);
    }

    Ok(text.trim_ascii_end().to_owned())
}
