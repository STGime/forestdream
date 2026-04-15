import type { Tier } from './types';

export type ThemeAssetMap = Record<string, string>;

export interface Theme {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  preview_key?: string | null;
  asset_keys: ThemeAssetMap;
  sort_order: number;
}

// Soothing layers chosen by AdaptiveResponder when a disturbance is detected.
export const SOOTHING_LAYERS: Record<string, string[]> = {
  rainforest: ['rain'],
  mediterranean: ['wind'],
  nordic: ['wind'],
  tropical_storm: ['rain', 'thunder'],
  alpine_meadow: ['stream'],
  coastal_fog: ['surf'],
};
