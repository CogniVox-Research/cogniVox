package io.github.cognivoxResearch.cognivox.wear

import android.util.Log
import kotlin.math.pow
import kotlin.math.sqrt

class FeatureCalculator(
    private val onFeaturesCalculated: (HSRVDto) -> Unit
) {
    private val ibiWindow = ArrayDeque<Double>()
    private val accWindow = ArrayDeque<Double>()
    private val bvpWindow = ArrayDeque<Double>()
    
    private val WINDOW_SIZE = 30 // Keep 30 IBIs for RMSSD
    private val BVP_WINDOW_SIZE = 500 // Approx 20 seconds at 25Hz
    private var lastTransmissionTime = 0L

    fun addIbiData(value: Double) {
        if (ibiWindow.size >= WINDOW_SIZE) {
            ibiWindow.removeFirst()
        }
        ibiWindow.addLast(value)
        checkAndTransmit()
    }
    
    fun addBvpData(value: Double) {
        if (bvpWindow.size >= BVP_WINDOW_SIZE) {
            bvpWindow.removeFirst()
        }
        bvpWindow.addLast(value)
    }
    
    fun addAccData(value: Double) {
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
        
        onFeaturesCalculated(dto)
        lastTransmissionTime = System.currentTimeMillis()
    }

    companion object {
        const val TAG = "FeatureCalculator"
    }
}
