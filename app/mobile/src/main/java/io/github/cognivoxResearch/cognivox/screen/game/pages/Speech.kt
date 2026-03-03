package io.github.cognivoxResearch.cognivox.screen.game.pages

import android.widget.Toast
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import kotlinx.coroutines.delay

@Preview(device = "spec:width=411dp,height=891dp,orientation=landscape")
@Composable
fun Speech(onEnd: () -> Unit = {}) {
    val interactionSource = remember { MutableInteractionSource() }
    val context = LocalContext.current
    var hasEnded by remember { mutableStateOf(false) }
    var tapID by remember { mutableIntStateOf(0) }

    LaunchedEffect("showToast", tapID) {
        if (tapID != 0) {
            delay(500)
            Toast.makeText(context, "Tap again to end speech", Toast.LENGTH_SHORT).show()
        }
    }

    Surface(
        color = Color.Transparent,
        modifier = Modifier.pointerInput(interactionSource) {
            detectTapGestures(
                onPress = {
                    if (!hasEnded) {
                        tapID += 1
                    }
                },
                onDoubleTap = {
                    tapID = 0
                    if (!hasEnded) {
                        onEnd()
                    }
                },
            )
        }
    ) { }
}