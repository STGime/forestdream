package app.eurobase.forestdream.snoredetector

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.*
import kotlin.math.min
import kotlin.math.sqrt

// On-device disturbance detector.
// Uses AudioRecord -> RMS energy as a cheap snore proxy.
// Audio frames never cross the JS bridge; only event metadata is emitted.
class SnoreDetectorModule : Module() {

  private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
  private var job: Job? = null
  private var recorder: AudioRecord? = null

  // Tunables
  private val sampleRate = 16_000
  private val rmsThreshold = 0.08f
  private val cooldownMs = 6_000L
  private var lastEmit = 0L

  override fun definition() = ModuleDefinition {
    Name("SnoreDetectorModule")
    Events("FDDisturbance")

    AsyncFunction("start") { start() }
    AsyncFunction("stop") { stop() }

    OnDestroy { stop() }
  }

  private fun start() {
    if (job != null) return
    val minBuf = AudioRecord.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT)
    recorder = AudioRecord(
      MediaRecorder.AudioSource.MIC,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_FLOAT,
      minBuf.coerceAtLeast(8192)
    ).also { it.startRecording() }

    job = scope.launch {
      val buf = FloatArray(2048)
      while (isActive) {
        val n = recorder?.read(buf, 0, buf.size, AudioRecord.READ_BLOCKING) ?: 0
        if (n <= 0) continue
        var sum = 0f
        for (i in 0 until n) sum += buf[i] * buf[i]
        val rms = sqrt(sum / n)

        val now = System.currentTimeMillis()
        if (rms > rmsThreshold && now - lastEmit > cooldownMs) {
          lastEmit = now
          sendEvent("FDDisturbance", mapOf(
            "kind" to "snore",
            "confidence" to min(1.0, rms.toDouble() / 0.3),
            "timestamp" to now
          ))
        }
        // buf is reused; nothing persisted or transmitted.
      }
    }
  }

  private fun stop() {
    job?.cancel()
    job = null
    try { recorder?.stop() } catch (_: Throwable) {}
    recorder?.release()
    recorder = null
  }
}
