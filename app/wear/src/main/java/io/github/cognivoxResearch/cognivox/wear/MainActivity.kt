package io.github.cognivoxResearch.cognivox.wear

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.wear.compose.material.MaterialTheme
import com.google.android.gms.wearable.Wearable
import io.github.cognivoxResearch.cognivox.wear.BiometricsTransmitter.Companion.TAG
import io.github.cognivoxResearch.cognivox.wear.screens.PermissionScreen
import io.github.cognivoxResearch.cognivox.wear.screens.RunningScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContent {
            MaterialTheme {
                WearApp { onDoubleTap() }
            }
        }
    }

    internal fun onDoubleTap() {
        Wearable.getNodeClient(this).connectedNodes.addOnSuccessListener { nodes ->
            for (node in nodes) {
                Wearable.getMessageClient(this).sendMessage(node.id, "/double_tap", null)
                    .addOnSuccessListener { Log.d(TAG, "Double tap sent successfully") }
                    .addOnFailureListener { e ->
                        Log.e(
                            TAG,
                            "Message failed to send: ${e.message}"
                        )
                    }
            }
        }
    }
}

@Composable
fun WearApp(onDoubleTap: () -> Unit) {
    var hasPermissions by remember { mutableStateOf(false) }


    if (!hasPermissions) {
        PermissionScreen {
            hasPermissions = true
        }
    } else {
        RunningScreen(onDoubleTap)
    }
}
