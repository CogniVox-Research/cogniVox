package io.github.cognivoxResearch.cognivox.net.proto

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonTransformingSerializer
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.UUID


/**
 * Converts JSON from {"type": ..., "data":  {"a": ...}} to {"type": ..., "a": ....}
 */
inline fun <reified T : Any> flatten(s: KSerializer<T>): KSerializer<T> =
    object : JsonTransformingSerializer<T>(s) {
        override fun transformDeserialize(element: JsonElement): JsonElement {
            val obj = element.jsonObject
            val typeName = obj["type"]?.jsonPrimitive
                ?: throw SerializationException("Missing 'type'")
            val data = obj["data"]?.jsonObject
                ?: throw SerializationException("Missing 'data'")
            return JsonObject(data + Pair("type", typeName))
        }

        override fun transformSerialize(element: JsonElement): JsonElement {
            val obj = element.jsonObject
            val typeName = obj["type"]?.jsonPrimitive
                ?: throw SerializationException("Missing 'type'")

            return buildJsonObject {
                put("type", typeName)
                put("data", JsonObject(obj - "type"))
            }
        }
    }

object UUIDSerializer : KSerializer<UUID> {
    override val descriptor = PrimitiveSerialDescriptor("UUID", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): UUID {
        return UUID.fromString(decoder.decodeString())
    }

    override fun serialize(encoder: Encoder, value: UUID) {
        encoder.encodeString(value.toString())
    }
}