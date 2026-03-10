package io.github.cognivoxResearch.cognivox.net.ws

import io.github.cognivoxResearch.cognivox.getSessionURL
import io.github.cognivoxResearch.cognivox.net.proto.ServerInbound
import io.github.cognivoxResearch.cognivox.net.proto.ServerOutbound
import kotlinx.coroutines.CoroutineScope
import okhttp3.Response

class GameWebSocket(
    scope: CoroutineScope,
    hostname: String,
    sessionId: String,
    private var listener: Listener? = null
) :
    WebSocket<ServerInbound, ServerOutbound>(
        scope,
        url = getSessionURL(hostname, sessionId),
        deserializer = ServerInbound.Companion,
        canRetry = false,
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