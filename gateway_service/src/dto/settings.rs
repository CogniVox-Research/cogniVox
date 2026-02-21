use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Settings {
    #[serde(flatten)]
    pub scene: SceneType,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}

#[derive(Debug, Serialize)]
#[serde(tag = "scene")]
pub enum SceneType {
    Interview,
    BoardRoom { size: i64 },
    Stage { size: i64 },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AudienceDifficulty {
    Easy,
    Medium,
    Hard,
}
