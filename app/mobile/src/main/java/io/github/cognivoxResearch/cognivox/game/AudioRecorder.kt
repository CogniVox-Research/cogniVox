package io.github.cognivoxResearch.cognivox.game

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.Job
import java.nio.ByteBuffer
import kotlin.concurrent.thread

class AudioRecorder(val listener: (samples: ByteBuffer) -> Unit) {
    lateinit var audioRecord: AudioRecord
    val recordJob = Job()

    fun startRecording() {
        val bitsPerSample = 4
        val bufferSize = CHUNK_SIZE * bitsPerSample * SAMPLE_RATE;


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
                while (audioRecord.recordingState != AudioRecord.RECORDSTATE_STOPPED) {
                    val buffer = ByteBuffer.allocate(bufferSize)
                    audioRecord.read(buffer, bufferSize)
                    listener(buffer)
                }
                recordJob.complete()
            } catch (e: Exception) {
                recordJob.completeExceptionally(e)
            }
        }
    }

    suspend fun stopRecording() {
        audioRecord.stop()
        recordJob.join()
    }


    companion object {
        const val SAMPLE_RATE = 16000
        const val CHUNK_SIZE = 5
    }
}