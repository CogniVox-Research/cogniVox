package io.github.cognivoxResearch.cognivox.screen

import java.util.UUID

sealed class AppState {
    data class Login(val host: String, val isLoading: Boolean = false) : AppState()
    data class Connecting(val host: String, val state: String) : AppState()
    data class Waiting(val userName: String, val deviceId: UUID) : AppState()
}
