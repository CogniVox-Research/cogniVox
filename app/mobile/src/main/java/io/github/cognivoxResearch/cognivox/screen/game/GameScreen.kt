package io.github.cognivoxResearch.cognivox.screen.game

import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import io.github.cognivoxResearch.cognivox.screen.game.pages.ContinueTap
import io.github.cognivoxResearch.cognivox.screen.game.pages.Loading
import io.github.cognivoxResearch.cognivox.screen.game.pages.Speech

@Composable
fun GameScreen(state: GameState) {
    when (state) {
        is GameState.Loading -> Loading(state)
        is GameState.WaitingSpeech -> ContinueTap(state.onStart)
        is GameState.Speech -> Speech(state.onEnd)
        GameState.SpeechEnd -> Surface() {}
    }
}