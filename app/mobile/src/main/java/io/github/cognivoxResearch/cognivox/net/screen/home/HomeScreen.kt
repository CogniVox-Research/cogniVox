package io.github.cognivoxResearch.cognivox.net.screen.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Preview
@Composable
fun HomeScreen(
    state: HomeState = HomeState.Waiting("Test User", UUID.randomUUID()),
    onChangeHost: (String) -> Unit = {}
) {
    var hostEditOpen by remember { mutableStateOf(false) }
    val bottomSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

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
                Text("Trying  to connect to ${state.host}")
                Text(state.state)

                Button({
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
                }
            }
        }

    }
    if (state is HomeState.Connecting && hostEditOpen) {
        ModalBottomSheet(
            onDismissRequest = { hostEditOpen = false },
            sheetState = bottomSheetState,
        ) {
            Column(
                modifier = Modifier
                    .padding(start = 20.dp, end = 20.dp, bottom = 120.dp)
                    .fillMaxWidth(),
            ) {
                Text("Change Host Name", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                OutlinedTextField(
                    value = state.host,
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth(),
                    onValueChange = {
                        onChangeHost(it)
                    },
                    label = { Text("Enter Host") },
                )
            }
        }
    }
}