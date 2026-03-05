package io.github.cognivoxResearch.cognivox.net

import android.util.Base64
import org.json.JSONObject

fun isTokenExpired(token: String?): Boolean {
    if (token.isNullOrBlank() || token == "INVALID") return true
    
    try {
        val parts = token.split(".")
        if (parts.size != 3) return true
        
        val payload = String(Base64.decode(parts[1], Base64.URL_SAFE))
        val json = JSONObject(payload)
        
        if (!json.has("exp")) return true
        
        val exp = json.getLong("exp")
        val currentTime = System.currentTimeMillis() / 1000
        
        // Return true if the current time is past the expiration time
        return currentTime >= exp
    } catch (e: Exception) {
        return true
    }
}
