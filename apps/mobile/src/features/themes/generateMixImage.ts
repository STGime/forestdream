import { eb } from '@/lib/eurobase';

const FAL_KEY = process.env.EXPO_PUBLIC_FAL_AI_KEY;
const EUROBASE_URL = process.env.EXPO_PUBLIC_EUROBASE_URL!;
const EUROBASE_KEY = process.env.EXPO_PUBLIC_EUROBASE_PUBLIC_KEY!;

const LABELS: Record<string, string> = {
  'themes/rainforest/rain.m4a': 'rainfall',
  'themes/tropical_storm/thunder.m4a': 'distant thunder',
  'themes/nordic/wind.m4a': 'wind through pines',
  'themes/coastal_fog/surf.m4a': 'ocean waves',
  'themes/rainforest/birds.m4a': 'forest birds',
  'themes/mediterranean/cicadas.m4a': 'cicadas at dusk',
  'themes/nordic/owl.m4a': 'night owl calls',
  'themes/alpine_meadow/stream.m4a': 'an alpine stream',
  'themes/alpine_meadow/bells.m4a': 'cowbells on a mountainside',
  'themes/coastal_fog/foghorn.m4a': 'a distant foghorn',
};

export function buildMixPrompt(name: string, elements: Array<{ asset_key: string }>): string {
  const parts = elements.map((e) => LABELS[e.asset_key] ?? e.asset_key.split('/').pop()?.replace(/\.m4a$/, '') ?? '');
  const list = parts.filter(Boolean).join(', ');
  return `A dreamlike nighttime scene blending ${list}. Peaceful, cinematic, photorealistic, soft light, calming atmosphere for sleep. ${name}`;
}

// Calls fal.ai flux/schnell, returns the remote image URL.
async function generateImage(prompt: string): Promise<string> {
  if (!FAL_KEY) throw new Error('EXPO_PUBLIC_FAL_AI_KEY missing');
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { images?: Array<{ url: string }> };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error('fal response missing image url');
  return url;
}

// Generates an image for the given mix and uploads it to Eurobase storage
// under `mixes/<mixId>/hero.jpg`. Returns the storage key.
// Uses a direct multipart upload so we can add the X-Project-Slug header
// the SDK's http client doesn't attach.
export async function generateAndUploadMixImage(
  mixId: string,
  name: string,
  elements: Array<{ asset_key: string }>
): Promise<string> {
  const prompt = buildMixPrompt(name, elements);
  console.log('[mix-image] prompt:', prompt);
  const imgUrl = await generateImage(prompt);
  console.log('[mix-image] fal url received');

  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) throw new Error(`download image: ${imgRes.status}`);
  const blob = await imgRes.blob();
  console.log('[mix-image] downloaded', blob.size, 'bytes');

  const key = `mixes/${mixId}/hero.jpg`;
  const token = eb.auth.getSession?.()?.access_token;
  if (!token) throw new Error('no session for upload');

  const form = new FormData();
  // React Native FormData expects { uri, name, type } for binary. Use the
  // fal.ai URL directly as the uri so RN streams it via native networking.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append('file', { uri: imgUrl, name: `${mixId}.jpg`, type: 'image/jpeg' } as any);
  form.append('key', key);

  const res = await fetch(`${EUROBASE_URL}/v1/storage/upload`, {
    method: 'POST',
    headers: {
      apikey: EUROBASE_KEY,
      Authorization: `Bearer ${token}`,
      'X-Project-Slug': 'forestdream',
    },
    body: form,
  });
  const text = await res.text();
  console.log('[mix-image] upload response', res.status, text.slice(0, 200));
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${text}`);
  return key;
}
