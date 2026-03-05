package io.github.cognivoxResearch.cognivox.net.ws

import okio.ByteString

/**
 * A message sent or received by the websocket.
 */
sealed class Message {
    class Bytes(val bytes: ByteString) : Message()
    class Text(val text: String) : Message()

    override fun toString(): String = when (this) {
        is Bytes -> "[${this.bytes.size} Bytes]"
        is Text -> this.text
    }

    interface From<T> {
        fun fromMessage(message: Message): T
    }

    interface To<T> {
        fun toMessage(): Message
    }
}

