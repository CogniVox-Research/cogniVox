package io.github.cognivoxResearch.cognivox.net.proto

import io.github.cognivoxResearch.cognivox.net.ws.Message
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
sealed class ServerInbound {

    @Serializable
    @SerialName("init")
    data class Init(val data: GameSettings) : ServerInbound()

    @Serializable
    @SerialName("stress")
    data class Stress(val data: StressResponse) : ServerInbound()

    @Serializable
    @SerialName("stuck")
    object Stuck : ServerInbound()

    @Serializable
    @SerialName("unstuck")
    object Unstuck : ServerInbound()

    @Serializable
    @SerialName("stuck_suggestion")
    data class StuckSuggestion(val data: String) : ServerInbound()

    @Serializable
    @SerialName("question")
    data class Question(val data: String) : ServerInbound()

    @Serializable
    @SerialName("audience_interest")
    data class AudienceInterest(val data: Double) : ServerInbound()

    @Serializable
    @SerialName("answer_end")
    object AnswerEnd : ServerInbound()

    @Serializable
    @SerialName("error")
    data class Error(val data: String) : ServerInbound()

    @Serializable
    @SerialName("end")
    object End : ServerInbound()
    companion object : Message.From<ServerInbound> {
        override fun fromMessage(message: Message): ServerInbound {
            val json = Json { classDiscriminator = "type" }

            return when (message) {
                is Message.Text -> json.decodeFromString(serializer(), message.text)
                else -> throw RuntimeException("Unexpected byte message")
            }
        }
    }
}