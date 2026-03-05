package io.github.cognivoxResearch.cognivox.screen.game

sealed class GameState {
    data class Loading(
        val godotLoaded: Boolean = false,
        val serverReady: Boolean = false,
        val connected: Boolean = false
    ) :
        GameState() {
        fun loadingMessage(): String {
            return if (!godotLoaded) {
                "Starting Game Engine"
            } else if (!connected) {
                "Connecting to server"
            } else if (!serverReady) {
                "Waiting For Server"
            } else {
                "Loading"
            }
        }
    }

    data class WaitingSpeech(val onStart: () -> Unit) : GameState()
    data class Speech(val onEnd: () -> Unit) : GameState()

    object QuestionWait : GameState()

    data class Question(val onEnd: () -> Unit) : GameState()

    data class SessionEnd(val onEnd: () -> Unit) : GameState()
}