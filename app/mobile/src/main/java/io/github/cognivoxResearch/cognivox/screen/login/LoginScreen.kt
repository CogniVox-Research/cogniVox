package io.github.cognivoxResearch.cognivox.screen.login

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val BgGradient = Brush.verticalGradient(
    listOf(Color(0xFF0D1117), Color(0xFF0E1A32), Color(0xFF0D1117))
)
private val Cyan = Color(0xFF00E5FF)
private val FieldBg = Color(0xFF0F1923)
private val FieldStroke = Color(0xFF1E3050)

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

    Box(
        modifier = Modifier.background(BgGradient).fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp),
            verticalArrangement = Arrangement.Bottom
        ) {

            // ── Top label block ──────────────────────────────────
            Spacer(Modifier.weight(1f))

            Text(
                text = "Welcome back",
                fontSize = 13.sp,
                color = Cyan,
                fontWeight = FontWeight.Medium,
                letterSpacing = 1.5.sp
            )

            Spacer(Modifier.height(6.dp))

            Text(
                text = "Sign in to\nCogniVox",
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFE8F4F8),
                lineHeight = 42.sp
            )

            Spacer(Modifier.height(8.dp))

            HorizontalDivider(
                modifier = Modifier.width(48.dp),
                thickness = 3.dp,
                color = Cyan
            )

            Spacer(Modifier.weight(1f))

            // ── Form ─────────────────────────────────────────────

            // Name field
            if (nameError.isNotEmpty()) {
                Text(nameError, color = Color(0xFFEF5350), fontSize = 11.sp,
                    modifier = Modifier.padding(bottom = 2.dp))
            }
            OutlinedTextField(
                value = name,
                onValueChange = { name = it; nameError = "" },
                label = { Text("Your name") },
                singleLine = true,
                isError = nameError.isNotEmpty(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = fieldColors()
            )

            Spacer(Modifier.height(14.dp))

            // Token field
            if (tokenError.isNotEmpty()) {
                Text(tokenError, color = Color(0xFFEF5350), fontSize = 11.sp,
                    modifier = Modifier.padding(bottom = 2.dp))
            }
            OutlinedTextField(
                value = token,
                onValueChange = { token = it; tokenError = "" },
                label = { Text("Auth token") },
                singleLine = true,
                isError = tokenError.isNotEmpty(),
                visualTransformation = if (tokenVisible) VisualTransformation.None
                                       else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { tokenVisible = !tokenVisible }) {
                        Icon(
                            if (tokenVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = null,
                            tint = Color(0xFF546E7A)
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
                shape = RoundedCornerShape(10.dp),
                colors = fieldColors()
            )

            Spacer(Modifier.height(28.dp))

            // Sign in button
            Button(
                onClick = {
                    focusManager.clearFocus()
                    attempt(name, token, onLogin) { n, t -> nameError = n; tokenError = t }
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Cyan,
                    contentColor = Color(0xFF0D1117),
                    disabledContainerColor = Color(0xFF1A2A38),
                    disabledContentColor = Color(0xFF455A64)
                )
            ) {
                if (isLoading) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(Modifier.size(16.dp), color = Cyan, strokeWidth = 2.dp)
                        Spacer(Modifier.width(10.dp))
                        Text("Signing in...", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                } else {
                    Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 15.sp, letterSpacing = 0.5.sp)
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Cyan,
    unfocusedBorderColor = FieldStroke,
    focusedContainerColor = FieldBg,
    unfocusedContainerColor = FieldBg,
    focusedTextColor = Color(0xFFE0F7FA),
    unfocusedTextColor = Color(0xFFB0BEC5),
    focusedLabelColor = Cyan,
    unfocusedLabelColor = Color(0xFF546E7A),
    cursorColor = Cyan,
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
