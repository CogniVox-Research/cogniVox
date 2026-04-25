package io.github.cognivoxResearch.cognivox.wear

import android.content.Context
import android.util.Log
import com.samsung.android.service.health.tracking.ConnectionListener
import com.samsung.android.service.health.tracking.HealthTracker
import com.samsung.android.service.health.tracking.HealthTrackerException
import com.samsung.android.service.health.tracking.HealthTrackingService
import com.samsung.android.service.health.tracking.data.DataPoint
import com.samsung.android.service.health.tracking.data.HealthTrackerType
import com.samsung.android.service.health.tracking.data.ValueKey

class HealthSensorManager(
    private val context: Context,
    private val onIbiData: (Double) -> Unit,
    private val onPpgData: (Double) -> Unit,
    private val onConnected: () -> Unit,
    private val onError: (String) -> Unit
) {
    private lateinit var healthTrackingService: HealthTrackingService
    private var hrTracker: HealthTracker? = null
    private var ppgTracker: HealthTracker? = null

    private val connectionListener = object : ConnectionListener {
        override fun onConnectionSuccess() {
            Log.d(TAG, "Connected to HealthTrackingService")
            onConnected()
            startTracking()
        }

        override fun onConnectionEnded() {
            Log.d(TAG, "Connection to HealthTrackingService ended")
        }

        override fun onConnectionFailed(e: HealthTrackerException?) {
            Log.e(TAG, "Connection failed: ${e?.message}")
            onError("Sensor Connection Failed: ${e?.message}")
        }
    }

    private val hrTrackerEventListener = object : HealthTracker.TrackerEventListener {
        override fun onDataReceived(dataPoints: List<DataPoint>) {
            for (dataPoint in dataPoints) {
                processHrDataPoint(dataPoint)
            }
        }

        override fun onFlushCompleted() {}
        override fun onError(e: HealthTracker.TrackerError?) {
            Log.e(TAG, "HR Tracker error: $e")
        }
    }

    private val ppgTrackerEventListener = object : HealthTracker.TrackerEventListener {
        override fun onDataReceived(dataPoints: List<DataPoint>) {
            for (dataPoint in dataPoints) {
                processPpgDataPoint(dataPoint)
            }
        }

        override fun onFlushCompleted() {}
        override fun onError(e: HealthTracker.TrackerError?) {
            Log.e(TAG, "PPG Tracker error: $e")
        }
    }

    fun connect() {
        healthTrackingService = HealthTrackingService(connectionListener, context)
        healthTrackingService.connectService()
    }

    fun disconnect() {
        hrTracker?.unsetEventListener()
        ppgTracker?.unsetEventListener()
        if (::healthTrackingService.isInitialized) {
            healthTrackingService.disconnectService()
        }
    }

    private fun startTracking() {
        try {
            // Heart Rate Continuous Tracker
            hrTracker = healthTrackingService.getHealthTracker(HealthTrackerType.HEART_RATE_CONTINUOUS)
            hrTracker?.setEventListener(hrTrackerEventListener)
            Log.d(TAG, "Heart Rate Continuous tracker started")

            // PPG Green Tracker for BVP features
            try {
                ppgTracker = healthTrackingService.getHealthTracker(HealthTrackerType.PPG_GREEN)
                ppgTracker?.setEventListener(ppgTrackerEventListener)
                Log.d(TAG, "PPG Green tracker started for BVP data")
            } catch (e: Exception) {
                Log.e(TAG, "PPG Tracker not supported or error: ${e.message}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Tracker error: ${e.message}")
            onError("Tracker Error: ${e.message}")
        }
    }

    private fun processHrDataPoint(dataPoint: DataPoint) {
        try {
            val hr = dataPoint.getValue(ValueKey.HeartRateSet.HEART_RATE) as Int
            WearDataRepository.updateHeartRate(hr)
            Log.d(TAG, "Heart Rate: $hr")
        } catch (e: Exception) {
            // Ignore if key not found or casting error
        }

        val ibiList = dataPoint.getValue(ValueKey.HeartRateSet.IBI_LIST)
        
        val samples: List<Number> = when (ibiList) {
            is List<*> -> ibiList.filterIsInstance<Number>()
            is Number -> listOf(ibiList)
            else -> emptyList()
        }
        
        for (sample in samples) {
            onIbiData(sample.toDouble())
        }
    }

    private fun processPpgDataPoint(dataPoint: DataPoint) {
        try {
            val ppgValue = dataPoint.getValue(ValueKey.PpgGreenSet.PPG_GREEN) as Int
            onPpgData(ppgValue.toDouble())
        } catch (e: Exception) {
            // Ignore if extraction fails
        }
    }

    companion object {
        const val TAG = "HealthSensorManager"
    }
}
