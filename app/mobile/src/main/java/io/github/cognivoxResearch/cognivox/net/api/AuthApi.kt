package io.github.cognivoxResearch.cognivox.net.api

import io.github.cognivoxResearch.cognivox.net.dto.LoginRequest
import io.github.cognivoxResearch.cognivox.net.dto.TokenResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("login")
    suspend fun login(@Body body: LoginRequest): Response<TokenResponse>
}
