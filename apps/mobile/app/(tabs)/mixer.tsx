import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { canAccess, MAX_CUSTOM_MIXES } from '@forestdream/shared';
import { useProfile } from '@/features/profile/useProfile';
import { eb } from '@/lib/eurobase';
import { Player } from '@/features/audio/Player';
import { resolveAssetUri } from '@/features/themes/resolveAsset';
import { generateAndUploadMixImage } from '@/features/themes/generateMixImage';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const BORDER = '#dde4dd';
const ACCENT = '#d2b48c';

interface Sound { key: string; label: string; description: string }
const SOUNDS: Sound[] = [
  { key: 'themes/rainforest/rain.m4a',     label: 'Rain',        description: 'Gentle rainfall' },
  { key: 'themes/tropical_storm/thunder.m4a', label: 'Thunder',   description: 'Distant thunder' },
  { key: 'themes/nordic/wind.m4a',         label: 'Wind',        description: 'Soft wind through trees' },
  { key: 'themes/coastal_fog/surf.m4a',    label: 'Ocean Waves', description: 'Gentle waves' },
  { key: 'themes/rainforest/birds.m4a',    label: 'Birds',       description: 'Forest birds' },
  { key: 'themes/mediterranean/cicadas.m4a', label: 'Cicadas',   description: 'Summer evening' },
  { key: 'themes/nordic/owl.m4a',          label: 'Owl',         description: 'Nocturnal calls' },
  { key: 'themes/alpine_meadow/stream.m4a', label: 'Stream',     description: 'Flowing water' },
  { key: 'themes/alpine_meadow/bells.m4a', label: 'Bells',       description: 'Distant cowbells' },
  { key: 'themes/coastal_fog/foghorn.m4a', label: 'Foghorn',     description: 'Low horn' },
];

interface Mix { id: string; name: string; elements: Array<{ asset_key: string; volume: number }> }

