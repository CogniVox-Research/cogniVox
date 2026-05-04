package io.github.cognivoxResearch.cognivox.game

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import kotlinx.coroutines.Job
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.concurrent.thread

class AudioRecorder(val listener: (samples: ByteBuffer) -> Unit) {
    lateinit var audioRecord: AudioRecord
    val recordJob = Job()

    fun startRecording() {
        val arraySize = CHUNK_SIZE * SAMPLE_RATE;
        val bufferSize = CHUNK_SIZE *
                AudioRecord.getMinBufferSize(
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_FLOAT
                )


        val builder =
            AudioRecord.Builder()
                .setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                        .build()
                ).setBufferSizeInBytes(bufferSize);

        try {
            audioRecord = builder.build()
        } catch (e: SecurityException) {
            throw RuntimeException(e)
        }

        audioRecord.startRecording()

        thread {
            try {
                val buffer = FloatArray(arraySize);
                while (audioRecord.recordingState != AudioRecord.RECORDSTATE_STOPPED) {
                    val read = audioRecord.read(buffer, 0, arraySize, AudioRecord.READ_BLOCKING)
                    if (read < 1) {
                        Log.i("AudioRecord", "Audio Error $read")
                        throw RuntimeException("Audio Error $read")
                    }
                    Log.i("AudioRecord", "Read $read samples")
                    val bytes = toByteArray(buffer)
                    listener(bytes)
                }
                recordJob.complete()
            } catch (e: Exception) {
                recordJob.completeExceptionally(e)
            }
        }
    }

    fun toByteArray(array: FloatArray, order: ByteOrder = ByteOrder.LITTLE_ENDIAN): ByteBuffer {
        val byteBuffer = ByteBuffer.allocate(array.size * Float.SIZE_BYTES)
        byteBuffer.order(order)
        for (value in array) {
            byteBuffer.putFloat(value)
        }
        return byteBuffer
    }

    suspend fun stopRecording() {
        audioRecord.release()
        recordJob.join()
    }


    companion object {
        const val SAMPLE_RATE = 16000
        const val CHUNK_SIZE = 1
    }
}