package io.github.cognivoxResearch.cognivox.screen.game.pages

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.R

// ── Light palette (matches app theme) ────────────────────────────────────────
private val Blue        = Color(0xFF4A90E2)
private val Purple      = Color(0xFF9B6EFF)
private val BrandGrad   = Brush.linearGradient(listOf(Blue, Purple))
private val BgColor     = Color(0xFFF4F6FF)
private val SurfaceWht  = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSub     = Color(0xFF7A7A9A)
private val GreenCheck  = Color(0xFF43A047)

@Preview(device = "spec:width=891dp,height=411dp,orientation=landscape")
@Composable
fun SessionEnd(onGoHome: () -> Unit = {}) {

    // Fade-in on entry
    var alpha by remember { mutableFloatStateOf(0f) }
    val animatedAlpha by animateFloatAsState(
        targetValue = alpha,
        animationSpec = tween(600, easing = FastOutSlowInEasing),
        label = "fadeIn"
    )
    LaunchedEffect(Unit) { alpha = 1f }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgColor)
            .alpha(animatedAlpha),
        contentAlignment = Alignment.Center
    ) {

        // Two-column layout (landscape): left = icon+title, right = info card
        Row(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(28.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {

            // ── Left: Logo + session complete badge ──────────────
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.weight(0.9f)
            ) {
                // Logo in gradient ring
                Box(contentAlignment = Alignment.Center) {
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .clip(CircleShape)
                            .background(BrandGrad)
                    )
                    Box(
                        modifier = Modifier
                            .size(78.dp)
                            .clip(CircleShape)
                            .background(SurfaceWht),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(R.drawable.app_icon),
                            contentDescription = "CogniVox",
                            modifier = Modifier.size(54.dp)
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Green checkmark badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFFE8F5E9))
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(GreenCheck)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "Session Complete",
                            fontSize = 12.sp,
                            color = GreenCheck,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                Text(
                    "CogniVox",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            // ── Right: Info card ─────────────────────────────────
            Column(
                modifier = Modifier
                    .weight(1.4f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(SurfaceWht)
                    .padding(24.dp),
                horizontalAlignment = Alignment.Start
            ) {

                Text(
                    "Your session has ended",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Spacer(Modifier.height(8.dp))

                Text(
                    "Thank you for participating in this cognitive VR session. Your biometric and speech data has been recorded successfully.",
                    fontSize = 13.sp,
                    color = TextSub,
                    lineHeight = 20.sp
                )

                Spacer(Modifier.height(16.dp))

                // Results hint box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFF0EEFF))
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Column {
                        Text(
                            "View your results",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Purple
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            "Full session analysis and cognitive performance insights are available on the CogniVox web dashboard.",
                            fontSize = 12.sp,
                            color = TextSub,
                            lineHeight = 18.sp
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Return to home button
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(BrandGrad),
                    contentAlignment = Alignment.Center
                ) {
                    Button(
                        onClick = onGoHome,
                        modifier = Modifier.fillMaxSize(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                    ) {
                        Text(
                            "Return to Home",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
