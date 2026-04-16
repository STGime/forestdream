#!/usr/bin/env node
// One-shot: generates photo-realistic hero images for each theme via fal.ai,
// uploads them to Eurobase storage, and updates themes.hero_key.
// Run once: `node scripts/generateThemeImages.mjs`
// Env: reads FAL_AI_KEY from .env at the repo root.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const envPath = join(repoRoot, '.env');
const envRaw = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const FAL_KEY = env.FAL_AI_KEY;
if (!FAL_KEY) { console.error('FAL_AI_KEY missing in .env'); process.exit(1); }

const THEMES = [
  { id: 'rainforest',     prompt: 'A lush tropical rainforest canopy at dusk, golden light filtering through giant fern leaves, soft mist, dew on moss, photorealistic, cinematic, shallow depth of field' },
  { id: 'mediterranean',  prompt: 'A warm Mediterranean coastline at dusk, gentle turquoise waves lapping a pebble beach, olive groves and cypress trees on a hillside, soft pink and peach sky, photorealistic, cinematic' },
  { id: 'nordic',         prompt: 'A quiet Nordic pine forest under gentle falling snow, deep blue twilight, soft moonlight on the branches, still and peaceful, photorealistic, cinematic' },
  { id: 'tropical_storm', prompt: 'Moody tropical storm over a dark ocean, heavy rain, distant lightning on the horizon, dramatic stormy clouds, photorealistic, cinematic, night' },
  { id: 'alpine_meadow',  prompt: 'A high alpine meadow in the Swiss Alps, wildflowers, a winding cold mountain stream, snow-capped peaks in the distance, soft morning haze, photorealistic, cinematic' },
  { id: 'coastal_fog',    prompt: 'A calm rocky coastline shrouded in thick morning fog, gentle surf, a faint silhouette of a lighthouse, muted blues and greys, photorealistic, cinematic' },
];

const OUT_DIR = '/tmp/fd-hero-images';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

async function falImage(prompt) {
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) throw new Error(`fal error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error('fal response has no image url: ' + JSON.stringify(data));
  return url;
}

async function download(url, path) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path, buf);
}

function sh(cmd) {
  return execSync(cmd, { cwd: repoRoot, encoding: 'utf8' });
}

for (const t of THEMES) {
  const localPath = join(OUT_DIR, `${t.id}.jpg`);
  const storageKey = `themes/${t.id}/hero.jpg`;
  console.log(`[${t.id}] generating…`);
  const imgUrl = await falImage(t.prompt);
  console.log(`[${t.id}] downloading`);
  await download(imgUrl, localPath);
  console.log(`[${t.id}] uploading → ${storageKey}`);
  sh(`eurobase storage upload "${localPath}" "${storageKey}"`);
  console.log(`[${t.id}] updating DB`);
  sh(`eurobase db query -- "update themes set hero_key = '${storageKey}' where id = '${t.id}'"`);
}

console.log('Done.');
