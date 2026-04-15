import type { Tier } from './types';

export type Feature =
  | 'premium_themes'
  | 'custom_mixes'
  | 'advanced_stats'
  | 'full_history';

export const HISTORY_FREE_DAYS = 7;
export const MAX_CUSTOM_MIXES = 10;

export function canAccess(feature: Feature, tier: Tier): boolean {
  if (tier === 'premium') return true;
  switch (feature) {
    case 'premium_themes':
    case 'custom_mixes':
    case 'advanced_stats':
    case 'full_history':
      return false;
  }
}

export function isActivePremium(profile: {
  tier: Tier;
  premium_expires_at?: string | null;
}): boolean {
  if (profile.tier !== 'premium') return false;
  if (!profile.premium_expires_at) return true;
  return new Date(profile.premium_expires_at).getTime() > Date.now();
}
