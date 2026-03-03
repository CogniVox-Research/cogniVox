package io.github.cognivoxResearch.cognivox.screen.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.screen.home.components.HostSheet
import io.github.cognivoxResearch.cognivox.screen.home.components.JoinSheet
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Preview
@Composable
fun HomeScreen(
    state: HomeState = HomeState.Waiting("Test User", UUID.randomUUID()),
    onChangeHost: (String) -> Unit = {},
    onJoinManual: (UUID) -> Unit = {},
    onJoinTest: () -> Unit = {}
) {
    var hostEditOpen by remember { mutableStateOf(false) }
    var joinManual by remember { mutableStateOf(false) }
    val hideHostEdit = { hostEditOpen = false }
    val hideJoin = { joinManual = false }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {

        // TODO: logo and styles


        when (state) {
            is HomeState.Connecting -> item {
                Text("Connecting...")
                Text(state.state)
                Spacer(Modifier.height(12.dp))

                Text("Host: $state.host", fontSize = 8.sp)
                TextButton({
                    hostEditOpen = true;
                }) {
                    Text("Change host")
                }
            }

            is HomeState.Waiting -> {
                item {
                    Text("Welcome ${state.userName}!")
                    Text("Waiting for session to start.")
                    Text("Device: ${state.deviceId}", fontSize = 8.sp)
                    TextButton({
                        joinManual = true;
                    }) {
                        Text("Join with SessionID")
                    }
                }
            }
        }

    }

    if (state is HomeState.Connecting && hostEditOpen) {
        HostSheet(state.host, onChangeHost, hideHostEdit)
    } else if (state is HomeState.Waiting && joinManual) {
        JoinSheet(onJoinManual, onJoinTest, hideJoin)
    }
}

