package io.github.cognivoxResearch.cognivox.screen.login

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val BackgroundGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF0D1117), Color(0xFF0E1A32), Color(0xFF0D1117))
)
private val AccentCyan = Color(0xFF00E5FF)
private val FieldBg = Color(0xFF111C2E)
private val FieldBorder = Color(0xFF1E3050)
private val FieldBorderFocused = Color(0xFF00E5FF)

@Preview(showBackground = true, backgroundColor = 0xFF0D1117)
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

    // Fade-in on entry
    var alpha by remember { mutableFloatStateOf(0f) }
    val animatedAlpha by animateFloatAsState(
        targetValue = alpha,
        animationSpec = tween(700, easing = FastOutSlowInEasing),
        label = "fadeIn"
    )
    LaunchedEffect(Unit) { alpha = 1f }

    // Pulsing ring behind icon
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    val isLoading = state is LoginState.Loading

    Box(
        modifier = Modifier
            .background(BackgroundGradient)
            .fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp)
                .then(Modifier.padding(vertical = 32.dp)),  // internal vertical padding
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {

            // — App icon with pulsing ring —
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .padding(bottom = 20.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(88.dp)
                        .scale(pulseScale)
                        .clip(CircleShape)
                        .background(Color(0x2200E5FF))
                )
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1A2A40))
                        .border(2.dp, AccentCyan, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Lock,
                        contentDescription = "Login",
                        tint = AccentCyan,
                        modifier = Modifier.size(30.dp)
                    )
                }
            }

            // — Title —
            Text(
                text = "CogniVox",
                fontSize = 30.sp,
                fontWeight = FontWeight.ExtraBold,
                color = AccentCyan,
                letterSpacing = 2.sp,
                textAlign = TextAlign.Center,
            )
            Text(
                text = "Sign in to continue",
                fontSize = 13.sp,
                color = Color(0xFF546E7A),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp, bottom = 32.dp)
            )

            // — Name field —
            OutlinedTextField(
                value = name,
                onValueChange = {
                    name = it
                    nameError = ""
                },
                label = { Text("Name", color = Color(0xFF546E7A)) },
                singleLine = true,
                isError = nameError.isNotEmpty(),
                supportingText = if (nameError.isNotEmpty()) {
                    { Text(nameError, color = Color(0xFFEF5350)) }
                } else null,
                leadingIcon = {
                    Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF546E7A))
                },
                keyboardOptions = KeyboardOptions(
                    imeAction = ImeAction.Next
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = FieldBorderFocused,
                    unfocusedBorderColor = FieldBorder,
                    focusedContainerColor = FieldBg,
                    unfocusedContainerColor = FieldBg,
                    focusedTextColor = Color(0xFFE0F7FA),
                    unfocusedTextColor = Color(0xFFB0BEC5),
                    cursorColor = AccentCyan,
                    errorBorderColor = Color(0xFFEF5350),
                    errorContainerColor = FieldBg,
                )
            )

            // — Auth token / password field —
            OutlinedTextField(
                value = token,
                onValueChange = {
                    token = it
                    tokenError = ""
                },
                label = { Text("Auth Token", color = Color(0xFF546E7A)) },
                singleLine = true,
                isError = tokenError.isNotEmpty(),
                supportingText = if (tokenError.isNotEmpty()) {
                    { Text(tokenError, color = Color(0xFFEF5350)) }
                } else null,
                visualTransformation = if (tokenVisible) VisualTransformation.None
                else PasswordVisualTransformation(),
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF546E7A))
                },
                trailingIcon = {
                    IconButton(onClick = { tokenVisible = !tokenVisible }) {
                        Icon(
                            if (tokenVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (tokenVisible) "Hide token" else "Show token",
                            tint = Color(0xFF546E7A)
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        focusManager.clearFocus()
                        doLogin(name, token, onLogin) { n, t ->
                            nameError = n
                            tokenError = t
                        }
                    }
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = FieldBorderFocused,
                    unfocusedBorderColor = FieldBorder,
                    focusedContainerColor = FieldBg,
                    unfocusedContainerColor = FieldBg,
                    focusedTextColor = Color(0xFFE0F7FA),
                    unfocusedTextColor = Color(0xFFB0BEC5),
                    cursorColor = AccentCyan,
                    errorBorderColor = Color(0xFFEF5350),
                    errorContainerColor = FieldBg,
                )
            )

            // — Sign In button —
            Button(
                onClick = {
                    focusManager.clearFocus()
                    doLogin(name, token, onLogin) { n, t ->
                        nameError = n
                        tokenError = t
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = AccentCyan,
                    contentColor = Color(0xFF0D1117),
                    disabledContainerColor = Color(0xFF1E3A4A),
                    disabledContentColor = Color(0xFF546E7A)
                )
            ) {
                if (isLoading) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = AccentCyan,
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(
                            "Signing in...",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF546E7A)
                        )
                    }
                } else {
                    Text(
                        "Sign In",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // — Footer hint —
            Text(
                text = "Use the auth token provided by your\nCognitive VR session administrator.",
                fontSize = 11.sp,
                color = Color(0xFF37474F),
                textAlign = TextAlign.Center,
                lineHeight = 16.sp
            )
        }
    }
}

private fun doLogin(
    name: String,
    token: String,
    onLogin: (String, String) -> Unit,
    setErrors: (nameError: String, tokenError: String) -> Unit
) {
    val nameErr = if (name.isBlank()) "Name is required" else ""
    val tokenErr = if (token.isBlank()) "Auth token is required" else ""
    if (nameErr.isNotEmpty() || tokenErr.isNotEmpty()) {
        setErrors(nameErr, tokenErr)
        return
    }
    onLogin(name.trim(), token.trim())
}
