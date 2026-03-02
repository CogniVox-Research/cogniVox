package io.github.cognivoxResearch.cognivox.net.ws

import okio.ByteString

sealed class Message {
    class Bytes(val bytes: ByteString) : Message()
    class Text(val text: String) : Message()

    override fun toString(): String = when (this) {
        is Bytes -> "[${this.bytes.size} Bytes]"
        is Text -> this.text
    }
}

interface FromMessage<T> {
    fun fromMessage(message: Message): T
}

interface ToMessage<T> {
    fun toMessage(): Message
}