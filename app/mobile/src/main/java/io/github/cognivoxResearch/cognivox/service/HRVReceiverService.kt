package io.github.cognivoxResearch.cognivox.service

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import com.google.gson.Gson
import io.github.cognivoxResearch.cognivox.FeatureInput
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

class HRVReceiverService : WearableListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("HRVReceiverService", "Message received path: ${messageEvent.path}")

        if (messageEvent.path == "/biometrics") {
            val json = messageEvent.data.decodeToString()
            val input: FeatureInput = Gson().fromJson(json, FeatureInput::class.java);
            Log.d("HRVReceiver", "Rx Data: $input")


            // TODO: send to backend


        }else{
            Log.e("HRVReceiverService", "Unexpected message ${messageEvent.path}")
        }
    }
}