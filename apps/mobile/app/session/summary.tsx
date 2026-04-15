import { View, Text, Pressable, Share, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { buildShareMessage } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';
import { computeSummaryStats, type HistoryRow } from '@/features/session/summaryStats';

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
      <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#eafff0', fontSize: 22, marginBottom: 12 }}>Session not saved</Text>
        <Text style={{ color: '#8fa997', marginBottom: 24 }}>Something went wrong ending your session.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ backgroundColor: '#3a6b4a', padding: 14, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#eafff0' }}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  const stats = computeSummaryStats(id, history);
  if (!stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1410' }}>
        <ActivityIndicator color="#8fd19e" />
      </View>
    );
  }

  async function share() {
    const msg = buildShareMessage({ minutesLonger: stats!.deltaVsLastMin ?? undefined });
    await Share.share({ message: msg });
  }

  const maxMin = Math.max(1, ...stats.dailyMinutes.map((d) => d.minutes));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1410' }} contentContainerStyle={{ padding: 24, paddingTop: 80, paddingBottom: 40 }}>
      <Text style={{ color: '#8fa997', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Good morning</Text>
      <Text style={{ color: '#eafff0', fontSize: 36, fontWeight: '700', marginBottom: 24 }}>
        {stats.lastQuality}
        <Text style={{ color: '#8fa997', fontSize: 20, fontWeight: '400' }}> / 100</Text>
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

      <Text style={{ color: '#b7d3bf', fontSize: 14, marginBottom: 12 }}>Last 7 days</Text>
      <View style={{ backgroundColor: '#162520', borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120 }}>
          {stats.dailyMinutes.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 18,
                  height: (d.minutes / maxMin) * 100 || 2,
                  backgroundColor: i === 6 ? '#8fd19e' : '#3a6b4a',
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <Text style={{ color: '#5e7366', fontSize: 11 }}>{d.day[0]}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: '#5e7366', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {stats.weekSessions > 0
            ? `${stats.weekSessions} sessions · avg ${formatHm(stats.weekAvgDurationMin)}`
            : 'First session of the week'}
        </Text>
      </View>

      <Pressable onPress={share} style={{ backgroundColor: '#3a6b4a', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: '#eafff0', fontWeight: '600' }}>Share milestone</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#8fa997' }}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#162520', borderRadius: 12, padding: 14, marginRight: 8 }}>
      <Text style={{ color: '#8fa997', fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: '#eafff0', fontSize: 22, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function Insight({ text, positive }: { text: string; positive: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ color: positive ? '#8fd19e' : '#d39e8f', marginRight: 8, fontSize: 16 }}>
        {positive ? '▲' : '▼'}
      </Text>
      <Text style={{ color: '#b7d3bf', flex: 1 }}>{text}</Text>
    </View>
  );
}

function formatHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
