import { createClient } from '@forestdream/eurobase-client';
import { ensureLocalStorage } from './localStoragePolyfill';

const url = process.env.EXPO_PUBLIC_EUROBASE_URL!;
const apiKey = process.env.EXPO_PUBLIC_EUROBASE_PUBLIC_KEY!;

if (!url || !apiKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_EUROBASE_URL / EXPO_PUBLIC_EUROBASE_PUBLIC_KEY — set them in apps/mobile/.env'
  );
}

// Install the localStorage polyfill synchronously so the SDK constructor doesn't crash.
ensureLocalStorage();

export const eb = createClient({ url, apiKey });

// The Eurobase SDK creates a separate httpClient closure per sub-client
// (auth, db, storage, functions, realtime, vault). `AuthClient.setSession`
// only sets the access token on the auth http — db/storage/etc. never see it
// and therefore send unauthenticated requests. Propagate the token to every
// sub-client whenever auth state changes.
function propagateToken(token: string | null) {
  const subs = ['db', 'storage', 'functions', 'realtime', 'vault'] as const;
  for (const name of subs) {
    const client = (eb as unknown as Record<string, { http?: { setAccessToken?: (t: string | null) => void } }>)[name];
    client?.http?.setAccessToken?.(token);
  }
}

eb.auth.onAuthStateChange((_event, session) => {
  propagateToken(session?.access_token ?? null);
});

// After AsyncStorage rehydrates, restore any persisted session so http calls
// are authenticated on first render, then propagate the token to every sub-client.
export const authReady: Promise<void> = (async () => {
  await ensureLocalStorage();
  try {
    // @ts-expect-error — internal SDK method, present at runtime
    eb.auth.restoreSession?.();
  } catch (e) {
    console.warn('[eurobase] restoreSession failed', e);
  }
  const session = eb.auth.getSession?.();
  if (session) propagateToken(session.access_token);
  console.log('[eurobase] authReady', session ? `session for ${session.user?.email}` : 'no session');
})();
