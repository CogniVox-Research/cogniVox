package io.github.cognivoxResearch.cognivox.net.ws

import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerOutbound
import okhttp3.Response

class GameWebSocket(
    url: String,
    private var listener: Listener? = null
) :
    WebSocket<ServerInbound, ServerOutbound>(
        url, ServerInbound.Companion,
        retry = false,
        ignoreDeserializeErrors = false
    ) {
    override fun onMessage(message: ServerInbound) {
        listener?.onMessage(message)
    }

    override fun onDisconnect(t: Throwable, response: Response?) {
        listener?.onDisconnect(t, response)
    }

    override fun onConnect() {
        listener?.onConnect()
    }

    fun setListener(l: Listener) {
        this.listener = l
    }

    interface Listener {
        fun onMessage(message: ServerInbound)
        fun onConnect()
        fun onDisconnect(t: Throwable, response: Response?)
    }
}