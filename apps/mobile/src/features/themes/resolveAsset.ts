import { eb } from '@/lib/eurobase';

const EUROBASE_URL = process.env.EXPO_PUBLIC_EUROBASE_URL!;
const API_KEY = process.env.EXPO_PUBLIC_EUROBASE_PUBLIC_KEY!;

const cache = new Map<string, { url: string; expiresAt: number }>();

export async function resolveAssetUri(storageKey: string): Promise<string> {
  const cached = cache.get(storageKey);
  if (cached && cached.expiresAt - Date.now() > 5 * 60_000) return cached.url;

  const token = eb.auth.getSession?.()?.access_token;
  if (!token) throw new Error('resolveAssetUri: no session access_token');

  const res = await fetch(`${EUROBASE_URL}/v1/storage/signed-url`, {
    method: 'POST',
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${token}`,
      'X-Project-Slug': 'forestdream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key: storageKey, operation: 'download', expires_in: 3600 }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`signed-url failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { url?: string; expires_at?: string };
  if (!data.url) throw new Error(`signed-url returned no url for ${storageKey}`);

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 3600_000;
  cache.set(storageKey, { url: data.url, expiresAt });
  return data.url;
}
