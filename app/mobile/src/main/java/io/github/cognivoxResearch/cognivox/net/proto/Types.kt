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
    val suggestion: String
)

@Serializable
data class GameSettings(
    val scene: SceneType,
    val size: Long = 1,
    val distractions: Boolean,
    @SerialName("session_type")
    val sessionType: String,
    val difficulty: AudienceDifficulty
)

@Serializable
data class GameFeatures(
    val stress: Boolean
)

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
    Stage
}


