import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

interface Layer {
  key: string;
  sound: Audio.Sound;
  baseVolume: number;
}

// Seamless looping multi-layer player. Volumes can be ducked/boosted per layer.
export class Player {
  private layers: Layer[] = [];

  async configure(): Promise<void> {
    // Note: staysActiveInBackground: true requires a foreground service on
    // Android — when it's missing, ExoPlayer can silently route output to a
    // null sink even though isPlaying reports true. Keep it off for now;
    // re-enable after we add the foreground service for real sleep sessions.
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  async loadLayer(
    key: string,
    source: { uri: string; headers?: Record<string, string> },
    volume = 1
  ): Promise<void> {
    const { sound, status } = await Audio.Sound.createAsync(
      source,
      { isLooping: true, volume, shouldPlay: true },
      undefined,
      true
    );
    console.log('[Player] createAsync status', key, JSON.stringify(status));
    if (!status.isLoaded) {
      console.warn('[Player] sound failed to load', key, (status as { error?: string }).error);
    } else {
      await sound.playAsync().catch((e) => console.warn('[Player] playAsync failed', key, e));
      const after = await sound.getStatusAsync();
      console.log('[Player] after playAsync', key, JSON.stringify(after));
    }
    this.layers.push({ key, sound, baseVolume: volume });
  }

  async setLayerVolume(key: string, volume: number, durationMs = 1500): Promise<void> {
    const layer = this.layers.find((l) => l.key === key);
    if (!layer) return;
    const steps = 10;
    const stepMs = durationMs / steps;
    const status = await layer.sound.getStatusAsync();
    const start = status.isLoaded ? status.volume ?? layer.baseVolume : layer.baseVolume;
    for (let i = 1; i <= steps; i++) {
      const v = start + ((volume - start) * i) / steps;
      await layer.sound.setVolumeAsync(v);
      await new Promise((r) => setTimeout(r, stepMs));
    }
  }

  async stop(): Promise<void> {
    await Promise.all(this.layers.map(async (l) => {
      await l.sound.stopAsync().catch(() => {});
      await l.sound.unloadAsync().catch(() => {});
    }));
    this.layers = [];
  }
}
