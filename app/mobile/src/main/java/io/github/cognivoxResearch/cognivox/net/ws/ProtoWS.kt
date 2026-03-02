package io.github.cognivoxResearch.cognivox.net.ws

import android.util.Log
import io.github.cognivoxResearch.cognivox.net.proto.DeviceInbound
import io.github.cognivoxResearch.cognivox.net.proto.DeviceOutbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerOutbound

open class ProtoWS<In, Out>(
    url: String, deserializer: FromMessage<In>,
) : WS<In, Out>(url, deserializer) where  Out : ToMessage<Out> {
    override fun onMessage(message: In) {
        Log.i(this.tag, "Got message $message")
    }

    override fun onDisconnect() {
        Log.i(this.tag, "Disconnected")
    }

    override fun onConnect() {
        Log.i(this.tag, "Connected")
    }
}

class DeviceWs(
    url: String,
    private val deviceName: String,
    private val auth: String,
    private val listener: Listener
) :
    ProtoWS<DeviceInbound, DeviceOutbound>(url, DeviceInbound.Companion) {
    override fun onMessage(message: DeviceInbound) {
        when (message) {
            is DeviceInbound.Err -> listener.onError(message)
            is DeviceInbound.Join -> listener.onJoinRequest(message)
            is DeviceInbound.Ok -> listener.onConnect(message)
        }
    }

    override fun onDisconnect() {
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

class GameWs(url: String) :
    ProtoWS<ServerInbound, ServerOutbound>(url, ServerInbound.Companion)