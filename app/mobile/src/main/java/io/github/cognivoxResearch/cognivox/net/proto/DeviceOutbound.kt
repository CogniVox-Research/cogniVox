package io.github.cognivoxResearch.cognivox.net.proto


import io.github.cognivoxResearch.cognivox.net.ws.Message
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json


@Serializable
sealed class DeviceOutbound : Message.To<DeviceOutbound> {

    @Serializable
    @SerialName("connect")
    data class Connect(
        @SerialName("device_name") val deviceName: String,
    ) : DeviceOutbound()

    override fun toMessage(): Message {
        val json = Json { classDiscriminator = "type" }
        return when (this) {
            else -> Message.Text(json.encodeToString(flatten(serializer()), this))
        }
    }
}