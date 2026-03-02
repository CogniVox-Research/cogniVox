package io.github.cognivoxResearch.cognivox

import android.os.Bundle
import android.provider.Settings
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import io.github.cognivoxResearch.cognivox.net.proto.DeviceInbound
import io.github.cognivoxResearch.cognivox.net.screen.home.HomeScreen
import io.github.cognivoxResearch.cognivox.net.screen.home.HomeState
import io.github.cognivoxResearch.cognivox.net.ws.DeviceWs
import kotlinx.coroutines.runBlocking

class MainActivity : ComponentActivity(), DeviceWs.Listener {
    lateinit var websocket: DeviceWs
    var host = DEVICE_URL;
    var uiState: MutableState<HomeState> = mutableStateOf(HomeState.Connecting(host, ""))

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val name = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME)

        websocket = DeviceWs(DEVICE_URL, name, "INVALID", this)
        runBlocking {
            websocket.connect()
        }

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WaitScreen(uiState)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        websocket.disconnect()
    }

    override fun onJoinRequest(join: DeviceInbound.Join) {
        Log.i("Main", "Join request $join")
    }

    override fun onConnect(con: DeviceInbound.Ok) {
        Log.i("Main", "Connected to server $con")
        uiState.value = HomeState.Waiting(con.userName, con.deviceId);
    }

    override fun onError(err: DeviceInbound.Err) {
        uiState.value = HomeState.Connecting(host, "Error: $err")
        Log.i("Main", "Error $err")
    }

    override fun onDisconnect() {
        uiState.value = HomeState.Connecting(host, "")
        Log.i("Main", "Disconnected")
    }
}

@Composable
fun WaitScreen(uiState: MutableState<HomeState>) {
    var state by uiState;
    HomeScreen(state) { }
}
