package io.github.cognivoxResearch.cognivox.net.proto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
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

    /**
     * Server side error – the data field contains an arbitrary message.
     */
    @Serializable
    @SerialName("err")
    data class Err(
        @SerialName("data") val message: String
    ) : DeviceInbound()

    /**
     * Request to join a game session – the client provides the UUID of
     * the session it wants to enter.
     */
    @Serializable
    @SerialName("join")
    data class Join(
        /** UUID of the session to join. */
        @Serializable(with = UUIDSerializer::class)
        @SerialName("session_id") val sessionId: UUID
    ) : DeviceInbound()
}