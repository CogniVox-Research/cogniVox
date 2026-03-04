package io.github.cognivoxResearch.cognivox.game

import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ComposeView
import androidx.fragment.app.Fragment
import io.github.cognivoxResearch.cognivox.API_HOST
import io.github.cognivoxResearch.cognivox.MainActivity
import io.github.cognivoxResearch.cognivox.PREF_TAG
import io.github.cognivoxResearch.cognivox.R
import io.github.cognivoxResearch.cognivox.net.ws.GameWebSocket
import io.github.cognivoxResearch.cognivox.screen.game.GameScreen
import io.github.cognivoxResearch.cognivox.screen.game.GameState
import kotlinx.coroutines.runBlocking
import org.godotengine.godot.Godot
import org.godotengine.godot.GodotFragment
import org.godotengine.godot.GodotHost
import org.godotengine.godot.plugin.GodotPlugin


class GameActivity : AppCompatActivity(), GodotHost {
    private var godotFragment: GodotFragment? = null
    internal var gameController: GameController? = null
    lateinit var uiState: MutableState<GameState>

    lateinit var websocket: GameWebSocket
    lateinit var sessionId: String

    var hasStopped: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;

        sessionId = intent.getStringExtra("session")!!
        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        val hostname = prefs.getString("host", API_HOST)!!
        websocket = GameWebSocket(hostname, sessionId)

        setContentView(R.layout.game_layout)

        uiState = mutableStateOf(GameState.Loading(false))

        godotFragment = GodotFragment()


        supportFragmentManager.beginTransaction()
            .replace(R.id.godot_fragment_container, godotFragment!!)
            .commitNowAllowingStateLoss()
        supportFragmentManager.beginTransaction().replace(R.id.godot_loader, GameOverlay())
            .commitNowAllowingStateLoss()

        initController(godot!!)



        runBlocking {
            websocket.connect()
        }
    }

    override fun onResume() {
        super.onResume()
        supportActionBar?.hide()

        godot?.enableImmersiveMode(true)
        godot?.enableEdgeToEdge(true)
    }

    override fun onDestroy() {
        super.onDestroy()
        stop()
    }

    override fun getActivity() = this
    override fun getGodot() = godotFragment?.godot

    override fun onGodotMainLoopStarted() {
        super.onGodotMainLoopStarted()
        Log.i("GameActivity", "Game Main Loop Started")

        if (uiState.value is GameState.Loading)
            uiState.value = (uiState.value as GameState.Loading).copy(godotLoaded = true)

    }

    override fun getHostPlugins(godot: Godot): Set<GodotPlugin> {
        initController(godot)
        return setOf(gameController!!)
    }

    private fun initController(godot: Godot) {
        if (gameController == null) {
            gameController = GameController(godot, sessionId, uiState, websocket, { stop() })
            websocket.setListener(gameController!!.listener)
        }
    }

    internal fun stop() {
        if (hasStopped) return;
        hasStopped = true;

        // TODO: send to results page instead
        val intent = Intent(applicationContext, MainActivity::class.java)

        // Fully restart the entire app because godot cannot be restarted.
        // https://github.com/godotengine/godot-proposals/issues/8151
        val mainIntent = Intent.makeRestartActivityTask(intent.component)
        mainIntent.putExtra("session_id", sessionId)
        applicationContext.startActivity(mainIntent)
        Runtime.getRuntime().exit(0)
    }
}

class GameOverlay : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val activity = requireActivity() as GameActivity;

        Log.e("GameActivity", activity.godot.toString())

        var state by activity.uiState;

        return ComposeView(requireContext()).apply {
            setContent {
                GameScreen(state, onSessionEnd = { activity.stop() })
            }
        }
    }
}

