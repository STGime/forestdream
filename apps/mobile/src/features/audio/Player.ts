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
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
    });
  }

  async loadLayer(key: string, uri: string, volume = 1): Promise<void> {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { isLooping: true, volume, shouldPlay: true }
    );
    this.layers.push({ key, sound, baseVolume: volume });
  }

  async setLayerVolume(key: string, volume: number, durationMs = 1500): Promise<void> {
    const layer = this.layers.find((l) => l.key === key);
    if (!layer) return;
    // Simple crossfade: step volume over duration.
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
