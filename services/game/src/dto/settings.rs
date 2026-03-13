use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub device_name: String,
    pub auth: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    #[serde(flatten)]
    pub scene: SceneType,
    pub document_id: String,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
    pub device_id: Option<uuid::Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameSettings {
    #[serde(flatten)]
    pub scene: SceneType,
    pub distractions: bool,
    pub qa: bool,
    pub difficulty: AudienceDifficulty,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(tag = "scene", rename_all = "snake_case")]
pub enum SceneType {
    Interview,
    BoardRoom { size: i64 },
    Stage { size: i64 },
}

impl SceneType {
    pub fn is_inteview(&self) -> bool {
        matches!(self, Self::Interview)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum AudienceDifficulty {
    Easy,
    Medium,
    Hard,
}

impl From<&Settings> for GameSettings {
    fn from(val: &Settings) -> Self {
        GameSettings {
            scene: val.scene,
            distractions: val.distractions,
            difficulty: val.difficulty,
            qa: val.qa,
        }
    }
}
