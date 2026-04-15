import { EventSubscription } from 'expo-modules-core';
import SnoreDetectorModule, { type DisturbanceEvent } from 'snore-detector';

export type { DisturbanceEvent };

// Thin JS wrapper over the Expo native module.
// Audio frames never cross into JS — only `DisturbanceEvent` metadata.
export class SnoreDetector {
  private sub: EventSubscription | null = null;

  async start(onEvent: (e: DisturbanceEvent) => void): Promise<boolean> {
    try {
      await SnoreDetectorModule.start();
      this.sub = SnoreDetectorModule.addListener('FDDisturbance', onEvent);
      return true;
    } catch {
      return false;
    }
  }

  async stop(): Promise<void> {
    this.sub?.remove();
    this.sub = null;
    try { await SnoreDetectorModule.stop(); } catch { /* ignore */ }
  }
}
