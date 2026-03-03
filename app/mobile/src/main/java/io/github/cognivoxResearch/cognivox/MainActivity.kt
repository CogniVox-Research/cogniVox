package io.github.cognivoxResearch.cognivox

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.edit
import io.github.cognivoxResearch.cognivox.game.GameActivity
import io.github.cognivoxResearch.cognivox.net.proto.DeviceInbound
import io.github.cognivoxResearch.cognivox.net.ws.DeviceWebSocket
import io.github.cognivoxResearch.cognivox.screen.home.HomeScreen
import io.github.cognivoxResearch.cognivox.screen.home.HomeState
import kotlinx.coroutines.runBlocking
import java.util.UUID


class MainActivity : ComponentActivity(), DeviceWebSocket.Listener {
    lateinit var hostname: String
    lateinit var uiState: MutableState<HomeState>
    var websocket: DeviceWebSocket? = null
    lateinit var deviceName: String
    lateinit var auth: String

    val tag: String = this.javaClass.simpleName

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        // TODO: login and auth token
        auth = "INVALID"

        hostname = prefs.getString("host", API_HOST)!!
        deviceName = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME)!!
        uiState = mutableStateOf(HomeState.Connecting(hostname, ""))

        // request perms for microphone, wearables
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (!isGranted) {
                runOnUiThread {
                    Toast.makeText(baseContext, "Permissions not granted", Toast.LENGTH_LONG).show()
                }
                finish()
            }
        }

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WaitScreen(
                        uiState,
                        { this.changeHost(it) },
                        { this.joinSession(it) },
                        { this.joinSession(null) })
                }
            }
        }
    }

    override fun onStop() {
        super.onStop()
        websocket?.disconnect()
    }

    override fun onStart() {
        super.onStart()
        runBlocking {
            websocket?.reconnect()
        }
    }


    override fun onJoinRequest(join: DeviceInbound.Join) {
        Log.i(tag, "Join request $join")
        joinSession(join.sessionId)
    }

    override fun onConnect(con: DeviceInbound.Ok) {
        Log.i(tag, "Connected to server $con")
        uiState.value = HomeState.Waiting(con.userName, con.deviceId);
    }

    override fun onError(err: DeviceInbound.Err) {
        uiState.value = HomeState.Connecting(hostname, "Error: $err")
        Log.i(tag, "Error $err")
    }

    override fun onDisconnect() {
        uiState.value = HomeState.Connecting(hostname, "")
        Log.i(tag, "Disconnected")
    }

    /**
     * Connects to the device websocket (for receiving session start notifications)
     */
    private suspend fun connect() {
        websocket = DeviceWebSocket(getDeviceURL(hostname), deviceName, "INVALID", this)
        websocket!!.connect()
    }

    /**
     * Sets the ip address for the server
     */
    private fun changeHost(host: String) {
        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        prefs.edit { putString("host", host) }

        hostname = host
        websocket?.disconnect()
        uiState.value = HomeState.Connecting(hostname, "")

        runBlocking { connect() }
    }

    /**
     * Starts a new GameActivity for the session id.
     */
    private fun joinSession(sessionId: UUID?) {
        val startIntent = Intent(this, GameActivity::class.java)
        if (sessionId == null) {
            startIntent.putExtra("session", "test")
        } else {
            startIntent.putExtra("session", sessionId.toString())
        }
        startActivity(startIntent)
    }
}

@Composable
fun WaitScreen(
    uiState: MutableState<HomeState>,
    changeHost: (String) -> Unit,
    joinSession: (UUID) -> Unit,
    joinTest: () -> Unit,
) {
    var state by uiState;
    HomeScreen(state, changeHost, joinSession, joinTest)
}
