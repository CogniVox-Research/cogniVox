package io.github.cognivoxResearch.cognivox.net.proto

import io.github.cognivoxResearch.cognivox.net.ws.Message
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.util.UUID


@Serializable
sealed class DeviceInbound {


    @Serializable
    @SerialName("ok")
    data class Ok(
        @SerialName("user_name") val userName: String,
        @Serializable(with = UUIDSerializer::class)
        @SerialName("device_id") val deviceId: UUID
    ) : DeviceInbound()


    @Serializable
    @SerialName("err")
    data class Err(
        @SerialName("data") val message: String
    ) : DeviceInbound()


    @Serializable
    @SerialName("join")
    data class Join(
        @Serializable(with = UUIDSerializer::class)
        @SerialName("session_id") val sessionId: UUID
    ) : DeviceInbound()

    companion object : Message.From<DeviceInbound> {
        @OptIn(ExperimentalSerializationApi::class)
        @JvmStatic
        override fun fromMessage(message: Message): DeviceInbound {
            val json = Json {
                classDiscriminator = "type"
            }

            return when (message) {
                is Message.Text -> json.decodeFromString(
                    flatten(serializer()),
                    message.text
                )

                else -> throw RuntimeException("Unexpected byte message")
            }
        }
    }
}




