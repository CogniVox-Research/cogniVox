use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    #[serde(rename = "type")]
    pub scene_type: Type,
    #[serde(flatten)]
    pub scene: SceneType,
    pub document_id: String,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameSettings {
    pub session_type: Type,
    #[serde(flatten)]
    pub scene: SceneType,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum Type {
    Speech,
    Interview,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(tag = "scene", rename_all = "snake_case")]
pub enum SceneType {
    Interview,
    BoardRoom { size: i64 },
    Stage { size: i64 },
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum AudienceDifficulty {
    Easy,
    Medium,
    Hard,
}

impl Into<GameSettings> for &Settings {
    fn into(self) -> GameSettings {
        GameSettings {
            session_type: self.scene_type,
            scene: self.scene,
            distractions: self.distractions,
            difficulty: self.difficulty,
            qa: self.qa,
        }
    }
}
