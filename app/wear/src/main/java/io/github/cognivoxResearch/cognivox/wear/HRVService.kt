package io.github.cognivoxResearch.cognivox.wear

import android.R
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.widget.Toast
import com.google.android.gms.wearable.Wearable
import com.samsung.android.service.health.tracking.ConnectionListener
import com.samsung.android.service.health.tracking.HealthTracker
import com.samsung.android.service.health.tracking.HealthTrackerException
import com.samsung.android.service.health.tracking.HealthTrackingService
import com.samsung.android.service.health.tracking.data.DataPoint
import com.samsung.android.service.health.tracking.data.HealthTrackerType
import com.samsung.android.service.health.tracking.data.ValueKey
import kotlinx.serialization.json.Json
import java.nio.ByteBuffer
import kotlin.math.pow
import kotlin.math.sqrt

class HRVService : Service() {

    private lateinit var healthTrackingService: HealthTrackingService
    private var hrTracker: HealthTracker? = null
    private var ppgTracker: HealthTracker? = null
    
    private lateinit var sensorManager: SensorManager
    private var accSensor: Sensor? = null
    
    private val ibiWindow = ArrayDeque<Double>()
    private val accWindow = ArrayDeque<Double>()
    private val bvpWindow = ArrayDeque<Double>()
    
    private val WINDOW_SIZE = 30 // Keep 30 IBIs for RMSSD
    private val BVP_WINDOW_SIZE = 500 // Approx 20 seconds at 25Hz
    private var lastTransmissionTime = 0L
    private val connectionListener = object : ConnectionListener {
        override fun onConnectionSuccess() {
            Log.d(TAG, "Connected to HealthTrackingService")
            showToast("Connected to Sensor")
            
            // List all available trackers to debug
            try {
                val capabilities = healthTrackingService.trackingCapability.supportHealthTrackerTypes
                Log.d(TAG, "--- AVAILABLE TRACKERS ---")
                for (type in capabilities) {
                    Log.d(TAG, "Tracker Type: $type")
                }
                Log.d(TAG, "--------------------------")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to list capabilities: ${e.message}")
            }

            startTracking()
        }

        override fun onConnectionEnded() {
            Log.d(TAG, "Connection to HealthTrackingService ended")
        }

        override fun onConnectionFailed(e: HealthTrackerException?) {
            Log.e(TAG, "Connection failed: ${e?.message}")
            showToast("Sensor Connection Failed: ${e?.message}")
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
            Log.e(TAG, "HR Tracker error: ${e}")
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
            Log.e(TAG, "PPG Tracker error: ${e}")
        }
    }
    
