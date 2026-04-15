import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { computeQualityScore, type DisturbanceEvent as SharedEvent } from '@forestdream/shared';
import { Player } from '@/features/audio/Player';
import { AdaptiveResponder } from '@/features/audio/AdaptiveResponder';
import { SnoreDetector } from '@/features/detection/SnoreDetector.native';
import { eb } from '@/lib/eurobase';
import { resolveAssetUri } from '@/features/themes/resolveAsset';

interface Args { themeId?: string; mixId?: string }

export function useSleepSession(args: Args) {
  const qc = useQueryClient();
  const playerRef = useRef(new Player());
  const detectorRef = useRef(new SnoreDetector());
  const responderRef = useRef<AdaptiveResponder | null>(null);
  const startedAt = useRef<Date | null>(null);
  const eventsRef = useRef<SharedEvent[]>([]);
  const [elapsedLabel, setElapsedLabel] = useState('0:00');
  const [disturbanceCount, setDisturbanceCount] = useState(0);
  const stoppedRef = useRef(false);

  async function start() {
    startedAt.current = new Date();
    stoppedRef.current = false;
    const player = playerRef.current;
    await player.configure();

    if (args.themeId) {
      const { data } = await eb.db.from('themes').select('asset_keys').eq('id', args.themeId);
      const assets = data?.[0]?.asset_keys as Record<string, string> | undefined;
      if (assets) {
        for (const [key, storageKey] of Object.entries(assets)) {
          const uri = await resolveAssetUri(storageKey);
          await player.loadLayer(key, uri, key === 'rain' || key === 'wind' ? 0.6 : 0.8);
        }
        responderRef.current = new AdaptiveResponder(player, args.themeId);
      }
    } else if (args.mixId) {
      const { data } = await eb.db.from('custom_mixes').select('elements').eq('id', args.mixId);
      const elements = (data?.[0]?.elements ?? []) as { asset_key: string; volume: number }[];
      for (const el of elements) {
        const uri = await resolveAssetUri(el.asset_key);
        await player.loadLayer(el.asset_key, uri, el.volume);
      }
    }

    await detectorRef.current.start((e) => {
      eventsRef.current.push({
        detected_at: new Date(e.timestamp).toISOString(),
        kind: e.kind,
      });
      setDisturbanceCount((c) => c + 1);
      responderRef.current?.onDisturbance().then((layer) => {
        const last = eventsRef.current[eventsRef.current.length - 1];
        if (last && layer) last.response_layer = layer;
      });
    });

    const tick = setInterval(() => {
      if (!startedAt.current || stoppedRef.current) { clearInterval(tick); return; }
      const s = Math.floor((Date.now() - startedAt.current.getTime()) / 1000);
      const mm = Math.floor(s / 60);
      const hh = Math.floor(mm / 60);
      setElapsedLabel(hh > 0 ? `${hh}:${String(mm % 60).padStart(2, '0')}` : `${mm}:${String(s % 60).padStart(2, '0')}`);
    }, 1000);
  }

  async function stop(reason: 'manual' | 'alarm' | 'force_close') {
    if (stoppedRef.current) return null;
    stoppedRef.current = true;
    await detectorRef.current.stop().catch(() => {});
    await playerRef.current.stop().catch(() => {});
    if (!startedAt.current) return null;
    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - startedAt.current.getTime()) / 1000);
    const quality = computeQualityScore(duration, eventsRef.current.length);
    const { data: user } = await eb.auth.getUser();
    const { data: inserted } = await eb.db.from('sleep_sessions').insert({
      user_id: user?.user?.id,
      theme_id: args.themeId ?? null,
      custom_mix_id: args.mixId ?? null,
      started_at: startedAt.current.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_seconds: duration,
      disturbance_count: eventsRef.current.length,
      quality_score: quality,
      ended_reason: reason,
    }).select('id');
    const id = inserted?.[0]?.id;
    if (id && eventsRef.current.length > 0) {
      await eb.db.from('disturbance_events').insert(
        eventsRef.current.map((e) => ({
          session_id: id,
          detected_at: e.detected_at,
          kind: e.kind,
          response_layer: e.response_layer ?? null,
        }))
      );
    }
    qc.invalidateQueries({ queryKey: ['sessions'] });
    return { id, quality };
  }

  return { start, stop, elapsedLabel, disturbanceCount };
}
