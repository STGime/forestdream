import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { HISTORY_FREE_DAYS, canAccess } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';
import { useProfile } from '@/features/profile/useProfile';
import { analysePatterns } from '@/features/session/analysePatterns';

export default function Tracker() {
  const profile = useProfile();
  const full = profile ? canAccess('full_history', profile.tier) : false;

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', full],
    queryFn: async () => {
      let q = eb.db.from('sleep_sessions').select('*').order('started_at', { ascending: false });
      if (!full) {
        const cutoff = new Date(Date.now() - HISTORY_FREE_DAYS * 864e5).toISOString();
        q = q.gte('started_at', cutoff);
      }
      return (await q).data ?? [];
    },
  });

  const insights = analysePatterns(sessions);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700', marginBottom: 12 }}>Sleep Tracker</Text>
      {insights.map((i, n) => (
        <Text key={n} style={{ color: '#8fd19e', marginBottom: 6 }}>• {i}</Text>
      ))}
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        style={{ marginTop: 16 }}
        renderItem={({ item }) => (
          <View style={{ padding: 12, backgroundColor: '#162520', borderRadius: 10, marginBottom: 8 }}>
            <Text style={{ color: '#eafff0' }}>{new Date(item.started_at).toDateString()}</Text>
            <Text style={{ color: '#8fa997' }}>
              {Math.round((item.duration_seconds ?? 0) / 60)}m · {item.disturbance_count} disturbances · quality {item.quality_score}
            </Text>
            <Text style={{ color: '#5e7366', fontSize: 12 }}>{item.theme_id}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#5e7366' }}>No sessions yet.</Text>}
      />
      {!full && (
        <Text style={{ color: '#5e7366', marginTop: 12, fontSize: 12 }}>
          Free tier shows last {HISTORY_FREE_DAYS} days. Upgrade for full history.
        </Text>
      )}
    </View>
  );
}
