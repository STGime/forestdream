import { useEffect, useState } from 'react';
import { resolveAssetUri } from './resolveAsset';

// Resolves a Eurobase storage key to a signed image URL for use in <Image>.
// Returns null until the URL is ready (fine to render a fallback underneath).
export function useStorageImage(key: string | null | undefined): string | null {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    if (!key) { setUri(null); return; }
    let cancelled = false;
    resolveAssetUri(key)
      .then((u) => { if (!cancelled) setUri(u); })
      .catch(() => { if (!cancelled) setUri(null); });
    return () => { cancelled = true; };
  }, [key]);
  return uri;
}
