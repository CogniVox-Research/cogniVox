package io.github.cognivoxResearch.cognivox.net.dto

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class TokenResponse(
    val access_token: String,
    val token_type: String = "bearer"
)
