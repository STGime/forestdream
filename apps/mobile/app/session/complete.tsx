import { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { eb } from '@/lib/eurobase';
import { peekPending, takePending } from '@/features/session/pendingSession';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const ACCENT = '#d2b48c';

export default function Complete() {
  const qc = useQueryClient();
  const pending = useMemo(() => peekPending(), []);
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  if (!pending) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: CARD, borderRadius: 20, padding: 24, alignItems: 'center' }}>
          <Text style={{ color: INK, fontSize: 18, marginBottom: 12 }}>No session to save</Text>
          <Pressable onPress={() => router.replace('/(tabs)/home')} style={primaryBtn}>
            <Text style={primaryTxt}>Back home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const minutes = Math.round(pending.durationSeconds / 60);

  async function save() {
    if (!rating) { Alert.alert('Please tap a rating (1–5) first.'); return; }
    setSaving(true);
    try {
      const { data: user } = await eb.auth.getUser();
      const { data } = await eb.db.from('sleep_sessions').insert({
        user_id: user?.id,
        theme_id: pending!.themeId ?? null,
        custom_mix_id: pending!.mixId ?? null,
        started_at: pending!.startedAt,
        ended_at: pending!.endedAt,
        duration_seconds: pending!.durationSeconds,
        disturbance_count: pending!.events.length,
        quality_score: rating * 20,
        ended_reason: pending!.endedReason,
      });
      const row = Array.isArray(data) ? data[0] : data;
      const id = (row as { id?: string } | null)?.id;
      if (id && pending!.events.length > 0) {
        for (const e of pending!.events) {
          await eb.db.from('disturbance_events').insert({
            session_id: id,
            detected_at: e.detected_at,
            kind: e.kind,
            response_layer: e.response_layer ?? null,
          });
        }
      }
      takePending();
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['sessions-summary'] });
      router.replace({ pathname: '/session/summary', params: { id: id ?? '' } });
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    takePending();
    router.replace('/(tabs)/home');
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 20 }}>
      <View style={{ backgroundColor: CARD, borderRadius: 20, padding: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: INK, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>Sleep Session Complete</Text>
            <Text style={{ color: MUTED, fontSize: 15, marginTop: 4 }}>How was your sleep quality?</Text>
          </View>
          <Pressable onPress={discard} hitSlop={8} style={{ marginLeft: -24 }}>
            <Text style={{ color: MUTED, fontSize: 22 }}>✕</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 24 }}>
          <Row label="Duration" value={`${minutes} minute${minutes === 1 ? '' : 's'}`} />
          <Row label="Disturbances" value={String(pending.events.length)} />
          <Row label="Theme" value={pending.themeName ?? (pending.mixId ? 'Custom mix' : '—')} />
        </View>

        <Text style={{ color: INK, fontWeight: '700', marginTop: 24, marginBottom: 10 }}>Quality Score (1–5)</Text>
        <View style={{ flexDirection: 'row' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              style={{
                flex: 1,
                paddingVertical: 16,
                marginHorizontal: 4,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: rating === n ? ACCENT : CARD,
                borderWidth: 1,
                borderColor: rating === n ? ACCENT : '#dde4dd',
              }}
            >
              <Text style={{ color: INK, fontSize: 18, fontWeight: '600' }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 24 }}>
          <Pressable onPress={discard} style={[outlineBtn, { flex: 1, marginRight: 8 }]}>
            <Text style={outlineTxt}>Discard</Text>
          </Pressable>
          <Pressable onPress={save} disabled={saving} style={[primaryBtn, { flex: 1, marginLeft: 8, opacity: saving ? 0.7 : 1 }]}>
            <Text style={primaryTxt}>{saving ? 'Saving…' : 'Save Session'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
      <Text style={{ color: MUTED, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: INK, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const primaryBtn = { backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center' } as const;
const primaryTxt = { color: INK, fontSize: 15, fontWeight: '600' } as const;
const outlineBtn = { borderWidth: 1, borderColor: '#dde4dd', paddingVertical: 14, borderRadius: 12, alignItems: 'center' } as const;
const outlineTxt = { color: INK, fontSize: 15 } as const;
