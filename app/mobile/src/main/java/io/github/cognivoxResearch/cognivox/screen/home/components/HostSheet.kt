package io.github.cognivoxResearch.cognivox.screen.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
@Preview
fun HostSheet(
    host: String = "localhost",
    setHost: (String) -> Unit = {},
    onClose: () -> Unit = {}
) {
    val bottomSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var input by remember { mutableStateOf(host) }

    ModalBottomSheet(
        onDismissRequest = onClose,
        sheetState = bottomSheetState,
    ) {
        Column(
            modifier = Modifier
                .padding(start = 20.dp, end = 20.dp, bottom = 120.dp)
                .fillMaxWidth(),
        ) {
            Text("Change Host Name", fontWeight = FontWeight.Bold, fontSize = 20.sp)
            OutlinedTextField(
                value = input,
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth(),
                onValueChange = {
                    input = it
                },
                label = { Text("Enter Host") },
            )
            Row(
                horizontalArrangement = Arrangement.End,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            ) {
                Button({
                    setHost(input)
                    onClose()
                }) { Text("Change") }
            }
        }
    }
}