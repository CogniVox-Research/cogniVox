package io.github.cognivoxResearch.cognivox.screen.game.pages

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.R

@Preview(device = "spec:width=411dp,height=891dp,orientation=landscape")
@Composable
fun ContinueTap(onTap: () -> Unit = {}) {
    Surface(onClick = onTap) {
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
                text = "Tap to Start",
                modifier = Modifier.padding(),
                fontSize = 30.sp,
            )
        }
    }

}