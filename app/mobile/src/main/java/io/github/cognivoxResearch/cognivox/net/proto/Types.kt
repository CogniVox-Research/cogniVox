package io.github.cognivoxResearch.cognivox.net.proto

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
@SerialName("stress_response")
data class StressResponse(
    val modelUsed: String,
    val label: Long,
    val stressScore: Double,
    val suggestion: String
)

@Serializable
data class GameSettings(
    @SerialName("scene")
    val scene: SceneType,

    val distractions: Boolean,

    val difficulty: AudienceDifficulty
)

@Serializable
data class GameFeatures(
    val stress: Boolean
)

@Serializable
enum class AudienceDifficulty {
    @SerialName("easy")   EASY,
    @SerialName("medium") MEDIUM,
    @SerialName("hard") HARD
}

@Serializable
sealed class SceneType {

    @Serializable
    @SerialName("interview")
    object Interview : SceneType()

    @Serializable
    @SerialName("board_room")
    data class BoardRoom(val size: Long) : SceneType()

    @Serializable
    @SerialName("stage")
    data class Stage(val size: Long) : SceneType()
}
