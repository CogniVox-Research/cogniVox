package io.github.cognivoxResearch.cognivox.net

import okhttp3.OkHttpClient


val wsClient = OkHttpClient.Builder().build()

fun getWebsocketClient() = wsClient