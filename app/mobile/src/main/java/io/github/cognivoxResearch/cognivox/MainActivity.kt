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
import androidx.compose.ui.Modifier
import androidx.core.content.edit
import androidx.lifecycle.lifecycleScope
import io.github.cognivoxResearch.cognivox.game.GameActivity
import io.github.cognivoxResearch.cognivox.net.api.AuthApi
import io.github.cognivoxResearch.cognivox.net.dto.LoginRequest
import io.github.cognivoxResearch.cognivox.net.isTokenExpired
import io.github.cognivoxResearch.cognivox.net.proto.DeviceInbound
import io.github.cognivoxResearch.cognivox.net.ws.DeviceWebSocket
import io.github.cognivoxResearch.cognivox.screen.AppState
import io.github.cognivoxResearch.cognivox.screen.home.HomeScreen
import io.github.cognivoxResearch.cognivox.screen.login.LoginScreen
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.UUID


class MainActivity : ComponentActivity(), DeviceWebSocket.Listener {
    lateinit var hostname: String
    lateinit var appState: MutableState<AppState>
    var websocket: DeviceWebSocket? = null
    lateinit var deviceName: String
    lateinit var auth: String

    val tag: String = this.javaClass.simpleName

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            runOnUiThread {
                Toast.makeText(baseContext, "Permissions not granted", Toast.LENGTH_LONG).show()
            }
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)

        // Restore saved credentials — show login screen if not present
        val savedName = prefs.getString("user_name", null)
        val savedToken = prefs.getString("auth_token", null)
        auth = savedToken ?: "INVALID"

        hostname = prefs.getString("host", API_HOST)!!
        deviceName = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME)!!

        // Start in authenticated state if credentials are saved and not expired
        val initialState: AppState = if (savedName != null && !isTokenExpired(savedToken)) {
            AppState.Connecting(hostname, "")
        } else {
            AppState.Login(hostname)
        }

        appState = mutableStateOf(initialState)

        // Request audio recording permission specifically
        requestPermissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)


        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppRoot(
                        appState = appState,
                        onLogin = { email, token -> performLogin(email, token) },
                        onChangeHost = { this.changeHost(it) },
                        onJoinSession = { this.joinSession(it) },
                        onJoinTest = { this.joinSession(null) }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()

        // Only connect if already authenticated
        if (appState.value !is AppState.Login) {
            connect()
        }
    }

    override fun onStop() {
        super.onStop()
        websocket?.disconnect()
    }

    override fun onStart() {
        super.onStart()
        websocket?.reconnect()
    }


    override fun onJoinRequest(join: DeviceInbound.Join) {
        Log.i(tag, "Join request $join")
        joinSession(join.sessionId)
    }

    override fun onConnect(con: DeviceInbound.Ok) {
        Log.i(tag, "Connected to server $con")
        appState.value = AppState.Waiting(con.userName, con.deviceId);
    }

    override fun onError(err: DeviceInbound.Err) {
        appState.value = AppState.Connecting(hostname, "Error: $err")
        Log.i(tag, "Error $err")
    }

    override fun onDisconnect() {
        appState.value = AppState.Connecting(hostname, "")
        Log.i(tag, "Disconnected")
    }

    /**
     * Connects to the device websocket (for receiving session start notifications)
     */
    private fun connect() {
        // Only connect if already authenticated
        if (appState.value !is AppState.Login) {
            websocket =
                DeviceWebSocket(lifecycleScope, getDeviceURL(hostname), deviceName, auth, this)
            websocket!!.connect()
        }
    }

    /**
     * Sets the ip address for the server
     */
    private fun changeHost(host: String) {
        val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
        prefs.edit { putString("host", host) }

        hostname = host
        websocket?.disconnect()

        // If we are at the login screen, stay there but update the hostname. Otherwise, reconnect.
        if (appState.value is AppState.Login) {
            appState.value = AppState.Login(hostname)
        } else {
            appState.value = AppState.Connecting(hostname, "")
            connect()
        }
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

    private fun performLogin(email: String, expectedToken: String) {
        appState.value = AppState.Login(hostname, isLoading = true)
        lifecycleScope.launch {
            try {
                val retrofit = Retrofit.Builder()
                    .baseUrl(getAuthBaseURL(hostname))
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                val api = retrofit.create(AuthApi::class.java)
                val response = api.login(LoginRequest(email, expectedToken))

                if (response.isSuccessful && response.body() != null) {
                    val actualToken = response.body()!!.access_token

                    // Save to SharedPreferences
                    val prefs = getSharedPreferences(PREF_TAG, MODE_PRIVATE)
                    prefs.edit {
                        putString("user_name", email)
                        putString("auth_token", actualToken)
                    }

                    auth = actualToken
                    appState.value = AppState.Connecting(hostname, "")

                    // Connect the websocket now that we have a real token!
                    connect()
                } else {
                    appState.value = AppState.Login(hostname)
                    runOnUiThread {
                        Toast.makeText(
                            this@MainActivity,
                            "Login failed: ${response.code()}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                appState.value = AppState.Login(hostname)
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Network error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
}

@Composable
fun AppRoot(
    appState: MutableState<AppState>,
    onLogin: (String, String) -> Unit,
    onChangeHost: (String) -> Unit,
    onJoinSession: (UUID) -> Unit,
    onJoinTest: () -> Unit,
) {
    val state by appState

    when (state) {
        is AppState.Login -> {
            LoginScreen(state as AppState.Login, onLogin = onLogin, onChangeHost = onChangeHost)
        }

        else -> {
            HomeScreen(state, onChangeHost, onJoinSession, onJoinTest)
        }
    }
}
