import { eb } from '@/lib/eurobase';

const cache = new Map<string, string>();

// Resolve a Eurobase storage key to a (signed) URI for playback.
export async function resolveAssetUri(storageKey: string): Promise<string> {
  if (cache.has(storageKey)) return cache.get(storageKey)!;
  const url = await eb.storage.getPublicUrl(storageKey);
  cache.set(storageKey, url);
  return url;
}
