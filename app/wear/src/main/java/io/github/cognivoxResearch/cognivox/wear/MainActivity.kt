package io.github.cognivoxResearch.cognivox.wear

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                WearApp()
            }
        }
    }
}

@Composable
fun WearApp() {
    val context = LocalContext.current
    var hasPermissions by remember { mutableStateOf(false) }
    
    val heartRate by WearDataRepository.heartRate.collectAsState()
    val isServiceRunning by WearDataRepository.serviceRunning.collectAsState()

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasPermissions = isGranted
    }

    LaunchedEffect(Unit) {
        val bodySensorsGranted = ContextCompat.checkSelfPermission(
            context, 
            Manifest.permission.BODY_SENSORS
        ) == PackageManager.PERMISSION_GRANTED
        
        if (bodySensorsGranted) {
            hasPermissions = true
        } else {
            launcher.launch(Manifest.permission.BODY_SENSORS)
        }
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (!hasPermissions) {
            Text("Permissions required", fontSize = 14.sp)
            Button(onClick = {
                launcher.launch(Manifest.permission.BODY_SENSORS)
            }) {
                Text("Grant")
            }
        } else {
            if (isServiceRunning) {
                Text(text = "Heart Rate", fontSize = 12.sp, color = MaterialTheme.colors.secondary)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "$heartRate", 
                    fontSize = 40.sp, 
                    color = MaterialTheme.colors.primary
                )
                Text(text = "bpm", fontSize = 14.sp)
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Button(onClick = {
                    Toast.makeText(context, "Stopping Service...", Toast.LENGTH_SHORT).show()
                    context.stopService(Intent(context, HRVService::class.java))
                }) {
                    Text("Stop")
                }
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
}
