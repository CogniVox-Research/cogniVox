use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    #[serde(flatten)]
    pub scene: SceneType,
    pub document_id: String,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameSettings {
    #[serde(flatten)]
    pub scene: SceneType,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "scene")]
pub enum SceneType {
    Interview,
    BoardRoom { size: i64 },
    Stage { size: i64 },
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AudienceDifficulty {
    Easy,
    Medium,
    Hard,
}
