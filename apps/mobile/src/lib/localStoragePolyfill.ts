import AsyncStorage from '@react-native-async-storage/async-storage';

// The Eurobase SDK persists auth sessions via the web localStorage API.
// React Native has no window.localStorage, so we polyfill a synchronous
// in-memory store with async write-through to AsyncStorage.
//
// Call ensureLocalStorage() and await it before creating the Eurobase client,
// so any previously-persisted session is already in memory when the SDK's
// constructor calls restoreSession().

const STORAGE_KEY_PREFIX = 'fd_ls_';
const memory = new Map<string, string>();
let ready: Promise<void> | null = null;

function buildPolyfill() {
  const store = {
    get length() {
      return memory.size;
    },
    key(n: number) {
      return Array.from(memory.keys())[n] ?? null;
    },
    getItem(k: string) {
      return memory.has(k) ? memory.get(k)! : null;
    },
    setItem(k: string, v: string) {
      memory.set(k, v);
      AsyncStorage.setItem(STORAGE_KEY_PREFIX + k, v).catch(() => {});
    },
    removeItem(k: string) {
      memory.delete(k);
      AsyncStorage.removeItem(STORAGE_KEY_PREFIX + k).catch(() => {});
    },
    clear() {
      for (const k of Array.from(memory.keys())) this.removeItem(k);
    },
  };
  // @ts-expect-error — augmenting the RN global
  globalThis.localStorage = store;
}

export function ensureLocalStorage(): Promise<void> {
  if (ready) return ready;
  buildPolyfill();
  ready = (async () => {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(
      keys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX))
    );
    for (const [k, v] of pairs) {
      if (v !== null) memory.set(k.slice(STORAGE_KEY_PREFIX.length), v);
    }
  })();
  return ready;
}
