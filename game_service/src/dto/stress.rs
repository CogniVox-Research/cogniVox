use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
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
}

#[derive(Debug, Serialize)]
pub struct StressResponse {
    model_used: String,
    label: i64,
    stress_score: f64,
    suggestion: String,
}
