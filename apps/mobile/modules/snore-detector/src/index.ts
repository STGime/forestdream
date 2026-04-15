import { NativeModule, requireNativeModule } from 'expo';

export interface DisturbanceEvent {
  kind: 'snore' | 'movement';
  confidence: number;
  timestamp: number;
}

declare class SnoreDetectorModuleType extends NativeModule<{
  FDDisturbance: (event: DisturbanceEvent) => void;
}> {
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Gracefully return null in Expo Go / environments without the native module.
// Callers (SnoreDetector wrapper) fall back to a no-op when null.
let mod: SnoreDetectorModuleType | null = null;
try {
  mod = requireNativeModule<SnoreDetectorModuleType>('SnoreDetectorModule');
} catch {
  mod = null;
}

export default mod;
