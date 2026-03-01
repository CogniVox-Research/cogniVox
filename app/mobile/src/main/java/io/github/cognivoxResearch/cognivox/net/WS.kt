package io.github.cognivoxResearch.cognivox.net

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.*
import okio.ByteString

const val  RETRY_DELAY = 5000L
abstract class WS(private val client: OkHttpClient, private val url: String) {
    private var websocket: WebSocket? = null
    private var isConnected = false

    val tag: String = this::class.java.simpleName

    private val listener = object : WebSocketListener() {
        override fun onMessage(webSocket: WebSocket, text: String) {
            super.onMessage(webSocket, text)
            Log.d(tag, "Received: $text")
            onMessage(Message.Text(text))
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            super.onMessage(webSocket, bytes)
            Log.d(tag, "Received: bytes")
            onMessage(Message.Bytes(bytes))
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            super.onFailure(webSocket, t, response)
            Log.e(tag, "Failure: ${t.message}")

            websocket = null
            isConnected = false;
            runBlocking {
                reconnectWithBackoff()
            }
        }

        override fun onOpen(webSocket: WebSocket, response: Response) {
            super.onOpen(webSocket, response)
            Log.d(tag, "Connection opened")
            isConnected = true;
        }
    }

    abstract  fun onMessage(message: Message)

    suspend  fun connect() {
        if (websocket != null) return

        withContext(Dispatchers.IO) {
            Log.d(tag, "Connecting...")
            val request = Request.Builder().url(url).build()
            websocket = client.newWebSocket(request, listener)
        }
    }

    protected fun send(message: Message) {
        val sent = when (message) {
            is Message.Text -> websocket?.send(message.text)
            is Message.Bytes -> websocket?.send(message.bytes)
        } ?: throw RuntimeException("Socket is closed")

        if (!sent) throw RuntimeException("Failed to send")
    }


    fun disconnect() {
        websocket?.close(1000, "Force Disconnect")
        websocket = null
        isConnected = false
    }

    private suspend  fun reconnectWithBackoff() {
        Log.d(tag, "Reconnecting in $RETRY_DELAY ms...")
        withContext(Dispatchers.IO) {
            delay(RETRY_DELAY)
            connect()
        }
    }
}

sealed class Message{
    class Bytes(val bytes: ByteString): Message()
    class Text(val text: String): Message()

    override fun toString(): String = when(this) {
        is Bytes -> "[${this.bytes.size} Bytes]"
        is Text -> this.text
    }
}


class TestSocket(client: OkHttpClient, url: String): WS(client , url){
    override fun onMessage(message: Message) {
        Log.i(this.tag, "Got message $message")
    }

}