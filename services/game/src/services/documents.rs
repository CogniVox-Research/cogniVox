use common::file_store::Store;

use crate::error::{Error, Result};

pub async fn fetch_document(
    store: &Store,
    session_id: uuid::Uuid,
    document_id: &str,
) -> Result<String> {
    let expected_id = format!("{session_id}/documents/content");

    if document_id != expected_id {
        // currently used by the test-ui
        if document_id == "placeholder-micromachines" {
            return Ok(include_str!("../../assets/placeholder-micromachines").to_owned());
        }

        return Err(Error::InvalidDocument(document_id.to_owned()));
    }

    store.read_str(&expected_id).await.map_err(Error::Store)
}
