package io.github.cognivoxResearch.cognivox.wear

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.Wearable
import kotlinx.serialization.json.Json

class BiometricsTransmitter(private val context: Context) {
    fun transmitFeatures(dto: HSRVDto) {
        val jsonString = Json.encodeToString(dto)
        Log.d(TAG, "Preparing to send biometrics payload: $jsonString")
        val data = jsonString.encodeToByteArray()

        Wearable.getNodeClient(context).connectedNodes.addOnSuccessListener { nodes ->
            if (nodes.isEmpty()) {
                Log.w(TAG, "No connected nodes found to send biometrics data!")
            } else {
                Log.d(TAG, "Found ${nodes.size} connected nodes. Sending data...")
            }

            for (node in nodes) {
                Log.d(TAG, "Attempting to send to node: ${node.id} (${node.displayName})")
                Wearable.getMessageClient(context).sendMessage(node.id, "/cg_biometrics", data)
                    .addOnSuccessListener { Log.d(TAG, "Features sent successfully to node ${node.id}") }
                    .addOnFailureListener { e -> Log.e(TAG, "Message failed to send to node ${node.id}: ${e.message}") }
            }
        }.addOnFailureListener { e ->
            Log.e(TAG, "Failed to get connected nodes: ${e.message}")
        }
    }

    companion object {
        const val TAG = "BiometricsTransmitter"
    }
}