package io.github.cognivoxResearch.cognivox

const val API_HOST = "192.168.1.100:8004"
const val DEVICE_URL = "ws/device"
const val SESSION_URL = "ws/game"
const val RETRY_DELAY = 5000L

const val PREF_TAG = "CG"


fun getSessionURL(hostname: String, sessionId: String) = "ws://$hostname/$SESSION_URL/$sessionId"
fun getDeviceURL(hostname: String) = "ws://$hostname/$DEVICE_URL"