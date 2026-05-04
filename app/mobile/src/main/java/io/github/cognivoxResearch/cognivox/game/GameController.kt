package io.github.cognivoxResearch.cognivox.game

import android.app.Activity
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.LifecycleCoroutineScope
import io.github.cognivoxResearch.cognivox.net.dto.FeatureInput
import io.github.cognivoxResearch.cognivox.net.proto.AudioFormat
import io.github.cognivoxResearch.cognivox.net.proto.GameFeatures
import io.github.cognivoxResearch.cognivox.net.proto.GameSettings
import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerOutbound
import io.github.cognivoxResearch.cognivox.net.proto.StressResponse
import io.github.cognivoxResearch.cognivox.net.ws.GameWebSocket
import io.github.cognivoxResearch.cognivox.screen.game.GameScreen
import io.github.cognivoxResearch.cognivox.screen.game.GameState
import io.github.cognivoxResearch.cognivox.service.HRVReceiverService
import io.github.cognivoxResearch.cognivox.util.TextToSpeechManager
import kotlinx.coroutines.launch
import okhttp3.Response
import org.godotengine.godot.Godot
import org.godotengine.godot.plugin.GodotPlugin
import java.util.Optional


class GameController(
    godot: Godot,
    private val sessionId: String,
    private val scope: LifecycleCoroutineScope,
    private val overlayState: MutableState<GameState>,
    private val websocket: GameWebSocket?,
    private val tts: TextToSpeechManager?,
    private val onStop: () -> Unit,
) :
    GodotPlugin(godot) {
    val tag: String = this::class.java.simpleName
    lateinit var settings: GameSettings
    var recorder: AudioRecorder? = null

    var canSendHRV = false

    init {
        Instance = this
    }


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

    internal fun onSessionInit(settings: GameSettings, noVR: Boolean = false) {
        if (overlayState.value is GameState.Loading)
            overlayState.value =
                (overlayState.value as GameState.Loading).copy(
                    serverReady = true,
                    noVr = noVR,
                    gameSettings = Optional.of(settings)
                )

        gameStart()
    }

    fun gameStart() {
        if (overlayState.value !is GameState.Loading)
            return

        val loading = overlayState.value as GameState.Loading
        if (!loading.godotLoaded || !loading.serverReady || !loading.connected || loading.gameSettings.isEmpty)
            return

        val settings = loading.gameSettings.get()

        emitSignal(
            GameSignals.INIT_SCENE,
            sessionId,
            settings.scene.getIdent(),
            settings.size.toString(),
            settings.difficulty.ordinal.toString(),
            settings.distractions.toString(),
            loading.noVr.toString()
        )

        this.settings = settings

        websocket?.send(
            ServerOutbound.Ready(
                data = GameFeatures(true, AudioFormat.PCMF32)
            )
        )

        context.startService(android.content.Intent(context, HRVReceiverService::class.java))

        overlayState.value = GameState.WaitingSpeech { onSpeechStart() }
    }

    internal fun onSpeechStart() {
        overlayState.value = GameState.Speech { onSpeechEnd() }
        websocket?.send(ServerOutbound.SpeechStart)
        recorder = AudioRecorder { websocket?.send(ServerOutbound.Audio(it.array())) }
        recorder!!.startRecording()
        canSendHRV = true
    }

    internal fun onSpeechEnd() {
        canSendHRV = false

        scope.launch {
            recorder?.stopRecording()
            overlayState.value = GameState.QuestionWait
            websocket?.send(ServerOutbound.SpeechEnd)
        }
    }

    internal fun onQuestionStart(question: String) {
        overlayState.value = GameState.Question { onQuestionEnd() }

        emitSignal(GameSignals.DISABLE_DISTRACTIONS)

        scope.launch {
            tts?.speakText(question)

            websocket?.send(ServerOutbound.QuestionStart)
            recorder = AudioRecorder { websocket?.send(ServerOutbound.Audio(it.array())) }
            recorder!!.startRecording()
            canSendHRV = true
        }
    }

    internal fun onQuestionEnd() {
        canSendHRV = false

        scope.launch {
            recorder?.stopRecording()
            overlayState.value = GameState.QuestionWait
            websocket?.send(ServerOutbound.QuestionEnd)
        }
    }

    internal fun displayStress(suggestion: StressResponse) {
        if (suggestion.stressScore > 0.45) {
            val text = suggestion.suggestion
            val level = text.substringBefore(".").split(":")[1]
            val message = text.substringAfter(".").trim()
            emitSignal(
                GameSignals.STRESS_SUGGESTION.name,
                level,
                message
            )
        }
    }

    internal fun displayStuck(suggestion: String?) {
        if (suggestion != null) {
            emitSignal(GameSignals.STUCK_SUGGESTION, suggestion)
        }
    }

    internal fun hideStuck() {
        emitSignal(GameSignals.SPEECH_UNSTUCK)
    }

    internal fun onSessionEnd() {
        overlayState.value = GameState.SessionEnd { this.onStop() }
    }

    fun onHRVReceived(input: FeatureInput) {
        if (canSendHRV) {
            this.websocket?.send(ServerOutbound.Stress(input))
        }
    }

    fun onDoubleWatchTap() {
        when (val state = this.overlayState.value) {
            is GameState.Question -> {
                state.onEnd()
            }

            is GameState.SessionEnd -> {
                state.onEnd()
            }

            is GameState.Speech -> {
                state.onEnd()
            }

            is GameState.WaitingSpeech -> {
                state.onStart()
            }

            else -> Log.i(tag, "Ignored watch double tap")
        }
    }

    internal val listener = object : GameWebSocket.Listener {
        override fun onMessage(message: ServerInbound) {
            when (message) {
                ServerInbound.End -> onSessionEnd()
                is ServerInbound.Init -> onSessionInit(message.data)
                is ServerInbound.Question -> onQuestionStart(message.data)
                is ServerInbound.Stress -> displayStress(message.data)
                ServerInbound.Stuck -> displayStuck(null)
                is ServerInbound.StuckSuggestion -> displayStuck(message.data)
                ServerInbound.Unstuck -> hideStuck()
                is ServerInbound.Error -> {
                    activity!!.runOnUiThread {
                        Toast.makeText(context, message.data, Toast.LENGTH_LONG).show()
                        onStop()
                    }
                }

                ServerInbound.AnswerEnd -> {
                    if (overlayState.value is GameState.Question)
                        onQuestionEnd()
                }
            }
        }

        override fun onConnect() {
            if (overlayState.value is GameState.Loading)
                overlayState.value =
                    (overlayState.value as GameState.Loading).copy(connected = true)
            gameStart()
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
            websocket?.disconnect()
            onStop()
        }
    }

    companion object {
        var Instance: GameController? = null


    }

}
