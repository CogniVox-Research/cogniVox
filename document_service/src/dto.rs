use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub filename: String,
    pub file_type: String,
    pub text: String,
}
