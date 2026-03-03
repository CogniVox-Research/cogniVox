package io.github.cognivoxResearch.cognivox.screen.game.pages

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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

private val BackgroundGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF0D1117), Color(0xFF0E1A32), Color(0xFF0D1117))
)
private val AccentCyan = Color(0xFF00E5FF)
private val SubtleGlow = Color(0x3300E5FF)

@Preview(device = "spec:width=411dp,height=891dp,orientation=landscape")
@Composable
fun ContinueTap(onTap: () -> Unit = {}) {

    // Fade-in alpha
    var alpha by remember { mutableFloatStateOf(0f) }
    val animatedAlpha by animateFloatAsState(
        targetValue = alpha,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "fadeIn"
    )
    LaunchedEffect(Unit) { alpha = 1f }

    // Pulsing glow ring
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.18f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Surface(onClick = onTap) {
        Box(
            modifier = Modifier
                .background(BackgroundGradient)
                .fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 32.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {

                // Pulsing glow ring behind logo
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.padding(bottom = 28.dp)
                ) {
                    // Outer glow ring
                    Box(
                        modifier = Modifier
                            .size(128.dp)
                            .scale(pulseScale)
                            .clip(CircleShape)
                            .background(SubtleGlow)
                    )
                    // Inner glow ring
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .background(Color(0x1A00E5FF))
                    )
                    // Logo
                    Image(
                        painter = painterResource(id = R.drawable.app_icon),
                        contentDescription = "CogniVox Logo",
                        modifier = Modifier.size(72.dp)
                    )
                }

                // Headline
                Text(
                    text = "Tap to Start",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = AccentCyan,
                    letterSpacing = 2.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                // Subtitle
                Text(
                    text = "Your cognitive VR session is ready",
                    fontSize = 14.sp,
                    color = Color(0xFFB0BEC5),
                    letterSpacing = 0.5.sp,
                    textAlign = TextAlign.Center,
                )

                Spacer(modifier = Modifier.height(48.dp))

                // Tap hint
                Text(
                    text = "[ TAP ANYWHERE TO CONTINUE ]",
                    fontSize = 11.sp,
                    color = Color(0xFF546E7A),
                    letterSpacing = 2.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
        }
    }
}