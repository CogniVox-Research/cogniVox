package io.github.cognivoxResearch.cognivox.util
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.Locale
import kotlin.coroutines.resume

/**
 * TextToSpeechManager - A suspend-based utility for text-to-speech operations in Android
 * Provides a coroutine-friendly interface for speaking text with proper lifecycle management
 */
class TextToSpeechManager(private val context: Context) {

    private var textToSpeech: TextToSpeech? = null
    private var isInitialized = false

    /**
     * Initialize TextToSpeech engine
     * Should be called once during application startup
     */
    suspend fun initialize(): Result<Unit> = suspendCancellableCoroutine { continuation ->
        try {
            textToSpeech = TextToSpeech(context) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    isInitialized = true
                    // Set default language to English (can be customized)
                    val result = textToSpeech?.setLanguage(Locale.ENGLISH)

                    if (result == TextToSpeech.LANG_MISSING_DATA ||
                        result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        continuation.resume(
                            Result.failure(Exception("Language not supported"))
                        )
                    } else {
                        continuation.resume(Result.success(Unit))
                    }
                } else {
                    isInitialized = false
                    continuation.resume(
                        Result.failure(Exception("TextToSpeech initialization failed"))
                    )
                }
            }
        } catch (e: Exception) {
            continuation.resume(Result.failure(e))
        }
    }

    /**
     * Speak text with customizable parameters
     *
     * @param text The text to speak
     * @param locale The language/locale for speech (default: Locale.ENGLISH)
     * @param speechRate Speed of speech (default: 1.0f, range: 0.5f - 2.0f)
     * @param pitch Pitch of voice (default: 1.0f, range: 0.5f - 2.0f)
     * @return Result containing success or failure
     */
    suspend fun speakText(
        text: String,
        locale: Locale = Locale.ENGLISH,
        speechRate: Float = 1.0f,
        pitch: Float = 1.0f
    ): Result<Unit> = suspendCancellableCoroutine { continuation ->
        try {
            // Check if TTS is initialized
            if (!isInitialized || textToSpeech == null) {
                continuation.resume(
                    Result.failure(Exception("TextToSpeech not initialized"))
                )
                return@suspendCancellableCoroutine
            }

            // Check if text is empty
            if (text.isBlank()) {
                continuation.resume(
                    Result.failure(Exception("Text cannot be empty"))
                )
                return@suspendCancellableCoroutine
            }

            // Set language/locale
            val langResult = textToSpeech?.setLanguage(locale)
            if (langResult == TextToSpeech.LANG_MISSING_DATA ||
                langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                continuation.resume(
                    Result.failure(Exception("Language not supported: ${locale.language}"))
                )
                return@suspendCancellableCoroutine
            }

            // Set speech rate and pitch
            textToSpeech?.setSpeechRate(speechRate.coerceIn(0.5f, 2.0f))
            textToSpeech?.setPitch(pitch.coerceIn(0.5f, 2.0f))

            // Set up utterance progress listener to know when speech is complete
            textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String) {
                    // Speech started
                }

                override fun onDone(utteranceId: String) {
                    // Speech completed successfully
                    continuation.resume(Result.success(Unit))
                }

                override fun onError(utteranceId: String) {
                    // Speech failed (deprecated onError)
                    continuation.resume(
                        Result.failure(Exception("TTS Error: Speech synthesis failed"))
                    )
                }

                override fun onError(utteranceId: String, errorCode: Int) {
                    // Speech failed (new API)
                    val errorMessage = when (errorCode) {
                        TextToSpeech.ERROR_SYNTHESIS -> "Synthesis failed"
                        TextToSpeech.ERROR_SERVICE -> "Service error"
                        TextToSpeech.ERROR_NETWORK -> "Network error"
                        TextToSpeech.ERROR_INVALID_REQUEST -> "Invalid request"
                        TextToSpeech.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                        else -> "Unknown error: $errorCode"
                    }
                    continuation.resume(
                        Result.failure(Exception("TTS Error: $errorMessage"))
                    )
                }

                // For API 21+
                override fun onStop(utteranceId: String, interrupted: Boolean) {
                    if (interrupted) {
                        continuation.resume(
                            Result.failure(Exception("Speech interrupted"))
                        )
                    }
                }
            })

            val utteranceId = "tts_utterance_${System.currentTimeMillis()}"

            // Speak the text with appropriate parameter format for API level
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                val params = Bundle().apply {
                    putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                }
                textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, params)
            } else {
                @Suppress("DEPRECATION")
                val params = HashMap<String, String>().apply {
                    put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                }
                @Suppress("DEPRECATION")
                textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, params)
            }

        } catch (e: Exception) {
            continuation.resume(Result.failure(e))
        }
    }

    /**
     * Stop ongoing speech
     */
    fun stop() {
        try {
            textToSpeech?.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Shutdown TextToSpeech engine and release resources
     * Should be called when done with TTS (e.g., in onDestroy)
     */
    fun shutdown() {
        try {
            textToSpeech?.stop()
            textToSpeech?.shutdown()
            textToSpeech = null
            isInitialized = false
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Check if TextToSpeech is initialized
     */
    fun isReady(): Boolean = isInitialized && textToSpeech != null
}