package io.github.cognivoxResearch.cognivox.screen.home

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.screen.home.components.HostSheet
import io.github.cognivoxResearch.cognivox.screen.home.components.JoinSheet
import java.util.UUID

private val BackgroundGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF0D1117), Color(0xFF0E1A32), Color(0xFF0D1117))
)
private val AccentCyan = Color(0xFF00E5FF)
private val CardBg = Color(0xFF111C2E)
private val CardBorder = Color(0xFF1E3050)

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
    val hideHostEdit = { hostEditOpen = false }
    val hideJoin = { joinManual = false }

    // Pulsing animation for status badge
    val infiniteTransition = rememberInfiniteTransition(label = "statusPulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Box(
        modifier = Modifier
            .background(BackgroundGradient)
            .fillMaxSize()
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {

            // Header: Logo + Branding
            item {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(bottom = 32.dp)
                ) {
                    Text(
                        text = "CogniVox",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AccentCyan,
                        letterSpacing = 2.sp,
                    )
                    Text(
                        text = "Connected Cognitive VR Platform",
                        fontSize = 13.sp,
                        color = Color(0xFF546E7A),
                        letterSpacing = 0.5.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // State-based content
            when (state) {

                is HomeState.Connecting -> item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardBg),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Connecting spinner badge
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(bottom = 16.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .scale(pulseScale)
                                        .clip(CircleShape)
                                        .background(Color(0xFFFFB300))
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = "Connecting...",
                                    fontSize = 14.sp,
                                    color = Color(0xFFFFB300),
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            Text(
                                text = state.state,
                                fontSize = 16.sp,
                                color = Color(0xFFB0BEC5),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(bottom = 12.dp)
                            )

                            // Host display
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF0D1830))
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Icon(
                                    Icons.Default.Refresh,
                                    contentDescription = null,
                                    tint = Color(0xFF455A64),
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = state.host,
                                    fontSize = 12.sp,
                                    color = Color(0xFF546E7A),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }

                            Spacer(Modifier.height(16.dp))

                            OutlinedButton(
                                onClick = { hostEditOpen = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = AccentCyan),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AccentCyan)
                            ) {
                                Text("Change Host", fontSize = 14.sp)
                            }
                        }
                    }
                }

                is HomeState.Waiting -> {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = CardBg),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                // User avatar icon
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF1E2D40))
                                        .border(2.dp, AccentCyan, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Default.Person,
                                        contentDescription = null,
                                        tint = AccentCyan,
                                        modifier = Modifier.size(36.dp)
                                    )
                                }

                                Spacer(Modifier.height(12.dp))

                                Text(
                                    text = "Welcome, ${state.userName}!",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFE0F7FA),
                                    textAlign = TextAlign.Center,
                                )

                                Spacer(Modifier.height(8.dp))

                                // Status badge
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(bottom = 16.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .scale(pulseScale)
                                            .clip(CircleShape)
                                            .background(Color(0xFF69F0AE))
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        text = "Waiting for session to start",
                                        fontSize = 13.sp,
                                        color = Color(0xFF69F0AE),
                                    )
                                }

                                // Device ID row
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF0D1830))
                                        .padding(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Text(
                                        text = "Device: ",
                                        fontSize = 11.sp,
                                        color = Color(0xFF455A64),
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = state.deviceId.toString(),
                                        fontSize = 11.sp,
                                        color = Color(0xFF37474F),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }

                                Spacer(Modifier.height(16.dp))

                                Button(
                                    onClick = { joinManual = true },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = AccentCyan,
                                        contentColor = Color(0xFF0D1117)
                                    )
                                ) {
                                    Text(
                                        "Join with Session ID",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (state is HomeState.Connecting && hostEditOpen) {
        HostSheet(state.host, onChangeHost, hideHostEdit)
    } else if (state is HomeState.Waiting && joinManual) {
        JoinSheet(onJoinManual, onJoinTest, hideJoin)
    }
}
