package io.github.cognivoxResearch.cognivox.screen.login

sealed class LoginState {
    /** User hasn't logged in yet — shows the login form. */
    object Unauthenticated : LoginState()

    /** Login in progress (e.g. validating / storing token). */
    object Loading : LoginState()

    /** Successfully logged in — carries the stored credentials. */
    data class Authenticated(val name: String, val authToken: String) : LoginState()
}