import { View, Text, FlatList, Pressable } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { LeaderboardKind } from '@forestdream/shared';

const KINDS: { id: LeaderboardKind; label: string }[] = [
  { id: 'theme_usage', label: 'Top themes' },
  { id: 'quality', label: 'Best sleepers' },
  { id: 'streak', label: 'Streaks' },
];

export default function Leaderboard() {
  const [kind, setKind] = useState<LeaderboardKind>('theme_usage');
  const { data = [] } = useQuery({
    queryKey: ['leaderboard', kind],
    queryFn: () => apiFetch<Array<Record<string, unknown>>>(`/leaderboard/${kind}`),
  });
  return (
    <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700', marginBottom: 16 }}>Leaderboard</Text>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {KINDS.map((k) => (
          <Pressable
            key={k.id}
            onPress={() => setKind(k.id)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderRadius: 8,
              backgroundColor: kind === k.id ? '#3a6b4a' : '#162520',
            }}
          >
            <Text style={{ color: '#eafff0', fontSize: 13 }}>{k.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', padding: 12, backgroundColor: '#162520', borderRadius: 10, marginBottom: 6 }}>
            <Text style={{ color: '#8fd19e', width: 40 }}>#{String(item.rank)}</Text>
            <Text style={{ color: '#eafff0', flex: 1 }}>{String(item.alias ?? item.theme_id ?? '')}</Text>
            <Text style={{ color: '#8fa997' }}>
              {'avg' in item ? Math.round(Number(item.avg)) : 'streak' in item ? `${item.streak}d` : `${item.sessions}`}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
