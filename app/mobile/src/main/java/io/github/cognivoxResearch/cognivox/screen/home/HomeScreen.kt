package io.github.cognivoxResearch.cognivox.screen.home

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.R
import io.github.cognivoxResearch.cognivox.screen.home.components.HostSheet
import io.github.cognivoxResearch.cognivox.screen.home.components.JoinSheet
import java.util.UUID

// ── Palette derived from CogniVox logo ──────────────────────────────────────
private val Blue        = Color(0xFF4D9FFF)
private val Purple      = Color(0xFF9B6EFF)
private val Lavender    = Color(0xFFDDD6FE)
private val BgDark      = Color(0xFF08091A)
private val BgMid       = Color(0xFF0D1230)
private val SubText     = Color(0xFF8888AA)
private val BgGradient  = Brush.verticalGradient(listOf(BgDark, BgMid, BgDark))
private val BrandGrad   = Brush.horizontalGradient(listOf(Blue, Purple))

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
        initialValue = 0.75f, targetValue = 1.25f,
        animationSpec = infiniteRepeatable(tween(850, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "dot"
    )

    Box(
        modifier = Modifier.background(BgGradient).fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {

            // ── Logo + brand name ──────────────────────────
            Image(
                painter = painterResource(R.drawable.app_icon),
                contentDescription = "CogniVox Logo",
                modifier = Modifier.size(72.dp)
            )

            Spacer(Modifier.height(14.dp))

            // "CogniVox" with brand gradient via shimmer workaround (brush on Text)
            Text(
                text = "CogniVox",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Lavender,
                letterSpacing = 1.sp
            )

            Spacer(Modifier.height(48.dp))

            // ── State-specific content ─────────────────────
            when (state) {

                is HomeState.Waiting -> {
                    // Status dot + label
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(8.dp)
                                .scale(pulse)
                                .clip(CircleShape)
                                .background(Color(0xFF69F0AE))
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Connected", fontSize = 12.sp, color = Color(0xFF69F0AE))
                    }

                    Spacer(Modifier.height(16.dp))

                    Text(
                        "Welcome, ${state.userName}",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFE8E8F8),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(6.dp))

                    Text(
                        "Waiting for your VR session to start",
                        fontSize = 13.sp,
                        color = SubText,
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(36.dp))

                    // Gradient "Join Session" button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(BrandGrad),
                        contentAlignment = Alignment.Center
                    ) {
                        Button(
                            onClick = { joinManual = true },
                            modifier = Modifier.fillMaxSize(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                        ) {
                            Text("Join Session", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White)
                        }
                    }
                }

                is HomeState.Connecting -> {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(8.dp)
                                .scale(pulse)
                                .clip(CircleShape)
                                .background(Color(0xFFFFB300))
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Connecting...", fontSize = 12.sp, color = Color(0xFFFFB300))
                    }

                    Spacer(Modifier.height(16.dp))

                    if (state.state.isNotBlank()) {
                        Text(
                            state.state,
                            fontSize = 14.sp,
                            color = Color(0xFFB0AECF),
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(4.dp))
                    }

                    Text(
                        state.host,
                        fontSize = 12.sp,
                        color = SubText,
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(36.dp))

                    OutlinedButton(
                        onClick = { hostEditOpen = true },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Lavender),
                        border = androidx.compose.foundation.BorderStroke(
                            1.5.dp,
                            Brush.horizontalGradient(listOf(Blue, Purple))
                        )
                    ) {
                        Text("Change Host", fontSize = 15.sp, fontWeight = FontWeight.Medium)
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