    private val sensorListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent?) {
            if (event?.sensor?.type == Sensor.TYPE_ACCELEROMETER) {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]
                val magnitude = sqrt((x*x + y*y + z*z).toDouble())
                addToAccWindow(magnitude)
            }
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

    override fun onCreate() {
        super.onCreate()
        WearDataRepository.setServiceRunning(true)
        Log.d(TAG, "onCreate: Service starting...")
        
        // Initialize Accelerometer
        sensorManager = getSystemService(SensorManager::class.java)
        accSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        
        if (accSensor != null) {
            sensorManager.registerListener(sensorListener, accSensor, SensorManager.SENSOR_DELAY_GAME)
        } else {
            Log.e(TAG, "Accelerometer not found")
        }
        
        val isWatch = packageManager.hasSystemFeature(PackageManager.FEATURE_WATCH)
        if (!isWatch) {
            Log.e(TAG, "CRITICAL ERROR: HRVService is running on a NON-WATCH device!")
            showToast("ERROR: Running on PHONE! Install on WATCH.")
            return
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Log.d(TAG, "Calling startForeground with type HEALTH")
                startForeground(1, createNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)
            } else {
                Log.d(TAG, "Calling startForeground (legacy)")
                startForeground(1, createNotification())
            }
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed: ${e.message}", e)
        }

        healthTrackingService = HealthTrackingService(connectionListener, applicationContext)
        healthTrackingService.connectService()
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
            showToast("Tracker Error: ${e.message}")
        }
    }

    private fun processHrDataPoint(dataPoint: DataPoint) {
        // Extract Heart Rate
        try {
            val hr = dataPoint.getValue(ValueKey.HeartRateSet.HEART_RATE) as Int
            WearDataRepository.updateHeartRate(hr)
            Log.d(TAG, "Heart Rate: $hr")
        } catch (e: Exception) {
            // Ignore if key not found or casting error
        }

        // Extract IBI for RMSSD
        val ibiList = dataPoint.getValue(ValueKey.HeartRateSet.IBI_LIST)
        
        val samples: List<Number> = when (ibiList) {
            is List<*> -> ibiList.filterIsInstance<Number>()
            is Number -> listOf(ibiList)
            else -> emptyList()
        }
        
        for (sample in samples) {
            // IBI is in ms, we need it in ms for RMSSD
            addToIbiWindow(sample.toDouble())
        }
    }

    private fun processPpgDataPoint(dataPoint: DataPoint) {
        try {
            val ppgValue = dataPoint.getValue(ValueKey.PpgGreenSet.PPG_GREEN) as Int
            addToBvpWindow(ppgValue.toDouble())
        } catch (e: Exception) {
            // Ignore if extraction fails
        }
    }

    private fun addToIbiWindow(value: Double) {
        if (ibiWindow.size >= WINDOW_SIZE) {
            ibiWindow.removeFirst()
        }
        ibiWindow.addLast(value)
        checkAndTransmit()
    }
    
    private fun addToBvpWindow(value: Double) {
        if (bvpWindow.size >= BVP_WINDOW_SIZE) {
            bvpWindow.removeFirst()
        }
        bvpWindow.addLast(value)
    }
    
    private fun addToAccWindow(value: Double) {
        if (accWindow.size >= 300) { // Keep ACC window larger (~10s)
            accWindow.removeFirst()
        }
        accWindow.addLast(value)
        checkAndTransmit()
    }
    
    private fun checkAndTransmit() {
         val currentTime = System.currentTimeMillis()
         // Transmit if we have enough data and enough time has passed (e.g. 5 seconds)
         if (ibiWindow.size >= 10 && accWindow.size >= 50 && currentTime - lastTransmissionTime > 5000) {
            calculateAndTransmitFeatures()
         }
    }

    private fun calculateAndTransmitFeatures() {
        // RMSSD Calculation
        val ibiValues = ibiWindow.toList()
        if (ibiValues.size < 2) return
        
        var sumSquaredDiff = 0.0
        for (i in 0 until ibiValues.size - 1) {
            val diff = ibiValues[i+1] - ibiValues[i]
            sumSquaredDiff += diff.pow(2)
        }
        val rmssd = sqrt(sumSquaredDiff / (ibiValues.size - 1))

        // ACC Stats
        val accValues = accWindow.toList()
        if (accValues.isEmpty()) return
        val accMean = accValues.average()
        var accSum = 0.0
        for (num in accValues) accSum += (num - accMean).pow(2)
        val accStd = sqrt(accSum / accValues.size)
        val accMax = accValues.maxOrNull() ?: 0.0

        // BVP Stats
        val bvpValues = bvpWindow.toList()
        var bvpMeanCalc = 0.0
        var bvpStdCalc = rmssd
        var bvpMinCalc: Double? = null
        var bvpMaxCalc: Double? = null
        var bvpRangeCalc: Double? = null
        var bvpEnergyCalc: Double? = null

        if (bvpValues.isNotEmpty()) {
            bvpMeanCalc = bvpValues.average()

            var bvpSumSq = 0.0
            var bvpEnergySum = 0.0
            for (num in bvpValues) {
                bvpSumSq += (num - bvpMeanCalc).pow(2)
                bvpEnergySum += num.pow(2)
            }
            
            bvpStdCalc = sqrt(bvpSumSq / bvpValues.size)
            bvpMinCalc = bvpValues.minOrNull()
            bvpMaxCalc = bvpValues.maxOrNull()
            
            if (bvpMaxCalc != null && bvpMinCalc != null) {
                bvpRangeCalc = bvpMaxCalc - bvpMinCalc
            }
            
            bvpEnergyCalc = bvpEnergySum / bvpValues.size
        }

        Log.d(TAG, "Features: RMSSD($rmssd), ACC($accMean, $accStd, $accMax), BVP_MEAN($bvpMeanCalc)")
        transmitFeatures(rmssd, accMean, accStd, accMax, bvpMeanCalc, bvpStdCalc, bvpMinCalc, bvpMaxCalc, bvpRangeCalc, bvpEnergyCalc)
        lastTransmissionTime = System.currentTimeMillis()
    }

    private fun transmitFeatures(
        rmssd: Double, accMean: Double, accStd: Double, accMax: Double, 
        bvpMeanCalc: Double, bvpStdCalc: Double, bvpMinCalc: Double?, 
        bvpMaxCalc: Double?, bvpRangeCalc: Double?, bvpEnergyCalc: Double?
    ) {
        val dto = HSRVDto(
            bvp_mean = bvpMeanCalc,
            bvp_std = bvpStdCalc,
            bvp_min = bvpMinCalc ?: 0.0,
            bvp_max = bvpMaxCalc ?: 0.0,
            bvp_range = bvpRangeCalc ?: 0.0,
            bvp_energy = bvpEnergyCalc ?: 0.0,
            acc_mean = accMean,
            acc_std = accStd,
            acc_max = accMax
        )

        val data = Json.encodeToString(dto).encodeToByteArray()

        Wearable.getNodeClient(this).connectedNodes.addOnSuccessListener { nodes ->
            for (node in nodes) {
                Wearable.getMessageClient(this).sendMessage(node.id, "/biometrics", data)
                    .addOnSuccessListener { Log.d(TAG, "Features sent successfully") }
                    .addOnFailureListener { e -> Log.e(TAG, "Message failed to send: ${e.message}") }
            }
        }
    }

    private fun createNotification(): Notification {
        val channelId = "hrv_service_channel"
        val channel = NotificationChannel(channelId, "HRV Service", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)

        return Notification.Builder(this, channelId)
            .setContentTitle("BioSync")
            .setContentText("Measuring HRV...")
            .setSmallIcon(R.drawable.ic_menu_mylocation) // Placeholder icon
            .build()
    }

    private fun showToast(message: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        WearDataRepository.setServiceRunning(false)
        hrTracker?.unsetEventListener()
        ppgTracker?.unsetEventListener()
        if (::healthTrackingService.isInitialized) {
            healthTrackingService.disconnectService()
        }
        if (::sensorManager.isInitialized) {
            sensorManager.unregisterListener(sensorListener)
        }
    }

    companion object {
        const val TAG = "HRVService"
    }
}
