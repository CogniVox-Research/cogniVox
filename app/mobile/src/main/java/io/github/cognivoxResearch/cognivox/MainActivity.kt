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
import io.github.cognivoxResearch.cognivox.screen.login.LoginScreen
import io.github.cognivoxResearch.cognivox.screen.login.LoginState
import kotlinx.coroutines.runBlocking
import java.util.UUID


class MainActivity : ComponentActivity(), DeviceWebSocket.Listener {
    lateinit var hostname: String
    lateinit var uiState: MutableState<HomeState>
    lateinit var loginUiState: MutableState<LoginState>
    var websocket: DeviceWebSocket? = null
    lateinit var deviceName: String
    lateinit var auth: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)

        // Restore saved credentials — show login screen if not present
        val savedName = prefs.getString("user_name", null)
        val savedToken = prefs.getString("auth_token", null)
        auth = savedToken ?: "INVALID"

        hostname = prefs.getString("host", API_HOST)!!
        deviceName = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME)!!

        // Start in authenticated state if credentials already saved
        val initialLoginState: LoginState = if (savedName != null && savedToken != null) {
            LoginState.Authenticated(savedName, savedToken)
        } else {
            LoginState.Unauthenticated
        }

        loginUiState = mutableStateOf(initialLoginState)
        uiState = mutableStateOf(HomeState.Connecting(hostname, ""))

        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (!isGranted) {
                runOnUiThread {
                    Toast.makeText(baseContext, "Permissions not granted", Toast.LENGTH_LONG).show()
                }
                finish()
            }
        }

        // Only connect if already authenticated
        if (initialLoginState is LoginState.Authenticated) {
            runBlocking { connect() }
        }

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppRoot(
                        loginUiState = loginUiState,
                        homeUiState = uiState,
                        onLogin = { name, token -> this.handleLogin(name, token) },
                        onChangeHost = { this.changeHost(it) },
                        onJoinSession = { this.joinSession(it) },
                        onJoinTest = { this.joinSession(null) }
                    )
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
        uiState.value = HomeState.Waiting(con.userName, con.deviceId)
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
        websocket = DeviceWebSocket("ws://$hostname/$DEVICE_URL", deviceName, auth, this)
        websocket!!.connect()
    }

    fun handleLogin(name: String, token: String) {
        loginUiState.value = LoginState.Loading

        // Persist credentials
        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        prefs.edit {
            putString("user_name", name)
            putString("auth_token", token)
        }
        auth = token
        uiState.value = HomeState.Connecting(hostname, "")

        loginUiState.value = LoginState.Authenticated(name, token)

        runBlocking { connect() }
    }

    fun changeHost(host: String) {
        hostname = host
        websocket?.disconnect()

        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        prefs.edit { putString("host", host) }

        uiState.value = HomeState.Connecting(hostname, "")
        runBlocking { connect() }
    }

    fun joinSession(sessionId: UUID?) {
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
fun AppRoot(
    loginUiState: MutableState<LoginState>,
    homeUiState: MutableState<HomeState>,
    onLogin: (String, String) -> Unit,
    onChangeHost: (String) -> Unit,
    onJoinSession: (UUID) -> Unit,
    onJoinTest: () -> Unit,
) {
    val loginState by loginUiState
    val homeState by homeUiState

    when (loginState) {
        is LoginState.Unauthenticated,
        is LoginState.Loading -> {
            LoginScreen(state = loginState, onLogin = onLogin)
        }
        is LoginState.Authenticated -> {
            HomeScreen(homeState, onChangeHost, onJoinSession, onJoinTest)
        }
    }
}
