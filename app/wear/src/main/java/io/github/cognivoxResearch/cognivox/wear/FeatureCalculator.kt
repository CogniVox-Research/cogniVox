package io.github.cognivoxResearch.cognivox.wear

import android.util.Log
import kotlin.math.pow
import kotlin.math.sqrt

/**
 * Welford's online algorithm for running mean & standard deviation.
 * Used to normalize Samsung PPG_GREEN raw ADC values (~100K-10M)
 * into a scale compatible with the WESAD/Empatica E4 training data (~-100 to +100).
 *
 * After a calibration period ([minSamples]), each incoming value is transformed:
 *   normalized = (raw - runningMean) / runningStd
 *
 * This z-score centers the signal around 0 and normalizes the spread,
 * matching what the Empatica E4 BVP signal looks like in the WESAD dataset.
 */
class RunningNormalizer(private val minSamples: Int = 100) {
    private var count = 0L
    private var mean = 0.0
    private var m2 = 0.0   // sum of squared deviations

    /** Returns true once enough samples have been collected for stable normalization. */
    val isCalibrated: Boolean get() = count >= minSamples

    /** Update running stats with a new raw value and return the normalized result. */
    fun normalize(rawValue: Double): Double {
        // Welford's online update
        count++
        val delta = rawValue - mean
        mean += delta / count
        val delta2 = rawValue - mean
        m2 += delta * delta2

        // During calibration, return 0 (neutral) to avoid sending garbage
        if (!isCalibrated) return 0.0

        val variance = m2 / count
        val std = sqrt(variance)

        // Guard against zero std (constant signal)
        return if (std > 1e-9) (rawValue - mean) / std else 0.0
    }
}

class FeatureCalculator(
    private val onFeaturesCalculated: (HSRVDto) -> Unit
) {
    private val ibiWindow = ArrayDeque<Double>()
    private val accWindow = ArrayDeque<Double>()
    private val bvpWindow = ArrayDeque<Double>()
    private val edaWindow = ArrayDeque<Double>()
    private val tempWindow = ArrayDeque<Double>()

    private val WINDOW_SIZE = 30 // Keep 30 IBIs for RMSSD
    private val BVP_WINDOW_SIZE = 500 // Approx 20 seconds at 25Hz
    private val EDA_WINDOW_SIZE = 60 // Approx 60 seconds at 1Hz
    private val TEMP_WINDOW_SIZE = 60 // Approx 60 seconds
    private var lastTransmissionTime = 0L

    /**
     * Normalizer for Samsung PPG_GREEN → WESAD BVP scale.
     * Calibrates during the first 100 samples (~4s at 25Hz),
     * then z-score normalizes all subsequent values.
     */
    private val bvpNormalizer = RunningNormalizer(minSamples = 100)

    fun addIbiData(value: Double) {
        if (ibiWindow.size >= WINDOW_SIZE) {
            ibiWindow.removeFirst()
        }
        ibiWindow.addLast(value)
        checkAndTransmit()
    }

    fun addBvpData(value: Double) {
        // Normalize Samsung raw PPG value to WESAD-compatible scale
        val normalizedValue = bvpNormalizer.normalize(value)

        if (bvpWindow.size >= BVP_WINDOW_SIZE) {
            bvpWindow.removeFirst()
        }
        bvpWindow.addLast(normalizedValue)
    }

    fun addEdaData(value: Double) {
        if (edaWindow.size >= EDA_WINDOW_SIZE) {
            edaWindow.removeFirst()
        }
        edaWindow.addLast(value)
    }

    fun addTempData(value: Double) {
        if (tempWindow.size >= TEMP_WINDOW_SIZE) {
            tempWindow.removeFirst()
        }
        tempWindow.addLast(value)
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
            // Don't transmit until BVP normalizer is calibrated
            if (!bvpNormalizer.isCalibrated) {
                Log.d(TAG, "BVP normalizer still calibrating, skipping transmission")
                return
            }
            try {
                calculateAndTransmitFeatures()
            } catch (e: Exception){
                Log.e(TAG, "Failed to transmit $e")
            }
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

        // BVP Stats (values are already normalized by RunningNormalizer)
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

        // EDA Stats
        val edaValues = edaWindow.toList()
        var edaMeanCalc: Double? = null
        var edaStdCalc: Double? = null
        var edaMinCalc: Double? = null
        var edaMaxCalc: Double? = null

        if (edaValues.isNotEmpty()) {
            edaMeanCalc = edaValues.average()
            var edaSumSq = 0.0
            for (num in edaValues) edaSumSq += (num - edaMeanCalc).pow(2)
            edaStdCalc = sqrt(edaSumSq / edaValues.size)
            edaMinCalc = edaValues.minOrNull()
            edaMaxCalc = edaValues.maxOrNull()
        }

        // Temp Stats
        val tempValues = tempWindow.toList()
        var tempMeanCalc: Double? = null
        var tempStdCalc: Double? = null

        if (tempValues.isNotEmpty()) {
            tempMeanCalc = tempValues.average()
            var tempSumSq = 0.0
            for (num in tempValues) tempSumSq += (num - tempMeanCalc).pow(2)
            tempStdCalc = sqrt(tempSumSq / tempValues.size)
        }

        Log.d(TAG, "Features [NORMALIZED]: RMSSD($rmssd), ACC($accMean, $accStd, $accMax), BVP_MEAN($bvpMeanCalc), BVP_STD($bvpStdCalc), EDA_MEAN($edaMeanCalc), TEMP_MEAN($tempMeanCalc)")

        val dto = HSRVDto(
            bvp_mean = bvpMeanCalc,
            bvp_std = bvpStdCalc,
            bvp_min = bvpMinCalc ?: 0.0,
            bvp_max = bvpMaxCalc ?: 0.0,
            bvp_range = bvpRangeCalc ?: 0.0,
            bvp_energy = bvpEnergyCalc ?: 0.0,
            acc_mean = accMean,
            acc_std = accStd,
            acc_max = accMax,
            eda_mean = edaMeanCalc,
            eda_std = edaStdCalc,
            eda_min = edaMinCalc,
            eda_max = edaMaxCalc,
            temp_mean = tempMeanCalc,
            temp_std = tempStdCalc
        )

        onFeaturesCalculated(dto)
        lastTransmissionTime = System.currentTimeMillis()
    }

    companion object {
        const val TAG = "FeatureCalculator"
    }
}