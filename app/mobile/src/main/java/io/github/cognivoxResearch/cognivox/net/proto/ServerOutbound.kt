package io.github.cognivoxResearch.cognivox.net.proto

import io.github.cognivoxResearch.cognivox.net.dto.FeatureInput
import io.github.cognivoxResearch.cognivox.net.ws.Message
import io.github.cognivoxResearch.cognivox.net.ws.ToMessage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okio.ByteString.Companion.toByteString


@Serializable
sealed class ServerOutbound : ToMessage<ServerOutbound> {

    @Serializable
    @SerialName("audio")
    data class Audio(val data: ByteArray) : ServerOutbound() {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (javaClass != other?.javaClass) return false

            other as Audio

            return data.contentEquals(other.data)
        }

        override fun hashCode(): Int {
            return data.contentHashCode()
        }
    }

    @Serializable
    @SerialName("ready")
    data class Ready(val data: GameFeatures) : ServerOutbound()

    @Serializable
    @SerialName("speech_start")
    object SpeechStart : ServerOutbound()

    @Serializable
    @SerialName("stress")
    data class Stress(val data: FeatureInput) : ServerOutbound()

    @Serializable
    @SerialName("speech_end")
    object SpeechEnd : ServerOutbound()

    @Serializable
    @SerialName("question_start")
    object QuestionStart : ServerOutbound()

    @Serializable
    @SerialName("question_end")
    object QuestionEnd : ServerOutbound()


    override fun toMessage(): Message {
        val json = Json { classDiscriminator = "type" }
        return when (this) {
            is Audio -> Message.Bytes(this.data.toByteString())
            else -> Message.Text(json.encodeToString(flatten(serializer()), this))
        }
    }
}


