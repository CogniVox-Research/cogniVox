package io.github.cognivoxResearch.cognivox.service

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import com.google.gson.Gson
import io.github.cognivoxResearch.cognivox.game.GameController
import io.github.cognivoxResearch.cognivox.net.dto.FeatureInput

class HRVReceiverService : WearableListenerService() {


    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("HRVReceiverService", "Message received path: ${messageEvent.path}")

        if (messageEvent.path == "/biometrics") {
            val json = messageEvent.data.decodeToString()
            Log.d("HRVReceiverService", "Raw JSON received: $json")
            val input: FeatureInput = Gson().fromJson(json, FeatureInput::class.java)
            Log.d("HRVReceiver", "Rx Data: $input")

            GameController.Instance?.onHRVReceived(input)
        } else {
            Log.e("HRVReceiverService", "Unexpected message ${messageEvent.path}")
        }
    }
}