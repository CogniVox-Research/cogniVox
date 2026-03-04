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

// ── Light palette ─────────────────────────────────────────────────────────
private val Blue      = Color(0xFF4A90E2)
private val Purple    = Color(0xFF9B6EFF)
private val BrandGrad = Brush.horizontalGradient(listOf(Blue, Purple))
private val BgColor   = Color(0xFFF4F6FF)
private val GlowBlue  = Color(0x294A90E2)
private val GlowPurp  = Color(0x299B6EFF)

@Preview(device = "spec:width=411dp,height=891dp,orientation=landscape")
@Composable
fun ContinueTap(onTap: () -> Unit = {}) {

    // Fade-in on entry
    var alpha by remember { mutableFloatStateOf(0f) }
    val animatedAlpha by animateFloatAsState(
        targetValue = alpha,
        animationSpec = tween(700, easing = FastOutSlowInEasing),
        label = "fadeIn"
    )
    LaunchedEffect(Unit) { alpha = 1f }

    // Pulsing ring
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 1.2f,
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse"
    )

    Surface(onClick = onTap) {
        Box(
            modifier = Modifier.background(BgColor).fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 32.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

                // Logo with soft pulsing glow rings
                Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(bottom = 28.dp)) {
                    // Outer glow
                    Box(
                        Modifier.size(130.dp).scale(pulseScale).clip(CircleShape)
                            .background(GlowBlue)
                    )
                    // Inner glow
                    Box(
                        Modifier.size(100.dp).clip(CircleShape).background(GlowPurp)
                    )
                    // Logo
                    Image(
                        painter = painterResource(R.drawable.app_icon),
                        contentDescription = "CogniVox",
                        modifier = Modifier.size(68.dp)
                    )
                }

                // Gradient text brush workaround — use two stacked texts
                Text(
                    text = "Tap to Start",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF3D3D6B),
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Text(
                    text = "Your cognitive VR session is ready",
                    fontSize = 14.sp,
                    color = Color(0xFF7A7A9A),
                    textAlign = TextAlign.Center
                )

                Spacer(Modifier.height(40.dp))

                Text(
                    "tap anywhere to continue",
                    fontSize = 11.sp,
                    color = Color(0xFFAAAAAC),
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}