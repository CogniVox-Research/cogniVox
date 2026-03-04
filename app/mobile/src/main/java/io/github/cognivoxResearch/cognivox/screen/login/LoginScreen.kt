package io.github.cognivoxResearch.cognivox.screen.login

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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

private val Blue        = Color(0xFF4A90E2)
private val Purple      = Color(0xFF9B6EFF)
private val BrandGrad   = Brush.linearGradient(listOf(Blue, Purple))
private val BgColor     = Color(0xFFF4F6FF)
private val SurfaceWht  = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSub     = Color(0xFF7A7A9A)
private val FieldBg     = Color(0xFFF7F7FE)
private val FieldStroke = Color(0xFFD8D5EE)

@Preview(showBackground = true, backgroundColor = 0xFFF4F6FF)
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgColor)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {

        Spacer(Modifier.height(48.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(SurfaceWht)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            // ── Logo inside card ───────────────────────────────────
            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(BrandGrad)
                )
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .background(SurfaceWht),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(R.drawable.app_icon),
                        contentDescription = "CogniVox",
                        modifier = Modifier.size(46.dp)
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            Text("CogniVox", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Cognitive VR Platform", fontSize = 11.sp, color = TextSub)

            Spacer(Modifier.height(20.dp))

            // Left-align the rest of the form
            Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.Start) {

            Text("Sign In", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Welcome back!", fontSize = 13.sp, color = TextSub,
                modifier = Modifier.padding(top = 2.dp, bottom = 20.dp))

            // Name
            Text("Name", fontSize = 12.sp, color = TextSub, fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(bottom = 4.dp))
            OutlinedTextField(
                value = name,
                onValueChange = { name = it; nameError = "" },
                placeholder = { Text("Your name", color = Color(0xFFBBBBCC), fontSize = 14.sp) },
                singleLine = true,
                isError = nameError.isNotEmpty(),
                supportingText = if (nameError.isNotEmpty()) {
                    { Text(nameError, color = Color(0xFFD32F2F), fontSize = 11.sp) }
                } else null,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = fieldColors()
            )

            Spacer(Modifier.height(14.dp))

            // Token label row with Show/Hide
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Password", fontSize = 12.sp, color = TextSub, fontWeight = FontWeight.Medium)
                TextButton(
                    onClick = { tokenVisible = !tokenVisible },
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp)
                ) {
                    Text(
                        if (tokenVisible) "Hide" else "Show",
                        fontSize = 12.sp, color = Purple, fontWeight = FontWeight.SemiBold
                    )
                }
            }
            OutlinedTextField(
                value = token,
                onValueChange = { token = it; tokenError = "" },
                placeholder = { Text("Enter your password", color = Color(0xFFBBBBCC), fontSize = 14.sp) },
                singleLine = true,
                isError = tokenError.isNotEmpty(),
                supportingText = if (tokenError.isNotEmpty()) {
                    { Text(tokenError, color = Color(0xFFD32F2F), fontSize = 11.sp) }
                } else null,
                visualTransformation = if (tokenVisible) VisualTransformation.None
                                      else PasswordVisualTransformation(),
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

            Spacer(Modifier.height(24.dp))

            // Sign In button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (isLoading)
                            Brush.horizontalGradient(listOf(Color(0xFFBBCCEE), Color(0xFFCCBBEE)))
                        else BrandGrad
                    ),
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
                            CircularProgressIndicator(
                                Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(Modifier.width(10.dp))
                            Text("Signing in...", fontWeight = FontWeight.Bold,
                                fontSize = 15.sp, color = Color.White)
                        }
                    } else {
                        Text("Sign In", fontWeight = FontWeight.Bold,
                            fontSize = 15.sp, color = Color.White)
                    }
                }
                }
            } // end inner form Column
        } // end card Column

        Spacer(Modifier.height(16.dp))

        Text(
            "Password provided by your session administrator",
            fontSize = 11.sp, color = Color(0xFFBBBBCC), textAlign = TextAlign.Center
        )

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Purple,
    unfocusedBorderColor = FieldStroke,
    focusedContainerColor = FieldBg,
    unfocusedContainerColor = FieldBg,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    focusedLabelColor = Purple,
    unfocusedLabelColor = TextSub,
    cursorColor = Blue,
    errorBorderColor = Color(0xFFD32F2F),
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
