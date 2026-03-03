package io.github.cognivoxResearch.cognivox.screen.game.pages

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.R
import io.github.cognivoxResearch.cognivox.screen.game.GameState

private val BackgroundGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF0D1117), Color(0xFF0E1A32), Color(0xFF0D1117))
)
private val AccentCyan = Color(0xFF00E5FF)
private val StepDoneColor = Color(0xFF00E5FF)
private val StepPendingColor = Color(0xFF2A3A4A)

@Composable
private fun StepIndicator(label: String, done: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(if (done) StepDoneColor else StepPendingColor)
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text = label,
            fontSize = 13.sp,
            color = if (done) Color(0xFFB0BEC5) else Color(0xFF455A64),
            fontWeight = if (done) FontWeight.Medium else FontWeight.Normal
        )
    }
}

@Preview(device = "spec:width=411dp,height=891dp,orientation=landscape")
@Composable
fun Loading(state: GameState.Loading = GameState.Loading()) {

    val infiniteTransition = rememberInfiniteTransition(label = "loading")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )
    val progressAnim by infiniteTransition.animateFloat(
        initialValue = 0.05f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "progress"
    )

    Box(
        modifier = Modifier
            .background(BackgroundGradient)
            .fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 40.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {

            // Logo with rotating ring
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.padding(bottom = 24.dp)
            ) {
                // Rotating accent ring
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .rotate(rotation)
                        .clip(CircleShape)
                        .background(
                            Brush.sweepGradient(
                                listOf(Color.Transparent, AccentCyan, Color.Transparent)
                            )
                        )
                )
                // Logo
                Image(
                    painter = painterResource(id = R.drawable.app_icon),
                    contentDescription = "CogniVox Logo",
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0D1117))
                        .padding(4.dp)
                )
            }

            // Title
            Text(
                text = "Preparing VR Environment",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFE0F7FA),
                letterSpacing = 0.5.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            // Progress bar
            LinearProgressIndicator(
                progress = { progressAnim },
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .height(6.dp)
                    .clip(RoundedCornerShape(50)),
                color = AccentCyan,
                trackColor = Color(0xFF1E2D40),
                strokeCap = StrokeCap.Round,
            )

            Spacer(Modifier.height(20.dp))

            // Animated loading message
            AnimatedContent(
                targetState = state.loadingMessage(),
                transitionSpec = {
                    fadeIn(tween(400)) togetherWith fadeOut(tween(300))
                },
                label = "loadingMessage"
            ) { message ->
                Text(
                    text = "$message...",
                    fontSize = 14.sp,
                    color = AccentCyan,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(Modifier.height(28.dp))

            // Step indicators
            Column(horizontalAlignment = Alignment.Start) {
                StepIndicator("Game Engine Started", done = state.godotLoaded)
                StepIndicator("Connected to Server", done = state.connected)
                StepIndicator("Server Ready", done = state.serverReady)
            }
        }
    }
}