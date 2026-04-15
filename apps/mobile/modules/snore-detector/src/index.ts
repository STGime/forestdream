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

const Native = requireNativeModule<SnoreDetectorModuleType>('SnoreDetectorModule');

export default Native;