export default function Mixer() {
  const profile = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [previewing, setPreviewing] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const playerRef = useRef<Player | null>(null);
  const previewKeyRef = useRef<string>('');
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function stopPreview() {
    setPreviewing(false);
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (playerRef.current) {
      await playerRef.current.stop().catch(() => {});
      playerRef.current = null;
    }
  }

  // Live-update volumes while previewing without reloading layers.
  useEffect(() => {
    if (!previewing || !playerRef.current) return;
    for (const [k, v] of Object.entries(selected)) {
      playerRef.current.setLayerVolume(k, v, 200).catch(() => {});
    }
  }, [selected, previewing]);

  // Stop preview when leaving the tab. Must use a stable callback or
  // useFocusEffect will re-run on every render and immediately call the
  // cleanup, killing the preview within the first render cycle.
  useFocusEffect(
    useCallback(() => () => { stopPreview(); }, [])
  );

  useEffect(() => () => { stopPreview(); }, []);

  async function startPreview() {
    if (Object.keys(selected).length === 0) return;
    setLoadingPreview(true);
    try {
      const snapshotKey = Object.keys(selected).sort().join('|');
      previewKeyRef.current = snapshotKey;
      const p = new Player();
      try { await p.configure(); console.log('[mixer] audio configured'); } catch (e) { console.warn('[mixer] configure failed', e); }
      let loaded = 0;
      for (const [key, vol] of Object.entries(selected)) {
        try {
          console.log('[mixer] resolving', key);
          const uri = await resolveAssetUri(key);
          console.log('[mixer] got uri', uri.slice(0, 80) + '…');
          await p.loadLayer(key, { uri }, vol);
          loaded += 1;
          console.log('[mixer] loaded layer', key, 'vol', vol);
        } catch (e) {
          console.warn('[mixer] layer failed', key, (e as Error).message);
        }
      }
      if (previewKeyRef.current !== snapshotKey) {
        await p.stop().catch(() => {});
        return;
      }
      if (loaded === 0) {
        console.warn('[mixer] no layers loaded — preview aborted');
        Alert.alert('Preview failed', 'Could not load audio. Check Metro logs.');
        return;
      }
      playerRef.current = p;
      setPreviewing(true);
      console.log('[mixer] preview started with', loaded, 'layer(s)');
      // Auto-stop after 10 s. Stems are longer than 10 s and looping is on,
      // so shorter clips would still sound continuous inside the window.
      previewTimerRef.current = setTimeout(() => { stopPreview(); }, 10_000);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function togglePreview() {
    if (previewing) await stopPreview();
    else await startPreview();
  }

  const { data: mixes = [] } = useQuery<Mix[]>({
    queryKey: ['mixes'],
    queryFn: async () => {
      const res = await eb.db.from<Mix>('custom_mixes');
      return (Array.isArray(res.data) ? res.data : res.data ? [res.data] : []) as Mix[];
    },
    enabled: profile?.tier === 'premium',
  });

  if (!profile) return <View style={{ flex: 1, backgroundColor: BG }} />;
  if (!canAccess('custom_mixes', profile.tier)) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: CARD, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: BORDER, alignItems: 'center' }}>
          <Text style={{ color: INK, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>✨ Premium feature</Text>
          <Text style={{ color: MUTED, textAlign: 'center', marginBottom: 16 }}>Custom mixing is a Premium feature.</Text>
          <Pressable onPress={() => router.replace('/premium/upgrade')} style={{ backgroundColor: ACCENT, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}>
            <Text style={{ color: INK, fontWeight: '600' }}>Upgrade</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const selectedEntries = Object.entries(selected);
  const count = selectedEntries.length;

  function toggle(key: string) {
    setSelected((s) => {
      const next = { ...s };
      if (next[key] === undefined) next[key] = 0.75;
      else delete next[key];
      return next;
    });
    // Layer set changed — preview must be rebuilt next time user taps Preview.
    if (previewing) stopPreview();
  }

  function setVol(key: string, v: number) {
    setSelected((s) => ({ ...s, [key]: v }));
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Give your mix a name'); return; }
    if (count < 2) { Alert.alert('Pick at least 2 sounds'); return; }
    if (mixes.length >= MAX_CUSTOM_MIXES) { Alert.alert(`Max ${MAX_CUSTOM_MIXES} mixes`); return; }
    const elements = selectedEntries.map(([k, v]) => ({ asset_key: k, volume: v }));
    const { data: user } = await eb.auth.getUser();
    if (!user?.id) { Alert.alert('Not signed in'); return; }
    setSaving(true);
    try {
      const ins = await eb.db.from<{ id: string }>('custom_mixes')
        .insert({ user_id: user.id, name: name.trim(), elements });
      if (ins.error) { Alert.alert('Could not save', String(ins.error)); return; }
      const row = Array.isArray(ins.data) ? ins.data[0] : ins.data;
      const mixId = (row as { id?: string } | null)?.id;

      if (mixId) {
        // Fire-and-forget: image generation can take a few seconds and the
        // card falls back to a solid color until the key lands.
        generateAndUploadMixImage(mixId, name.trim(), elements)
          .then((imageKey) => eb.db.from('custom_mixes').update(mixId, { image_key: imageKey }))
          .then(() => qc.invalidateQueries({ queryKey: ['mixes'] }))
          .catch((e) => console.warn('[mix] image gen failed', e));
      }

      qc.invalidateQueries({ queryKey: ['mixes'] });
      setName('');
      setSelected({});
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await eb.db.from('custom_mixes').delete(id);
    qc.invalidateQueries({ queryKey: ['mixes'] });
  }

  function load(mix: Mix) {
    setName(mix.name);
    const next: Record<string, number> = {};
    for (const el of mix.elements) next[el.asset_key] = el.volume;
    setSelected(next);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>🌲</Text>
        <Text style={{ color: INK, fontSize: 22, fontWeight: '700', flex: 1 }}>ForestDream</Text>
        <Text style={{ color: INK, fontSize: 22 }}>☰</Text>
      </View>
      <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 20 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 28, marginRight: 8 }}>✨</Text>
        <Text style={{ color: INK, fontSize: 28, fontWeight: '700' }}>Custom Sound Mixer</Text>
      </View>
      <Text style={{ color: MUTED, fontSize: 15, marginBottom: 20 }}>
        Create your perfect soundscape by mixing individual elements
      </Text>

      {/* Available Sounds */}
      <View style={panel}>
        <Text style={h2}>Available Sounds</Text>
        <Text style={sub}>Select sounds to add to your mix</Text>
        {SOUNDS.map((s) => {
          const active = selected[s.key] !== undefined;
          return (
            <Pressable
              key={s.key}
              onPress={() => toggle(s.key)}
              style={{
                borderWidth: 1,
                borderColor: active ? ACCENT : BORDER,
                backgroundColor: active ? '#faf1e1' : CARD,
                borderRadius: 14, padding: 14, marginBottom: 10,
              }}
            >
              <Text style={{ color: INK, fontSize: 16, fontWeight: '700' }}>{s.label}</Text>
              <Text style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>{s.description}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Your Mix */}
      <View style={[panel, { marginTop: 20 }]}>
        <Text style={h2}>Your Mix</Text>
        <Text style={sub}>{count} sound{count === 1 ? '' : 's'} selected</Text>

        {count === 0 ? (
          <Text style={{ color: MUTED, textAlign: 'center', paddingVertical: 30 }}>
            Select sounds above to start creating your mix
          </Text>
        ) : (
          <>
            {selectedEntries.map(([key, v]) => {
              const s = SOUNDS.find((x) => x.key === key);
              return (
                <View key={key} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: INK, fontWeight: '700' }}>{s?.label ?? key}</Text>
                    <Text style={{ color: MUTED }}>{Math.round(v * 100)}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    {[0.25, 0.5, 0.75, 1].map((val) => (
                      <Pressable
                        key={val}
                        onPress={() => setVol(key, val)}
                        style={{
                          flex: 1, paddingVertical: 10, marginRight: 4, borderRadius: 8, alignItems: 'center',
                          backgroundColor: Math.abs(v - val) < 0.01 ? ACCENT : '#f1f4f0',
                          borderWidth: 1, borderColor: BORDER,
                        }}
                      >
                        <Text style={{ color: INK, fontSize: 12 }}>{Math.round(val * 100)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}

            <Pressable
              onPress={togglePreview}
              disabled={loadingPreview}
              style={{
                borderWidth: 1, borderColor: previewing ? ACCENT : BORDER,
                backgroundColor: previewing ? '#faf1e1' : CARD,
                paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                marginTop: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'center',
              }}
            >
              {loadingPreview ? (
                <ActivityIndicator color={ACCENT} />
              ) : (
                <>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>{previewing ? '⏹' : '▶'}</Text>
                  <Text style={{ color: INK, fontWeight: '600' }}>
                    {previewing ? 'Stop preview' : 'Preview mix'}
                  </Text>
                </>
              )}
            </Pressable>

            <TextInput
              placeholder="Mix name"
              placeholderTextColor={MUTED}
              value={name}
              onChangeText={setName}
              style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: INK, fontSize: 15, marginTop: 4, marginBottom: 10 }}
            />
            <Pressable onPress={save} disabled={saving} style={{ backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
              <Text style={{ color: INK, fontWeight: '600' }}>{saving ? 'Saving…' : 'Save mix'}</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Saved Mixes */}
      <View style={[panel, { marginTop: 20 }]}>
        <Text style={h2}>Saved Mixes</Text>
        <Text style={sub}>{mixes.length}/{MAX_CUSTOM_MIXES} mixes</Text>
        {mixes.length === 0 ? (
          <Text style={{ color: MUTED, textAlign: 'center', paddingVertical: 20 }}>No saved mixes yet.</Text>
        ) : mixes.map((m) => (
          <View key={m.id} style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: INK, fontWeight: '700', fontSize: 16 }}>{m.name}</Text>
              <Text style={{ color: MUTED, fontSize: 13 }}>{m.elements.length} sounds</Text>
            </View>
            <Pressable onPress={() => load(m)} style={{ borderWidth: 1, borderColor: BORDER, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginRight: 10 }}>
              <Text style={{ color: INK, fontSize: 13 }}>Load</Text>
            </Pressable>
            <Pressable onPress={() => remove(m.id)} hitSlop={8}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const panel = { backgroundColor: CARD, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER } as const;
const h2 = { color: INK, fontSize: 18, fontWeight: '700' as const };
const sub = { color: MUTED, fontSize: 14, marginTop: 2, marginBottom: 14 } as const;
