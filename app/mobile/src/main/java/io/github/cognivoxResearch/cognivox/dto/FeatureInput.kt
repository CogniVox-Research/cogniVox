package io.github.cognivoxResearch.cognivox.dto

import kotlinx.serialization.Serializable

@Serializable
data class FeatureInput(
    // Common or RF specific
    val eda_mean: Double? = null,
    val eda_std: Double? = null,
    val eda_min: Double? = null,
    val eda_max: Double? = null,
    val bvp_mean: Double,
    val bvp_std: Double,
    val temp_mean: Double? = null,
    val temp_std: Double? = null,
    val acc_mag_mean: Double? = null,
    val acc_mag_std: Double? = null,

    // Lite specific
    val bvp_min: Double? = null,
    val bvp_max: Double? = null,
    val bvp_range: Double? = null,
    val bvp_energy: Double? = null,
    val acc_mean: Double? = null,
    val acc_std: Double? = null,
    val acc_max: Double? = null
)