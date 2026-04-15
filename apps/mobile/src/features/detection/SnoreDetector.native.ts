import SnoreDetectorModule, { type DisturbanceEvent } from 'snore-detector';

export type { DisturbanceEvent };

// Thin JS wrapper over the Expo native module.
// Audio frames never cross into JS — only `DisturbanceEvent` metadata.
// In Expo Go or when the native module is unavailable, start() returns false
// and no events are emitted.
export class SnoreDetector {
  private sub: { remove: () => void } | null = null;

  async start(onEvent: (e: DisturbanceEvent) => void): Promise<boolean> {
    if (!SnoreDetectorModule) {
      console.warn('[SnoreDetector] native module unavailable (Expo Go?) — disabled');
      return false;
    }
    try {
      await SnoreDetectorModule.start();
      this.sub = SnoreDetectorModule.addListener('FDDisturbance', onEvent);
      return true;
    } catch (e) {
      console.warn('[SnoreDetector] start failed', e);
      return false;
    }
  }

  async stop(): Promise<void> {
    this.sub?.remove();
    this.sub = null;
    if (SnoreDetectorModule) {
      try { await SnoreDetectorModule.stop(); } catch { /* ignore */ }
    }
  }
}
