package io.github.cognivoxResearch.cognivox.net.ws

import android.util.Log
import io.github.cognivoxResearch.cognivox.RETRY_DELAY
import io.github.cognivoxResearch.cognivox.net.getWebsocketClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString


abstract class WS<In, Out>(
    private var url: String,
    private val deserializer: FromMessage<In>,
    private val client: OkHttpClient = getWebsocketClient(),
) where  Out : ToMessage<Out> {
    private var websocket: WebSocket? = null
    private var isConnected = false
    private var isClosed = false

    val tag: String = this::class.java.simpleName

    private val listener = object : WebSocketListener() {
        override fun onMessage(webSocket: WebSocket, text: String) {
            if (isClosed) return
            val parsed = try {
                deserializer.fromMessage(Message.Text(text))
            } catch (e: Exception) {
                Log.e(tag, "Failed to parse: $text", e)
                return
            }

            Log.i(tag, "Got message $parsed")
            onMessage(parsed)
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            if (isClosed) return
            val parsed = try {
                deserializer.fromMessage(Message.Bytes(bytes))
            } catch (e: Exception) {
                Log.e(tag, "Failed to bytes", e)
                return
            }
            Log.d(tag, "Received: bytes")
            onMessage(parsed)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            if (isClosed) return
            super.onFailure(webSocket, t, response)
            Log.e(tag, "Failure: $t")

            websocket = null
            isConnected = false
            onDisconnect(t, response)

            runBlocking {
                reconnectWithBackoff()
            }
        }

        override fun onOpen(webSocket: WebSocket, response: Response) {
            if (isClosed) return
            super.onOpen(webSocket, response)
            Log.d(tag, "Connection opened")
            isConnected = true
            onConnect()
        }
    }

    protected abstract fun onMessage(message: In)

    protected abstract fun onDisconnect(t: Throwable, response: Response?)

    protected abstract fun onConnect()


    suspend fun connect() {
        if (websocket != null) return
        if (isClosed) return

        withContext(Dispatchers.IO) {
            Log.d(tag, "Connecting to $url")
            val request = Request.Builder().url(url).build()
            websocket = client.newWebSocket(request, listener)
        }
    }

    fun send(out: Out) {
        val sent = when (val message = out.toMessage()) {
            is Message.Text -> {
                Log.i(tag, "Sent message ${message.text}")
                websocket?.send(message.text)
            }

            is Message.Bytes -> {
                Log.i(tag, "Sent  ${message.bytes.size} bytes")
                websocket?.send(message.bytes)
            }
        } ?: throw RuntimeException("Socket is closed")

        if (!sent) throw RuntimeException("Failed to send")
    }


    fun disconnect() {
        websocket?.close(1000, "Force Disconnect")
        websocket = null
        isConnected = false
        isClosed = true
    }

    suspend fun reconnect() {
        isClosed = false
        connect()
    }

    private suspend fun reconnectWithBackoff() {
        Log.d(tag, "Reconnecting in $RETRY_DELAY ms...")
        withContext(Dispatchers.IO) {
            delay(RETRY_DELAY)
            connect()
        }
    }
}


