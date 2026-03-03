use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseResponse {
    pub file_type: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileToken {
    pub document_id: uuid::Uuid,
    pub original_path: String,
    pub content_path: String,
}
