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

// ── Light palette ─────────────────────────────────────────────────────────
private val Blue        = Color(0xFF4A90E2)
private val Purple      = Color(0xFF9B6EFF)
private val BgColor     = Color(0xFFF4F6FF)
private val SurfaceWht  = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF3D3D6B)
private val TextSub     = Color(0xFF7A7A9A)
private val StepDone    = Color(0xFF43A047)
private val StepPending = Color(0xFFD0D5EE)

@Composable
private fun StepRow(label: String, done: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 5.dp)
    ) {
        Box(
            Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(if (done) StepDone else StepPending)
        )
        Spacer(Modifier.width(10.dp))
        Text(
            label,
            fontSize = 13.sp,
            color = if (done) TextPrimary else TextSub,
            fontWeight = if (done) FontWeight.Medium else FontWeight.Normal
        )
    }
}

@Preview(device = "spec:width=411dp,height=891dp,orientation=landscape")
@Composable
fun Loading(state: GameState.Loading = GameState.Loading()) {

    val infiniteTransition = rememberInfiniteTransition(label = "loading")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(1400, easing = LinearEasing), RepeatMode.Restart),
        label = "rotation"
    )
    val progressAnim by infiniteTransition.animateFloat(
        initialValue = 0.05f, targetValue = 0.9f,
        animationSpec = infiniteRepeatable(tween(3000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "progress"
    )

    Box(
        modifier = Modifier.background(BgColor).fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 36.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            // Logo with rotating gradient ring
            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(bottom = 20.dp)) {
                Box(
                    Modifier
                        .size(88.dp)
                        .rotate(rotation)
                        .clip(CircleShape)
                        .background(
                            Brush.sweepGradient(listOf(Color.Transparent, Blue, Purple, Color.Transparent))
                        )
                )
                // White centre backing
                Box(
                    Modifier
                        .size(74.dp)
                        .clip(CircleShape)
                        .background(BgColor)
                )
                Image(
                    painter = painterResource(R.drawable.app_icon),
                    contentDescription = "CogniVox",
                    modifier = Modifier.size(56.dp)
                )
            }

            // Title
            Text(
                "Preparing VR Environment",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 20.dp)
            )

            // Progress bar
            LinearProgressIndicator(
                progress = { progressAnim },
                modifier = Modifier
                    .fillMaxWidth(0.65f)
                    .height(6.dp)
                    .clip(RoundedCornerShape(50)),
                color = Blue,
                trackColor = Color(0xFFD0D5EE),
                strokeCap = StrokeCap.Round,
            )

            Spacer(Modifier.height(16.dp))

            // Animated step message
            AnimatedContent(
                targetState = state.loadingMessage(),
                transitionSpec = { fadeIn(tween(350)) togetherWith fadeOut(tween(250)) },
                label = "message"
            ) { msg ->
                Text(
                    "$msg...",
                    fontSize = 13.sp,
                    color = Purple,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(24.dp))

            // Step indicators — inside a white card
            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .background(SurfaceWht)
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalAlignment = Alignment.Start
            ) {
                StepRow("Game Engine Started", done = state.godotLoaded)
                StepRow("Connected to Server", done = state.connected)
                StepRow("Server Ready",        done = state.serverReady)
            }
        }
    }
}