import { View, Text, FlatList, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { HISTORY_FREE_DAYS, canAccess } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';
import { useProfile } from '@/features/profile/useProfile';
import { analysePatterns } from '@/features/session/analysePatterns';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const BORDER = '#dde4dd';
const ACCENT = '#d2b48c';
const BAR = '#a7c4ab';

interface Session {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  disturbance_count: number | null;
  quality_score: number | null;
  theme_id: string | null;
}

export default function Tracker() {
  const profile = useProfile();
  const full = profile ? canAccess('full_history', profile.tier) : false;

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['sessions', full],
    queryFn: async () => {
      let q = eb.db.from<Session>('sleep_sessions').order('started_at', { ascending: false });
      if (!full) {
        const cutoff = new Date(Date.now() - HISTORY_FREE_DAYS * 864e5).toISOString();
        q = q.gte('started_at', cutoff);
      }
      const res = await q;
      return (Array.isArray(res.data) ? res.data : res.data ? [res.data] : []) as Session[];
    },
  });

  const insights = analysePatterns(sessions);

  // last 7-day bars
  const days: { day: string; minutes: number; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const end = d.getTime() + 864e5;
    const mins = sessions
      .filter((s) => { const t = new Date(s.started_at).getTime(); return t >= d.getTime() && t < end; })
      .reduce((a, b) => a + (b.duration_seconds ?? 0) / 60, 0);
    days.push({ day: d.toISOString(), label: d.toLocaleDateString(undefined, { weekday: 'short' })[0], minutes: Math.round(mins) });
  }
  const maxMin = Math.max(1, ...days.map((d) => d.minutes));

  const totalMin = sessions.reduce((a, b) => a + (b.duration_seconds ?? 0) / 60, 0);
  const avgQuality = sessions.length === 0
    ? 0
    : Math.round(sessions.reduce((a, b) => a + (b.quality_score ?? 0), 0) / sessions.length);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>🌲</Text>
        <Text style={{ color: INK, fontSize: 22, fontWeight: '700', flex: 1 }}>ForestDream</Text>
        <Text style={{ color: INK, fontSize: 22 }}>☰</Text>
      </View>
      <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 24 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 28, marginRight: 8 }}>📊</Text>
        <Text style={{ color: INK, fontSize: 28, fontWeight: '700' }}>Sleep Tracker</Text>
      </View>
      <Text style={{ color: MUTED, fontSize: 15, marginBottom: 20 }}>
        Review your sessions and find what works for you
      </Text>

      {/* Totals */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <StatCard label="Sessions" value={String(sessions.length)} />
        <StatCard label="Total sleep" value={formatHm(totalMin)} />
        <StatCard label="Avg quality" value={sessions.length ? `${avgQuality}` : '—'} last />
      </View>

      {/* 7-day chart */}
      <View style={panel}>
        <Text style={h2}>Last 7 days</Text>
        <Text style={sub}>Minutes slept per night</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, marginTop: 8 }}>
          {days.map((d, i) => (
            <View key={d.day} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{
                width: 22,
                height: (d.minutes / maxMin) * 100 || 2,
                backgroundColor: i === 6 ? ACCENT : BAR,
                borderRadius: 4, marginBottom: 6,
              }} />
              <Text style={{ color: MUTED, fontSize: 11 }}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Insights */}
      <View style={[panel, { marginTop: 16 }]}>
        <Text style={h2}>Insights</Text>
        <Text style={sub}>What's working for you</Text>
        {insights.map((i, n) => (
          <View key={n} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 }}>
            <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700', marginRight: 8 }}>•</Text>
            <Text style={{ color: INK, flex: 1, lineHeight: 20 }}>{i}</Text>
          </View>
        ))}
      </View>

      {/* History list */}
      <View style={[panel, { marginTop: 16 }]}>
        <Text style={h2}>History</Text>
        <Text style={sub}>
          {full ? 'All recorded sessions' : `Last ${HISTORY_FREE_DAYS} days — upgrade for full history`}
        </Text>
        {sessions.length === 0 ? (
          <Text style={{ color: MUTED, textAlign: 'center', paddingVertical: 20 }}>No sessions yet.</Text>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={sessions}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: INK, fontWeight: '700' }}>{new Date(item.started_at).toDateString()}</Text>
                  <Text style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>
                    {Math.round((item.duration_seconds ?? 0) / 60)}m · {item.disturbance_count ?? 0} disturbances · {item.theme_id ?? 'custom'}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#f1e7d5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                  <Text style={{ color: INK, fontSize: 13, fontWeight: '700' }}>{item.quality_score ?? 0}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 14, marginRight: last ? 0 : 8, borderWidth: 1, borderColor: BORDER }}>
      <Text style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: INK, fontSize: 20, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function formatHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const panel = { backgroundColor: CARD, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER } as const;
const h2 = { color: INK, fontSize: 18, fontWeight: '700' as const };
const sub = { color: MUTED, fontSize: 14, marginTop: 2, marginBottom: 14 } as const;
