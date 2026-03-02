package io.github.cognivoxResearch.cognivox.screen.game

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.R

@Composable
fun GameScreen(state: GameState) {
    if (state !is GameState.Loading) return;

    Column(
        modifier = Modifier
            .background(Color(1f, 1f, 1f))
            .fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,

        ) {
        Image(
            painter = painterResource(id = R.drawable.app_icon),
            "CongniVox Logo",
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Text(
            text = "Preparing VR Environment",
            modifier = Modifier.padding(bottom = 100.dp),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )

        LinearProgressIndicator(
            modifier = Modifier
                .height(12.dp)
        )

        Text("${state.loading_message()}...", modifier = Modifier.padding(top = 10.dp))

    }
}