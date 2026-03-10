package io.github.cognivoxResearch.cognivox.net.ws

import io.github.cognivoxResearch.cognivox.net.proto.DeviceInbound
import io.github.cognivoxResearch.cognivox.net.proto.DeviceOutbound
import kotlinx.coroutines.CoroutineScope
import okhttp3.Response

class DeviceWebSocket(
    scope: CoroutineScope,
    url: String,
    private val deviceName: String,
    private val auth: String,
    private val listener: Listener
) :
    WebSocket<DeviceInbound, DeviceOutbound>(
        scope,
        url,
        DeviceInbound.Companion,
        canRetry = true,
        ignoreDeserializeErrors = true
    ) {
    override fun onMessage(message: DeviceInbound) {
        when (message) {
            is DeviceInbound.Err -> listener.onError(message)
            is DeviceInbound.Join -> listener.onJoinRequest(message)
            is DeviceInbound.Ok -> listener.onConnect(message)
        }
    }

    override fun onDisconnect(t: Throwable, response: Response?) {
        listener.onDisconnect()
    }

    override fun onConnect() {
        send(DeviceOutbound.Connect(deviceName, auth))
    }

    interface Listener {
        fun onJoinRequest(join: DeviceInbound.Join)
        fun onConnect(con: DeviceInbound.Ok)
        fun onError(err: DeviceInbound.Err)
        fun onDisconnect()
    }
}