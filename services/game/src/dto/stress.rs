use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct StressRequest {
    pub eda_mean: Option<f64>,
    pub eda_std: Option<f64>,
    pub eda_min: Option<f64>,
    pub eda_max: Option<f64>,
    pub bvp_mean: f64,
    pub bvp_std: f64,
    pub temp_mean: Option<f64>,
    pub temp_std: Option<f64>,
    pub acc_mag_mean: Option<f64>,
    pub acc_mag_std: Option<f64>,

    // Lite specific
    pub bvp_min: Option<f64>,
    pub bvp_max: Option<f64>,
    pub bvp_range: Option<f64>,
    pub bvp_energy: Option<f64>,
    pub acc_mean: Option<f64>,
    pub acc_std: Option<f64>,
    pub acc_max: Option<f64>,

    pub session_id: Option<uuid::Uuid>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StressResponse {
    pub model_used: String,
    pub label: i64,
    pub stress_score: f64,
    pub suggestion: String,
    pub feedback: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct OverallRequest {
    pub avg_stress: f64,
    pub max_stress: f64,
    pub high_stress_events: usize,
    pub duration_seconds: f64,

    #[serde(skip)]
    pub total_events: usize,
    #[serde(skip)]
    pub total_stress: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OverallResponse {
    pub plan: String,
}
