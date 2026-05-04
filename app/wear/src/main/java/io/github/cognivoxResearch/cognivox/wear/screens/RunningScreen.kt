package io.github.cognivoxResearch.cognivox.wear.screens

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import io.github.cognivoxResearch.cognivox.wear.HRVService
import io.github.cognivoxResearch.cognivox.wear.WearDataRepository
import kotlinx.coroutines.delay

@Composable
fun RunningScreen(onDoubleTap: () -> Unit) {
    val context = LocalContext.current
    val interactionSource = remember { MutableInteractionSource() }
    var tapID by remember { mutableIntStateOf(0) }

    val heartRate by WearDataRepository.heartRate.collectAsState()
    val isServiceRunning by WearDataRepository.serviceRunning.collectAsState()


    LaunchedEffect("showToast", tapID) {
        if (tapID != 0) {
            delay(500)
            Toast.makeText(context, "Tap again", Toast.LENGTH_SHORT).show()
        }
    }


    Column(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(interactionSource) {
                detectTapGestures(
                    onPress = {
                        tapID += 1
                    },
                    onDoubleTap = {
                        tapID = 0
                        if (isServiceRunning) {
                            onDoubleTap()
                        }
                    },
                )
            },
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        if (isServiceRunning) {
            Text(text = "Heart Rate", fontSize = 12.sp, color = MaterialTheme.colors.secondary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "$heartRate",
                fontSize = 40.sp,
                color = MaterialTheme.colors.primary
            )
            Text(text = "bpm", fontSize = 14.sp)
        } else {
            Text(text = "Start Speech", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "🎤", fontSize = 32.sp) // Using emoji as a lightweight icon alternative
            Spacer(modifier = Modifier.height(8.dp))

            Button(onClick = {
                Toast.makeText(context, "Starting Service...", Toast.LENGTH_SHORT).show()
                context.startForegroundService(Intent(context, HRVService::class.java))
            }) {
                Text("Start")
            }
        }
    }
}