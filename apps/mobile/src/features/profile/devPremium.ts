import AsyncStorage from '@react-native-async-storage/async-storage';

// Dev-only local override for premium tier, while we stub out RevenueCat.
// Stored in AsyncStorage so it survives reloads. Safe to read in production
// (returns false); safe to set from __DEV__ builds only.

const KEY = 'fd_dev_premium';

let cached: boolean | null = null;

export async function loadDevPremium(): Promise<boolean> {
  if (cached !== null) return cached;
  const raw = await AsyncStorage.getItem(KEY);
  cached = raw === '1';
  return cached;
}

export async function setDevPremium(on: boolean): Promise<void> {
  cached = on;
  if (on) await AsyncStorage.setItem(KEY, '1');
  else await AsyncStorage.removeItem(KEY);
}

export function getDevPremiumSync(): boolean {
  return cached === true;
}
