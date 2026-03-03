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
import io.github.cognivoxResearch.cognivox.net.ws.DeviceWs
import io.github.cognivoxResearch.cognivox.screen.home.HomeScreen
import io.github.cognivoxResearch.cognivox.screen.home.HomeState
import kotlinx.coroutines.runBlocking
import java.util.UUID


class MainActivity : ComponentActivity(), DeviceWs.Listener {
    lateinit var hostname: String
    lateinit var uiState: MutableState<HomeState>
    var websocket: DeviceWs? = null
    lateinit var deviceName: String
    lateinit var auth: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        // TODO: login and auth token
        auth = "INVALID"

        hostname = prefs.getString("host", API_HOST)!!
        deviceName = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME)!!
        uiState = mutableStateOf(HomeState.Connecting(hostname, ""))

        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (!isGranted) {
                runOnUiThread {
                    Toast.makeText(baseContext, "Permissions not granted", Toast.LENGTH_LONG).show()
                }
                finish()
            }
        }

        runBlocking {
            connect()
        }

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WaitScreen(uiState, { this.changeHost(it) }, { this.joinSession(it) })
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
        Log.i("Main", "Join request $join")
    }

    override fun onConnect(con: DeviceInbound.Ok) {
        Log.i("Main", "Connected to server $con")
        uiState.value = HomeState.Waiting(con.userName, con.deviceId);
    }

    override fun onError(err: DeviceInbound.Err) {
        uiState.value = HomeState.Connecting(hostname, "Error: $err")
        Log.i("Main", "Error $err")
    }

    override fun onDisconnect() {
        uiState.value = HomeState.Connecting(hostname, "")
        Log.i("Main", "Disconnected")
    }

    suspend fun connect() {
        websocket = DeviceWs("ws://$hostname/$DEVICE_URL", deviceName, "INVALID", this)
        websocket!!.connect()
    }

    fun changeHost(host: String) {
        hostname = host
        websocket?.disconnect()

        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)

        prefs.edit { putString("host", host) }

        uiState.value = HomeState.Connecting(hostname, "")

        runBlocking { connect() }
    }

    fun joinSession(sessionId: UUID) {
        val startIntent = Intent(this, GameActivity::class.java)
        startIntent.putExtra("session", sessionId.toString())
        startActivity(startIntent)
    }
}

@Composable
fun WaitScreen(
    uiState: MutableState<HomeState>,
    changeHost: (String) -> Unit,
    joinSession: (UUID) -> Unit
) {
    var state by uiState;
    HomeScreen(state, changeHost, joinSession)
}
