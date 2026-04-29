package io.github.cognivoxResearch.cognivox.wear

import android.R
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.widget.Toast

class HRVService : Service() {

    private lateinit var healthSensorManager: HealthSensorManager
    private lateinit var motionSensorManager: MotionSensorManager
    private lateinit var featureCalculator: FeatureCalculator
    private lateinit var biometricsTransmitter: BiometricsTransmitter

    override fun onCreate() {
        super.onCreate()
        WearDataRepository.setServiceRunning(true)
        Log.d(TAG, "onCreate: Service starting...")

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

        biometricsTransmitter = BiometricsTransmitter(this)
        
        featureCalculator = FeatureCalculator(
            onFeaturesCalculated = { dto ->
                biometricsTransmitter.transmitFeatures(dto)
            }
        )
        
        motionSensorManager = MotionSensorManager(
            context = this,
            onAccData = { accMagnitude ->
                featureCalculator.addAccData(accMagnitude)
            }
        )
        motionSensorManager.start()

        healthSensorManager = HealthSensorManager(
            context = this,
            onIbiData = { ibi ->
                featureCalculator.addIbiData(ibi)
            },
            onPpgData = { ppg ->
                featureCalculator.addBvpData(ppg)
            },
            onEdaData = { eda ->
                featureCalculator.addEdaData(eda)
            },
            onTempData = { temp ->
                featureCalculator.addTempData(temp)
            },
            onConnected = {
                showToast("Connected to Sensor")
            },
            onError = { error ->
                showToast("Sensor Connection Failed: $error")
            }
        )
        healthSensorManager.connect()
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
        if (::healthSensorManager.isInitialized) {
            healthSensorManager.disconnect()
        }
        if (::motionSensorManager.isInitialized) {
            motionSensorManager.stop()
        }
    }

    companion object {
        const val TAG = "HRVService"
    }
}
