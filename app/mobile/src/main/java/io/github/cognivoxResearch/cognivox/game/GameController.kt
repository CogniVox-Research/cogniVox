package io.github.cognivoxResearch.cognivox.game

import android.util.Log
import android.widget.Toast
import androidx.compose.runtime.MutableState
import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.ws.GameWs
import io.github.cognivoxResearch.cognivox.screen.game.GameState
import okhttp3.Response
import org.godotengine.godot.Godot
import org.godotengine.godot.plugin.GodotPlugin
import org.godotengine.godot.plugin.SignalInfo


class GameController(
    godot: Godot,
    private val overlayState: MutableState<GameState>,
    private val websocket: GameWs
) :
    GodotPlugin(godot),
    GameWs.Listener {
    val tag: String = this::class.java.simpleName

    companion object {
        val SHOW_GLTF_SIGNAL = SignalInfo("show_gltf", String::class.java)
    }

    override fun getPluginName() = "GameController"

    override fun getPluginSignals() = setOf(SHOW_GLTF_SIGNAL)

    internal fun showGLTF(glbFilepath: String) {
        emitSignal(SHOW_GLTF_SIGNAL.name, glbFilepath)
    }

    override fun onMessage(message: ServerInbound) {
        TODO("Not yet implemented")
    }

    override fun onConnect() {
        TODO("Not yet implemented")
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
        activity?.finish()
    }
}
