package io.github.cognivoxResearch.cognivox.screen.home

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.screen.home.components.HostSheet
import io.github.cognivoxResearch.cognivox.screen.home.components.JoinSheet
import java.util.UUID

private val BgGradient = Brush.verticalGradient(
    listOf(Color(0xFF0D1117), Color(0xFF0E1A32), Color(0xFF0D1117))
)
private val Cyan = Color(0xFF00E5FF)

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

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.8f, targetValue = 1.2f,
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "dot"
    )

    Box(
        modifier = Modifier.background(BgGradient).fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {

            // App name
            Text(
                "CogniVox",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Cyan,
                letterSpacing = 2.sp
            )

            Spacer(Modifier.height(40.dp))

            when (state) {

                is HomeState.Waiting -> {
                    // Status dot + label
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(8.dp).scale(pulse).clip(CircleShape).background(Color(0xFF69F0AE))
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Connected", fontSize = 13.sp, color = Color(0xFF69F0AE))
                    }

                    Spacer(Modifier.height(12.dp))

                    Text(
                        "Welcome, ${state.userName}",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFE0F7FA),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(6.dp))

                    Text(
                        "Waiting for your VR session to start",
                        fontSize = 13.sp,
                        color = Color(0xFF546E7A),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(32.dp))

                    Button(
                        onClick = { joinManual = true },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Cyan,
                            contentColor = Color(0xFF0D1117)
                        )
                    ) {
                        Text("Join Session", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }

                is HomeState.Connecting -> {
                    // Status dot + label
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(8.dp).scale(pulse).clip(CircleShape).background(Color(0xFFFFB300))
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Connecting...", fontSize = 13.sp, color = Color(0xFFFFB300))
                    }

                    Spacer(Modifier.height(12.dp))

                    if (state.state.isNotBlank()) {
                        Text(
                            state.state,
                            fontSize = 14.sp,
                            color = Color(0xFF546E7A),
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(4.dp))
                    }

                    Text(
                        state.host,
                        fontSize = 12.sp,
                        color = Color(0xFF37474F),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(32.dp))

                    OutlinedButton(
                        onClick = { hostEditOpen = true },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Cyan),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Cyan)
                    ) {
                        Text("Change Host", fontSize = 15.sp)
                    }
                }
            }
        }
    }

    if (state is HomeState.Connecting && hostEditOpen) {
        HostSheet(state.host, onChangeHost) { hostEditOpen = false }
    } else if (state is HomeState.Waiting && joinManual) {
        JoinSheet(onJoinManual, onJoinTest) { joinManual = false }
    }
}
