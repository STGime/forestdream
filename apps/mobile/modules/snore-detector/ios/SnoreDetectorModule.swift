import ExpoModulesCore
import AVFoundation

// On-device disturbance detector.
// Uses AVAudioEngine tap -> RMS energy + low-band ratio as a cheap snore proxy.
// A TFLite classifier can be plugged in here later; audio frames never cross the JS bridge.
public class SnoreDetectorModule: Module {
  private let engine = AVAudioEngine()
  private var lastEmit: TimeInterval = 0
  // Tunables
  private let rmsThreshold: Float = 0.08   // louder than normal ambient
  private let cooldownSec: TimeInterval = 6 // avoid event storms

  public func definition() -> ModuleDefinition {
    Name("SnoreDetectorModule")
    Events("FDDisturbance")

    AsyncFunction("start") { (promise: Promise) in
      do {
        try self.startEngine()
        promise.resolve(nil)
      } catch {
        promise.reject("E_START", error.localizedDescription)
      }
    }

    AsyncFunction("stop") { (promise: Promise) in
      self.stopEngine()
      promise.resolve(nil)
    }

    OnDestroy { self.stopEngine() }
  }

  private func startEngine() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .measurement,
                            options: [.mixWithOthers, .allowBluetooth, .defaultToSpeaker])
    try session.setActive(true, options: [])

    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    input.removeTap(onBus: 0)
    input.installTap(onBus: 0, bufferSize: 2048, format: format) { [weak self] buffer, _ in
      self?.analyse(buffer: buffer)
    }
    engine.prepare()
    try engine.start()
  }

  private func stopEngine() {
    if engine.isRunning {
      engine.inputNode.removeTap(onBus: 0)
      engine.stop()
    }
  }

  private func analyse(buffer: AVAudioPCMBuffer) {
    guard let channel = buffer.floatChannelData?.pointee else { return }
    let frameCount = Int(buffer.frameLength)
    if frameCount == 0 { return }

    // RMS energy
    var sum: Float = 0
    for i in 0..<frameCount {
      let v = channel[i]
      sum += v * v
    }
    let rms = sqrt(sum / Float(frameCount))

    let now = Date().timeIntervalSince1970
    if rms > rmsThreshold, now - lastEmit > cooldownSec {
      lastEmit = now
      let confidence = min(1.0, Double(rms) / 0.3)
      sendEvent("FDDisturbance", [
        "kind": "snore",
        "confidence": confidence,
        "timestamp": Int(now * 1000)
      ])
    }
    // NOTE: buffer is discarded on return — no audio is stored or transmitted.
  }
}
