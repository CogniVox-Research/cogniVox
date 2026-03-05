package io.github.cognivoxResearch.cognivox.game

import android.app.Activity
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import io.github.cognivoxResearch.cognivox.net.proto.AudioFormat
import io.github.cognivoxResearch.cognivox.net.proto.GameFeatures
import io.github.cognivoxResearch.cognivox.net.proto.GameSettings
import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerOutbound
import io.github.cognivoxResearch.cognivox.net.ws.GameWebSocket
import io.github.cognivoxResearch.cognivox.screen.game.GameScreen
import io.github.cognivoxResearch.cognivox.screen.game.GameState
import kotlinx.coroutines.runBlocking
import okhttp3.Response
import org.godotengine.godot.Godot
import org.godotengine.godot.plugin.GodotPlugin


class GameController(
    godot: Godot,
    private val sessionId: String,
    private val overlayState: MutableState<GameState>,
    private val websocket: GameWebSocket,
    private val onStop: () -> Unit,
) :
    GodotPlugin(godot) {
    val tag: String = this::class.java.simpleName
    lateinit var settings: GameSettings
    var recorder: AudioRecorder? = null


    override fun getPluginName() = "GameController"

    override fun getPluginSignals() = GameSignals.ALL_SIGNALS

    override fun onMainCreate(activity: Activity?): View {
        return ComposeView(context).apply {
            setContent {
                val state by overlayState;
                GameScreen(state)
            }
        }
    }

    private fun onSessionInit(settings: GameSettings) {
        if (overlayState.value is GameState.Loading)
            overlayState.value =
                (overlayState.value as GameState.Loading).copy(serverReady = true)

        Log.i(
            tag,
            "${sessionId.javaClass} ${settings.scene.getIdent().javaClass} ${settings.size.javaClass} ${settings.difficulty.ordinal.javaClass}  ${settings.distractions.javaClass}"
        )


        emitSignal(
            GameSignals.INIT_SCENE,
            sessionId,
            settings.scene.getIdent(),
            settings.size.toString(),
            settings.difficulty.ordinal.toString(),
            settings.distractions.toString()
        )

        this.settings = settings

        websocket.send(
            ServerOutbound.Ready(
                data = GameFeatures(true, AudioFormat.PCMF32)
            )
        )

        overlayState.value = GameState.WaitingSpeech { onSpeechStart() }
    }

    private fun onSpeechStart() {
        overlayState.value = GameState.Speech { onSpeechEnd() }
        websocket.send(ServerOutbound.SpeechStart)
        emitSignal(GameSignals.SCENE_START)
        recorder = AudioRecorder { websocket.send(ServerOutbound.Audio(it.array())) }
        recorder!!.startRecording()

        // TODO: start HRV recording
    }

    private fun onSpeechEnd() {
        overlayState.value = GameState.QuestionWait
        websocket.send(ServerOutbound.SpeechEnd)

        runBlocking {
            recorder?.stopRecording()
        }

        // TODO: stop audio+HRV recording
    }

    private fun onQuestionStart(question: String) {
        overlayState.value = GameState.Question { onQuestionEnd() }
        websocket.send(ServerOutbound.QuestionStart)
        // TODO: play question
        // TODO: start audio+HRV recording
    }

    private fun onQuestionEnd() {
        overlayState.value = GameState.QuestionWait
        websocket.send(ServerOutbound.QuestionEnd)

        // TODO: stop audio+HRV recording
    }

    private fun displayStress(suggestion: String) {
        emitSignal(GameSignals.STRESS_SUGGESTION.name, suggestion)
    }

    private fun displayStuck(suggestion: String?) {
        if (suggestion == null) {
            emitSignal(GameSignals.SPEECH_STUCK)
        } else {
            emitSignal(GameSignals.STRESS_SUGGESTION, suggestion)
        }
    }

    private fun hideStuck() {
        emitSignal(GameSignals.SPEECH_UNSTUCK)
    }

    private fun onSessionEnd() {
        overlayState.value = GameState.SessionEnd { this.onStop() }
    }

    internal val listener = object : GameWebSocket.Listener {
        override fun onMessage(message: ServerInbound) {
            when (message) {
                ServerInbound.End -> onSessionEnd()
                is ServerInbound.Init -> onSessionInit(message.data)
                is ServerInbound.Question -> onQuestionStart(message.data)
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
