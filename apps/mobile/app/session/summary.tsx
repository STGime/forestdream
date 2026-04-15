import { View, Text, Pressable, Share, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { buildShareMessage } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';
import { computeSummaryStats, type HistoryRow } from '@/features/session/summaryStats';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const BORDER = '#dde4dd';
const ACCENT = '#d2b48c';
const BAR = '#a7c4ab';
const BAR_TODAY = '#6a994e';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: history = [] } = useQuery<HistoryRow[]>({
    queryKey: ['sessions-summary'],
    queryFn: async () => {
      const res = await eb.db.from<HistoryRow>('sleep_sessions').order('started_at', { ascending: false }).limit(60);
      const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      return rows as HistoryRow[];
    },
  });

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: INK, fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Session not saved</Text>
        <Text style={{ color: MUTED, marginBottom: 24 }}>Something went wrong ending your session.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: INK, fontWeight: '600' }}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  const stats = computeSummaryStats(id, history);
  if (!stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  async function share() {
    const msg = buildShareMessage({ minutesLonger: stats!.deltaVsLastMin ?? undefined });
    await Share.share({ message: msg });
  }

  const maxMin = Math.max(1, ...stats.dailyMinutes.map((d) => d.minutes));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 24, paddingTop: 72, paddingBottom: 40 }}>
      <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ marginBottom: 16 }}>
        <Text style={{ color: INK, fontSize: 15 }}>← Back</Text>
      </Pressable>

      <Text style={{ color: MUTED, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Good morning</Text>
      <Text style={{ color: INK, fontSize: 40, fontWeight: '700', marginBottom: 24 }}>
        {stats.lastQuality}
        <Text style={{ color: MUTED, fontSize: 20, fontWeight: '400' }}> / 100</Text>
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <StatCard label="Duration" value={formatHm(stats.lastDurationMin)} />
        <StatCard label="Disturbances" value={String(stats.lastDisturbances)} />
      </View>

      <View style={{ marginBottom: 24 }}>
        {stats.deltaVsLastMin !== null && (
          <Insight
            text={
              stats.deltaVsLastMin > 0
                ? `${stats.deltaVsLastMin} min longer than your last session`
                : stats.deltaVsLastMin < 0
                ? `${Math.abs(stats.deltaVsLastMin)} min shorter than your last session`
                : 'Same length as your last session'
            }
            positive={stats.deltaVsLastMin >= 0}
          />
        )}
        {stats.deltaVsWeekAvgMin !== null && (
          <Insight
            text={
              stats.deltaVsWeekAvgMin >= 0
                ? `${stats.deltaVsWeekAvgMin} min above your 7-day average`
                : `${Math.abs(stats.deltaVsWeekAvgMin)} min below your 7-day average`
            }
            positive={stats.deltaVsWeekAvgMin >= 0}
          />
        )}
      </View>

      <Text style={{ color: INK, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Last 7 days</Text>
      <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: BORDER }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120 }}>
          {stats.dailyMinutes.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 18,
                  height: (d.minutes / maxMin) * 100 || 2,
                  backgroundColor: i === 6 ? BAR_TODAY : BAR,
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <Text style={{ color: MUTED, fontSize: 11 }}>{d.day[0]}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {stats.weekSessions > 0
            ? `${stats.weekSessions} sessions · avg ${formatHm(stats.weekAvgDurationMin)}`
            : 'First session of the week'}
        </Text>
      </View>

      <Pressable onPress={share} style={{ backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: INK, fontWeight: '600', fontSize: 15 }}>Share milestone</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ paddingVertical: 14, alignItems: 'center' }}>
        <Text style={{ color: MUTED }}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 14, marginRight: 8, borderWidth: 1, borderColor: BORDER }}>
      <Text style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: INK, fontSize: 22, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function Insight({ text, positive }: { text: string; positive: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ color: positive ? BAR_TODAY : '#c76d60', marginRight: 8, fontSize: 16 }}>
        {positive ? '▲' : '▼'}
      </Text>
      <Text style={{ color: INK, flex: 1 }}>{text}</Text>
    </View>
  );
}

function formatHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
