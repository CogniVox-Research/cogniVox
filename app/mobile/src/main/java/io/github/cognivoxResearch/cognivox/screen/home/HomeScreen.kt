package io.github.cognivoxResearch.cognivox.screen.home

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.alpha
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
import java.util.UUID

// ── Palette ─────────────────────────────────────────────────────────────────
private val Blue         = Color(0xFF4A90E2)
private val Purple       = Color(0xFF9B6EFF)
private val BrandGrad    = Brush.linearGradient(listOf(Blue, Purple))
private val HeaderGrad   = Brush.verticalGradient(listOf(Color(0xFFEEF2FF), Color(0xFFF9F5FF), Color(0xFFF4F6FF)))
private val BgColor      = Color(0xFFF4F6FF)
private val SurfaceWht   = Color(0xFFFFFFFF)
private val TextPrimary  = Color(0xFF1A1A2E)
private val TextSub      = Color(0xFF7A7A9A)
private val GreenOnline  = Color(0xFF43A047)
private val AmberWait    = Color(0xFFFFA726)

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

    val infiniteTransition = rememberInfiniteTransition(label = "anim")

    // Pulsing status dot
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.6f, targetValue = 1.4f,
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse"
    )
    // Slow breathing alpha for decorative blobs
    val blobAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f, targetValue = 0.55f,
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing), RepeatMode.Reverse),
        label = "blob"
    )
    // Waiting orbit spinner (Connecting state)
    val spinAngle by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2000, easing = LinearEasing), RepeatMode.Restart),
        label = "spin"
    )

    Box(modifier = Modifier.background(BgColor).fillMaxSize()) {

        // ── Decorative gradient blobs in header area ──────────────
        Box(
            modifier = Modifier
                .size(260.dp)
                .offset(x = (-60).dp, y = (-60).dp)
                .alpha(blobAlpha)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(listOf(Color(0x884A90E2), Color.Transparent))
                )
        )
        Box(
            modifier = Modifier
                .size(200.dp)
                .align(Alignment.TopEnd)
                .offset(x = 60.dp, y = (-20).dp)
                .alpha(blobAlpha)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(listOf(Color(0x889B6EFF), Color.Transparent))
                )
        )

        Column(modifier = Modifier.fillMaxSize()) {

            // ── Header section ────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(HeaderGrad)
                    .padding(top = 56.dp, bottom = 36.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {

                    // Logo inside a gradient ring
                    Box(contentAlignment = Alignment.Center) {
                        // Gradient ring
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .clip(CircleShape)
                                .background(BrandGrad)
                        )
                        // White inner circle
                        Box(
                            modifier = Modifier
                                .size(88.dp)
                                .clip(CircleShape)
                                .background(SurfaceWht),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(R.drawable.app_icon),
                                contentDescription = "CogniVox",
                                modifier = Modifier.size(62.dp)
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    Text(
                        "CogniVox",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary
                    )
                    Text(
                        "Cognitive VR Platform",
                        fontSize = 12.sp,
                        color = TextSub,
                        letterSpacing = 0.5.sp
                    )
                }
            }

            // ── Main content area ─────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .padding(top = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

                when (state) {

                    is HomeState.Waiting -> WaitingContent(
                        state = state,
                        pulse = pulse,
                        surfaceColor = SurfaceWht,
                        textPrimary = TextPrimary,
                        textSub = TextSub,
                        green = GreenOnline
                    )

                    is HomeState.Connecting -> ConnectingContent(
                        state = state,
                        pulse = pulse,
                        surfaceColor = SurfaceWht,
                        textPrimary = TextPrimary,
                        textSub = TextSub,
                        amber = AmberWait,
                        purple = Purple,
                        brandGrad = BrandGrad,
                        onChangeHost = { hostEditOpen = true }
                    )
                }
            }
        }
    }

    if (state is HomeState.Connecting && hostEditOpen) {
        HostSheet(state.host, onChangeHost) { hostEditOpen = false }
    }
}

@Composable
private fun WaitingContent(
    state: HomeState.Waiting,
    pulse: Float,
    surfaceColor: Color,
    textPrimary: Color,
    textSub: Color,
    green: Color
) {
    // Status pill
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(Color(0xFFE8F5E9))
            .padding(horizontal = 14.dp, vertical = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(7.dp)
                    .scale(pulse)
                    .clip(CircleShape)
                    .background(green)
            )
            Spacer(Modifier.width(6.dp))
            Text("Connected", fontSize = 12.sp, color = green, fontWeight = FontWeight.SemiBold)
        }
    }

    Spacer(Modifier.height(24.dp))

    // Welcome card
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(surfaceColor)
            .padding(28.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {

            // User avatar initials circle
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(Color(0xFF4A90E2), Color(0xFF9B6EFF)))),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = state.userName.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(Modifier.height(16.dp))

            Text(
                "Hello, ${state.userName}!",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = textPrimary,
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(6.dp))

            Text(
                "Your session is ready to begin.\nSit back and relax while we prepare.",
                fontSize = 13.sp,
                color = textSub,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )

            Spacer(Modifier.height(24.dp))

            // Decorative waiting indicator — three pulsing dots
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                repeat(3) { i ->
                    Box(
                        Modifier
                            .padding(horizontal = 4.dp)
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(listOf(Color(0xFF4A90E2), Color(0xFF9B6EFF)))
                            )
                            .alpha(if (i == 1) 1f else 0.4f)
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            Text(
                "Waiting for session to start...",
                fontSize = 11.sp,
                color = textSub,
                letterSpacing = 0.5.sp
            )
        }
    }
}

@Composable
private fun ConnectingContent(
    state: HomeState.Connecting,
    pulse: Float,
    surfaceColor: Color,
    textPrimary: Color,
    textSub: Color,
    amber: Color,
    purple: Color,
    brandGrad: Brush,
    onChangeHost: () -> Unit
) {
    // Status pill
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(Color(0xFFFFF8E1))
            .padding(horizontal = 14.dp, vertical = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(7.dp).scale(pulse).clip(CircleShape).background(amber))
            Spacer(Modifier.width(6.dp))
            Text("Connecting...", fontSize = 12.sp, color = amber, fontWeight = FontWeight.SemiBold)
        }
    }

    Spacer(Modifier.height(24.dp))

    // Connection card
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(surfaceColor)
            .padding(28.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {

            Text(
                "Setting up connection",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = textPrimary
            )

            Spacer(Modifier.height(6.dp))

            Text(
                "Establishing a secure link\nto your VR session server.",
                fontSize = 13.sp,
                color = textSub,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )

            Spacer(Modifier.height(20.dp))

            // Host display
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF0EEFF))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Column {
                    Text("Server", fontSize = 10.sp, color = textSub, fontWeight = FontWeight.Medium, letterSpacing = 0.8.sp)
                    Spacer(Modifier.height(2.dp))
                    Text(state.host, fontSize = 13.sp, color = purple, fontWeight = FontWeight.SemiBold)
                    if (state.state.isNotBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(state.state, fontSize = 11.sp, color = textSub)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // Change host button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(brandGrad),
                contentAlignment = Alignment.Center
            ) {
                Button(
                    onClick = onChangeHost,
                    modifier = Modifier.fillMaxSize(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                ) {
                    Text("Change Host", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White)
                }
            }
        }
    }
}
