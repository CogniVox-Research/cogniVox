package io.github.cognivoxResearch.cognivox.screen.home

import java.util.UUID

sealed class HomeState {
    data class Connecting(val host: String, val state: String) : HomeState()
    data class Waiting(val userName: String, val deviceId: UUID) : HomeState()
}