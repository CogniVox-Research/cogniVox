package io.github.cognivoxResearch.cognivox.wear

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import kotlin.math.sqrt

class MotionSensorManager(
    private val context: Context,
    private val onAccData: (Double) -> Unit
) {
    private var sensorManager: SensorManager? = null
    private var accSensor: Sensor? = null
    
    private val sensorListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent?) {
            if (event?.sensor?.type == Sensor.TYPE_ACCELEROMETER) {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]
                val magnitude = sqrt((x*x + y*y + z*z).toDouble())
                onAccData(magnitude)
            }
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

    fun start() {
        sensorManager = context.getSystemService(SensorManager::class.java)
        accSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        
        if (accSensor != null) {
            sensorManager?.registerListener(sensorListener, accSensor, SensorManager.SENSOR_DELAY_GAME)
        } else {
            Log.e(TAG, "Accelerometer not found")
        }
    }

    fun stop() {
        sensorManager?.unregisterListener(sensorListener)
    }

    companion object {
        const val TAG = "MotionSensorManager"
    }
}
