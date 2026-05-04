package io.github.cognivoxResearch.cognivox.service

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import io.github.cognivoxResearch.cognivox.game.GameController

class WatchTapService : WearableListenerService() {


    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("Watch Tap Service", "Message received path: ${messageEvent.path}")

        if (messageEvent.path == "/double_tap") {
            GameController.Instance?.onDoubleWatchTap()
        } else {
            Log.e("HRVReceiverService", "Unexpected message ${messageEvent.path}")
        }
    }
}