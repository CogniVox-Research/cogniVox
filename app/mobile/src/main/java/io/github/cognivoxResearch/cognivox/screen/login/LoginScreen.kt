package io.github.cognivoxResearch.cognivox.screen.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.cognivoxResearch.cognivox.R

// ── Palette derived from CogniVox logo ──────────────────────────────────────
private val Blue        = Color(0xFF4D9FFF)
private val Purple      = Color(0xFF9B6EFF)
private val Lavender    = Color(0xFFDDD6FE)
private val BgDark      = Color(0xFF08091A)
private val BgMid       = Color(0xFF0D1230)
private val SubText     = Color(0xFF8888AA)
private val FieldBg     = Color(0xFF0F1228)
private val FieldStroke = Color(0xFF272750)
private val BgGradient  = Brush.verticalGradient(listOf(BgDark, BgMid, BgDark))
private val BrandGrad   = Brush.horizontalGradient(listOf(Blue, Purple))

@Preview(showBackground = true)
@Composable
fun LoginScreen(
    state: LoginState = LoginState.Unauthenticated,
    onLogin: (name: String, token: String) -> Unit = { _, _ -> }
) {
    val focusManager = LocalFocusManager.current
    var name by remember { mutableStateOf("") }
    var token by remember { mutableStateOf("") }
    var tokenVisible by remember { mutableStateOf(false) }
    var nameError by remember { mutableStateOf("") }
    var tokenError by remember { mutableStateOf("") }
    val isLoading = state is LoginState.Loading

    Box(modifier = Modifier.background(BgGradient).fillMaxSize()) {

        // Decorative top gradient blob
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .align(Alignment.TopCenter)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0x33A855F7), Color.Transparent),
                        radius = 600f
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            Spacer(Modifier.height(64.dp))

            // ── Logo ──────────────────────────────────────────────
            Image(
                painter = painterResource(R.drawable.app_icon),
                contentDescription = "CogniVox Logo",
                modifier = Modifier.size(80.dp)
            )

            Spacer(Modifier.height(16.dp))

            Text(
                "CogniVox",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Lavender,
                letterSpacing = 1.sp
            )

            Text(
                "Cognitive VR Platform",
                fontSize = 12.sp,
                color = SubText,
                letterSpacing = 0.5.sp
            )

            Spacer(Modifier.weight(1f))

            // ── Form card ─────────────────────────────────────────
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Start
            ) {

                Text(
                    "Sign In",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFFE8E8F8)
                )

                Spacer(Modifier.height(20.dp))

                // Name field
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; nameError = "" },
                    label = { Text("Your name") },
                    singleLine = true,
                    isError = nameError.isNotEmpty(),
                    supportingText = if (nameError.isNotEmpty()) {
                        { Text(nameError, color = Color(0xFFEF5350), fontSize = 11.sp) }
                    } else null,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = fieldColors()
                )

                Spacer(Modifier.height(12.dp))

                // Token field
                OutlinedTextField(
                    value = token,
                    onValueChange = { token = it; tokenError = "" },
                    label = { Text("Auth token") },
                    singleLine = true,
                    isError = tokenError.isNotEmpty(),
                    supportingText = if (tokenError.isNotEmpty()) {
                        { Text(tokenError, color = Color(0xFFEF5350), fontSize = 11.sp) }
                    } else null,
                    visualTransformation = if (tokenVisible) VisualTransformation.None
                                          else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { tokenVisible = !tokenVisible }) {
                            Icon(
                                if (tokenVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = null,
                                tint = SubText
                            )
                        }
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(onDone = {
                        focusManager.clearFocus()
                        attempt(name, token, onLogin) { n, t -> nameError = n; tokenError = t }
                    }),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = fieldColors()
                )

                Spacer(Modifier.height(28.dp))

                // Gradient Sign In button
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isLoading) Brush.horizontalGradient(listOf(Color(0xFF2A2060), Color(0xFF2A1A50))) else BrandGrad),
                    contentAlignment = Alignment.Center
                ) {
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            attempt(name, token, onLogin) { n, t -> nameError = n; tokenError = t }
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxSize(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent
                        )
                    ) {
                        if (isLoading) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(Modifier.size(16.dp), color = Lavender, strokeWidth = 2.dp)
                                Spacer(Modifier.width(10.dp))
                                Text("Signing in...", fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = Lavender)
                            }
                        } else {
                            Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White)
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                Text(
                    text = "Use the auth token from your session administrator",
                    fontSize = 11.sp,
                    color = Color(0xFF555575),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(Modifier.height(48.dp))
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Purple,
    unfocusedBorderColor = FieldStroke,
    focusedContainerColor = FieldBg,
    unfocusedContainerColor = FieldBg,
    focusedTextColor = Color(0xFFE8E8F8),
    unfocusedTextColor = Color(0xFFB0AECF),
    focusedLabelColor = Purple,
    unfocusedLabelColor = SubText,
    cursorColor = Blue,
    errorBorderColor = Color(0xFFEF5350),
    errorContainerColor = FieldBg,
)

private fun attempt(
    name: String, token: String,
    onLogin: (String, String) -> Unit,
    setErrors: (String, String) -> Unit
) {
    val ne = if (name.isBlank()) "Name is required" else ""
    val te = if (token.isBlank()) "Auth token is required" else ""
    if (ne.isNotEmpty() || te.isNotEmpty()) { setErrors(ne, te); return }
    onLogin(name.trim(), token.trim())
}
