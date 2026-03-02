package io.github.cognivoxResearch.cognivox.net.screen.home.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
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
                value = host,
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth(),
                onValueChange = {
                    setHost(it)
                },
                label = { Text("Enter Host") },
            )
        }
    }
}