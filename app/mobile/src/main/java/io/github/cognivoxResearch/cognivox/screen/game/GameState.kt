package io.github.cognivoxResearch.cognivox.screen.game

sealed class GameState {
    data class Loading(val godotLoaded: Boolean) : GameState() {
        fun is_ready() = godotLoaded
        fun loading_message(): String {
            return if (!godotLoaded) {
                "Starting Game Engine"
            } else {
                "Loading"
            }
        }
    }

}