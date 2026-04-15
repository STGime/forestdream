import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DisturbanceEvent as SharedEvent } from '@forestdream/shared';
import { Player } from '@/features/audio/Player';
import { AdaptiveResponder } from '@/features/audio/AdaptiveResponder';
import { SnoreDetector } from '@/features/detection/SnoreDetector.native';
import { eb } from '@/lib/eurobase';
import { resolveAssetUri } from '@/features/themes/resolveAsset';
import { setPending } from './pendingSession';

interface Args { themeId?: string; mixId?: string }

function formatElapsed(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const hh = Math.floor(mm / 60);
  const s = seconds % 60;
  return hh > 0
    ? `${hh}:${String(mm % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${mm}:${String(s).padStart(2, '0')}`;
}

export function useSleepSession(args: Args) {
  const qc = useQueryClient();
  const playerRef = useRef(new Player());
  const detectorRef = useRef(new SnoreDetector());
  const responderRef = useRef<AdaptiveResponder | null>(null);
  const startedAt = useRef<Date | null>(null);
  const eventsRef = useRef<SharedEvent[]>([]);
  const [elapsedLabel, setElapsedLabel] = useState('0:00');
  const [disturbanceCount, setDisturbanceCount] = useState(0);
  const [running, setRunning] = useState(false);
  const stoppedRef = useRef(false);

  // Independent clock — ticks every second while running, regardless of audio-load state.
  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      if (!startedAt.current || stoppedRef.current) return;
      const s = Math.floor((Date.now() - startedAt.current.getTime()) / 1000);
      setElapsedLabel(formatElapsed(s));
    }, 1000);
    return () => clearInterval(i);
  }, [running]);

  async function loadAudio() {
    const player = playerRef.current;
    try {
      await player.configure();
    } catch (e) {
      console.warn('[session] audio configure failed', e);
      return;
    }
    if (args.themeId) {
      try {
        const res = await eb.db.from('themes').eq('id', args.themeId);
        const row = (Array.isArray(res.data) ? res.data[0] : res.data) as { asset_keys?: Record<string, string> } | undefined;
        const assets = row?.asset_keys;
        if (assets) {
          for (const [key, storageKey] of Object.entries(assets)) {
            try {
              const uri = await resolveAssetUri(storageKey);
              await player.loadLayer(key, { uri }, key === 'rain' || key === 'wind' ? 0.6 : 0.8);
            } catch (e) {
              console.warn('[session] layer load failed', key, e);
            }
          }
          responderRef.current = new AdaptiveResponder(player, args.themeId);
        }
      } catch (e) {
        console.warn('[session] theme fetch failed', e);
      }
    } else if (args.mixId) {
      const res = await eb.db.from('custom_mixes').eq('id', args.mixId);
      const row = (Array.isArray(res.data) ? res.data[0] : res.data) as { elements?: { asset_key: string; volume: number }[] } | undefined;
      for (const el of row?.elements ?? []) {
        try {
          const uri = await resolveAssetUri(el.asset_key);
          await player.loadLayer(el.asset_key, { uri }, el.volume);
        } catch (e) {
          console.warn('[session] mix layer failed', el.asset_key, e);
        }
      }
    }
  }

  function start() {
    startedAt.current = new Date();
    stoppedRef.current = false;
    setRunning(true);
    setElapsedLabel('0:00');
    setDisturbanceCount(0);
    eventsRef.current = [];

    // Fire-and-forget: load audio + detector without blocking the clock.
    loadAudio().catch((e) => console.warn('[session] loadAudio error', e));
    detectorRef.current
      .start((e) => {
        eventsRef.current.push({
          detected_at: new Date(e.timestamp).toISOString(),
          kind: e.kind,
        });
        setDisturbanceCount((c) => c + 1);
        responderRef.current?.onDisturbance().then((layer) => {
          const last = eventsRef.current[eventsRef.current.length - 1];
          if (last && layer) last.response_layer = layer;
        });
      })
      .catch((e) => console.warn('[session] detector start failed', e));
  }

  async function stop(reason: 'manual' | 'alarm' | 'force_close') {
    if (stoppedRef.current) return null;
    stoppedRef.current = true;
    setRunning(false);
    await detectorRef.current.stop().catch(() => {});
    await playerRef.current.stop().catch(() => {});
    if (!startedAt.current) return null;
    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - startedAt.current.getTime()) / 1000);

    // Stash for the "Sleep Session Complete" screen — user confirms with a
    // 1–5 rating before we persist. Nothing hits the DB here.
    let themeName: string | undefined;
    if (args.themeId) {
      try {
        const res = await eb.db.from<{ name: string }>('themes').eq('id', args.themeId);
        const row = Array.isArray(res.data) ? res.data[0] : res.data;
        themeName = (row as { name?: string } | null)?.name;
      } catch { /* ignore */ }
    }
    setPending({
      startedAt: startedAt.current.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: duration,
      themeId: args.themeId,
      themeName,
      mixId: args.mixId,
      events: [...eventsRef.current],
      endedReason: reason,
    });
    qc.invalidateQueries({ queryKey: ['sessions'] });
    return { durationSeconds: duration, disturbanceCount: eventsRef.current.length };
  }

  return { start, stop, elapsedLabel, disturbanceCount };
}
