package io.github.cognivoxResearch.cognivox.net.ws

import android.util.Log
import io.github.cognivoxResearch.cognivox.RETRY_DELAY
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString


abstract class WebSocket<In, Out>(
    private val scope: CoroutineScope,
    private var url: String,
    private val deserializer: Message.From<In>,
    private val client: OkHttpClient = getWebsocketClient(),
    private val canRetry: Boolean = true,
    private val ignoreDeserializeErrors: Boolean = true,
) where  Out : Message.To<Out> {
    private var websocket: WebSocket? = null
    private var isClosed = false

    val tag: String = this::class.java.simpleName

    private val listener = object : WebSocketListener() {
        /**
         * Get text message from websocket and parse it.
         */
        override fun onMessage(webSocket: WebSocket, text: String) {
            if (isClosed) return

            val parsed = try {
                deserializer.fromMessage(Message.Text(text))
            } catch (e: Exception) {
                if (!ignoreDeserializeErrors) {
                    onFailure(webSocket, e, null)
                    return
                }

                Log.e(tag, "Websocket: Error: Failed to parse: $text", e)
                return
            }

            Log.i(tag, "Websocket: Received: $parsed")
            onMessage(parsed)
        }

        /**
         * Get binary message from websocket and parse it.
         */
        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            if (isClosed) return

            val parsed = try {
                deserializer.fromMessage(Message.Bytes(bytes))
            } catch (e: Exception) {
                if (!ignoreDeserializeErrors) {
                    onFailure(webSocket, e, null)
                    return
                }

                Log.e(tag, "Websocket: Error: Failed to parse bytes", e)
                return
            }
            Log.d(tag, "Websocket: Received: ${bytes.size} bytes")
            onMessage(parsed)
        }

        /**
         * Handles the ws closing or receiving an unparsable message.
         * The websocket connection is closed.
         */
        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            if (isClosed) return

            super.onFailure(webSocket, t, response)
            Log.e(tag, "Websocket: Error: $t")

            disconnect()

            onDisconnect(t, response)
            isClosed = false

            scope.launch {
                reconnectWithDelay()
            }
        }

        /**
         * Handles the connection starting.
         */
        override fun onOpen(webSocket: WebSocket, response: Response) {
            if (isClosed) return

            super.onOpen(webSocket, response)
            Log.d(tag, "Websocket: Connection opened")

            onConnect()
        }
    }

    protected abstract fun onMessage(message: In)

    protected abstract fun onDisconnect(t: Throwable, response: Response?)

    protected abstract fun onConnect()


    /**
     * Connects to the server.
     * This does nothing if called after disconnect(), use reconnect() instead.
     */
    fun connect() {
        if (websocket != null) return
        if (isClosed) return

        scope.launch {
            withContext(Dispatchers.IO) {
                Log.d(tag, "Connecting to $url")
                val request = Request.Builder().url(url).build()
                websocket = client.newWebSocket(request, listener)
            }
        }
    }

    /**
     * Sends the given message over the websocket
     */
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


    /**
     * Disconnects the websocket connection.
     * */
    fun disconnect() {
        websocket?.close(1000, "Force Disconnect")
        websocket = null
        isClosed = true
    }

    /**
     * Reconnects to the socket.
     * If a connection already exists, it is closed.
     */
    fun reconnect() {
        disconnect()

        isClosed = false

        connect()
    }

    /**
     * Attempts to reconnect with the server.
     * This continuously retries until the connection succeeds or disconnect() is called.
     */
    private suspend fun reconnectWithDelay() {
        if (!canRetry) {
            return this.disconnect()
        }

        Log.d(tag, "Reconnecting in $RETRY_DELAY ms...")
        withContext(Dispatchers.IO) {
            delay(RETRY_DELAY)
            connect()
        }
    }

    companion object {
        val wsClient = OkHttpClient.Builder().build()

        fun getWebsocketClient() = wsClient
    }
}


