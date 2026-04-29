package io.github.cognivoxResearch.cognivox.net.proto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
@SerialName("stress_response")
data class StressResponse(
    @SerialName("model_used")
    val modelUsed: String,
    val label: Long,
    @SerialName("stress_score")
    val stressScore: Double,
    val suggestion: String,
    val feedback: String
)

@Serializable
data class GameSettings(
    val scene: SceneType,
    val size: Int = 1,
    val distractions: Boolean,
    val difficulty: AudienceDifficulty,
    val qa: Boolean
)

@Serializable
data class GameFeatures(
    val stress: Boolean,
    @SerialName("audio_format")
    val audioFormat: AudioFormat
)

@Serializable
enum class AudioFormat {
    @SerialName("pcmf32")
    PCMF32,

    @SerialName("webm")
    WebM,

}

@Serializable
enum class AudienceDifficulty {
    @SerialName("easy")
    EASY,

    @SerialName("medium")
    MEDIUM,

    @SerialName("hard")
    HARD
}

@Serializable
enum class SceneType {
    @SerialName("interview")
    Interview,

    @SerialName("board_room")
    BoardRoom,

    @SerialName("stage")
    Stage;

    fun getIdent(): String {
        return when (this) {
            Interview -> "interview"
            BoardRoom -> "boardroom"
            Stage -> "stage"
        }
    }
}


