package io.github.cognivoxResearch.cognivox.screen.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
@Preview
fun JoinSheet(
    setSession: (UUID) -> Unit = {},
    onClose: () -> Unit = {}
) {
    val bottomSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var input by remember { mutableStateOf(UUID.randomUUID().toString()) }
    var error by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onClose,
        sheetState = bottomSheetState,
    ) {
        Column(
            modifier = Modifier
                .padding(start = 20.dp, end = 20.dp, bottom = 120.dp)
                .fillMaxWidth(),
        ) {
            Text("Join Session", fontWeight = FontWeight.Bold, fontSize = 20.sp)
            OutlinedTextField(
                value = input,
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth(),
                onValueChange = {
                    input = it
                    error = ""
                },
                label = { Text("Session ID") },
            )

            Text(
                if (error.isNotBlank()) "Error: $error" else "",
                color = Color.Red,
                style = MaterialTheme.typography.labelMedium
            )

            Row(
                horizontalArrangement = Arrangement.End,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            ) {
                Button({
                    try {
                        val uuid = UUID.fromString(input)
                        setSession(uuid)
                        onClose()
                    } catch (e: IllegalArgumentException) {
                        error = "Invalid Session Id"
                    }
                }) { Text("Change") }
            }
        }
    }
}