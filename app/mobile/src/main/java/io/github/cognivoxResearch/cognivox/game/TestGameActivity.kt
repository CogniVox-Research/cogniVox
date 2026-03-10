package io.github.cognivoxResearch.cognivox.game

import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.lifecycleScope
import io.github.cognivoxResearch.cognivox.MainActivity
import io.github.cognivoxResearch.cognivox.R
import io.github.cognivoxResearch.cognivox.net.proto.AudienceDifficulty
import io.github.cognivoxResearch.cognivox.net.proto.GameSettings
import io.github.cognivoxResearch.cognivox.net.proto.SceneType
import io.github.cognivoxResearch.cognivox.net.proto.StressResponse
import io.github.cognivoxResearch.cognivox.screen.game.GameState
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.godotengine.godot.Godot
import org.godotengine.godot.GodotFragment
import org.godotengine.godot.GodotHost
import org.godotengine.godot.plugin.GodotPlugin

class TestGameActivity : AppCompatActivity(), GodotHost {
    private var godotFragment: GodotFragment? = null
    lateinit var uiState: MutableState<GameState>
    internal var gameController: GameController? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;

        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (!isGranted) {
                runOnUiThread {
                    Toast.makeText(baseContext, "Permissions not granted", Toast.LENGTH_LONG).show()
                }
                finish()
            }
        }

        lifecycleScope.launch {
            delay(1000)
            val controller = gameController!!;

            controller.onSessionInit(
                GameSettings(
                    SceneType.Stage,
                    2,
                    false,
                    AudienceDifficulty.HARD,
                    qa = true
                ),
                noVR = true
            )

            controller.onSpeechStart()

            delay(3000)
            controller.displayStuck("Stuck suggestion test 1234")
            delay(1000)
            controller.hideStuck()
            delay(1000)

            controller.displayStress(
                StressResponse(
                    "",
                    1,
                    0.6,
                    "State: Highly Stressed. Strong markers detected. Stop what you are doing, close your eyes, and take 5 deep breaths."
                )
            )
        }

        setContentView(R.layout.game_layout)

        uiState = mutableStateOf(GameState.Loading(false))

        godotFragment = GodotFragment()
        supportFragmentManager.beginTransaction()
            .replace(R.id.godot_fragment_container, godotFragment!!)
            .commitNowAllowingStateLoss()
        initController(godot!!)
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

    override fun getHostPlugins(godot: Godot): Set<GodotPlugin> {
        initController(godot)
        return setOf(gameController!!)
    }

    private fun initController(godot: Godot) {
        if (gameController == null) {
            gameController = GameController(
                godot,
                "sessionId",
                lifecycleScope,
                uiState,
                null,
                null
            ) { stop() }
        }
    }

    internal fun stop() {

        val intent = Intent(applicationContext, MainActivity::class.java)

        // Fully restart the entire app because godot cannot be restarted.
        // https://github.com/godotengine/godot-proposals/issues/8151
        val mainIntent = Intent.makeRestartActivityTask(intent.component)
        applicationContext.startActivity(mainIntent)
        Runtime.getRuntime().exit(0)
    }

    override fun getActivity() = this
    override fun getGodot() = godotFragment?.godot
}