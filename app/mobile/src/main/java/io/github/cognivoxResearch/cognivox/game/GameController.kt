package io.github.cognivoxResearch.cognivox.game

import android.util.Log
import android.widget.Toast
import androidx.compose.runtime.MutableState
import io.github.cognivoxResearch.cognivox.net.proto.GameFeatures
import io.github.cognivoxResearch.cognivox.net.proto.GameSettings
import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerOutbound
import io.github.cognivoxResearch.cognivox.net.ws.GameWs
import io.github.cognivoxResearch.cognivox.screen.game.GameState
import okhttp3.Response
import org.godotengine.godot.Godot
import org.godotengine.godot.plugin.GodotPlugin
import org.godotengine.godot.plugin.SignalInfo


class GameController(
    godot: Godot,
    private val overlayState: MutableState<GameState>,
    private val websocket: GameWs,
    private val onStop: () -> Unit,
) :
    GodotPlugin(godot) {
    val tag: String = this::class.java.simpleName

    companion object Signals {
        val STRESS_SUGGESTION = SignalInfo("stress_suggestion", String::class.java)
        val SPEECH_STUCK = SignalInfo("speech_stuck")
        val SPEECH_UNSTUCK = SignalInfo("speech_unstuck")
        val STUCK_SUGGESTION = SignalInfo("speech_stuck_suggestion", String::class.java)

        val ALL_SIGNALS = setOf(STRESS_SUGGESTION, SPEECH_UNSTUCK, SPEECH_STUCK, STUCK_SUGGESTION)
    }

    override fun getPluginName() = "GameController"

    override fun getPluginSignals() = ALL_SIGNALS


    private fun onSessionInit(settings: GameSettings) {
        if (overlayState.value is GameState.Loading)
            overlayState.value =
                (overlayState.value as GameState.Loading).copy(serverReady = true)

        // TODO: emit start event to godot

        websocket.send(
            ServerOutbound.Ready(
                data = GameFeatures(true)
            )
        )

        overlayState.value = GameState.WaitingSpeech { onSpeechStart() }
    }

    private fun onSpeechStart() {
        overlayState.value = GameState.Speech { onSpeechEnd() }
        websocket.send(ServerOutbound.SpeechStart)
        // TODO: start audio+HRV recording
    }

    private fun onSpeechEnd() {
        overlayState.value = GameState.SpeechEnd
        websocket.send(ServerOutbound.SpeechEnd)
        // TODO: stop audio+HRV recording
    }

    private fun displayStress(suggestion: String) {
        emitSignal(STRESS_SUGGESTION.name, suggestion)
    }

    private fun displayStuck(suggestion: String?) {
        if (suggestion == null) {
            emitSignal(SPEECH_STUCK)
        } else {
            emitSignal(STRESS_SUGGESTION, suggestion)
        }
    }

    private fun hideStuck() {
        emitSignal(SPEECH_UNSTUCK)
    }

    internal val listener = object : GameWs.Listener {
        override fun onMessage(message: ServerInbound) {
            when (message) {
                ServerInbound.End -> onStop()
                is ServerInbound.Init -> onSessionInit(message.data)
                is ServerInbound.Question -> TODO()
                is ServerInbound.Stress -> displayStress(message.data.suggestion)
                ServerInbound.Stuck -> displayStuck(null)
                is ServerInbound.StuckSuggestion -> displayStuck(message.data)
                ServerInbound.Unstuck -> hideStuck()
                is ServerInbound.Error -> {
                    activity!!.runOnUiThread {
                        Toast.makeText(context, message.data, Toast.LENGTH_LONG).show()
                        onStop()
                    }
                }
            }
        }

        override fun onConnect() {
            if (overlayState.value is GameState.Loading)
                overlayState.value =
                    (overlayState.value as GameState.Loading).copy(connected = true)
        }

        override fun onDisconnect(t: Throwable, response: Response?) {
            Log.e(tag, "Unexpected disconnect", t)

            activity!!.runOnUiThread {
                Toast.makeText(
                    activity!!.applicationContext,
                    "Unexpected connection error occurred.",
                    Toast.LENGTH_LONG
                ).show()
            }
            websocket.disconnect()
            onStop()
        }
    }

}
