import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { LeaderboardKind } from '@forestdream/shared';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const BORDER = '#dde4dd';
const ACCENT = '#d2b48c';
const ROW_BG = '#ede1cf';

const TABS: { id: LeaderboardKind; label: string; title: string; subtitle: string }[] = [
  { id: 'theme_usage', label: 'Most Used Themes', title: 'Most Popular Themes', subtitle: 'Themes with the most sleep sessions' },
  { id: 'quality',     label: 'Highest Quality',   title: 'Top Sleep Quality',   subtitle: 'Members with the best average sleep scores' },
  { id: 'streak',      label: 'Streaks',           title: 'Longest Streaks',     subtitle: 'Consecutive nights using ForestDream' },
];

export default function Leaderboard() {
  const [kind, setKind] = useState<LeaderboardKind>('theme_usage');
  const { data = [], isLoading } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['leaderboard', kind],
    queryFn: () => apiFetch<Array<Record<string, unknown>>>(`/leaderboard/${kind}`),
  });
  const current = TABS.find((t) => t.id === kind)!;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>🌲</Text>
        <Text style={{ color: INK, fontSize: 22, fontWeight: '700', flex: 1 }}>ForestDream</Text>
        <Text style={{ color: INK, fontSize: 22 }}>☰</Text>
      </View>

      <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 24 }} />

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 32, marginRight: 10 }}>🏆</Text>
          <Text style={{ color: INK, fontSize: 34, fontWeight: '700' }}>Leaderboard</Text>
        </View>
        <Text style={{ color: MUTED, textAlign: 'center', fontSize: 15, maxWidth: 320 }}>
          See what's working for the ForestDream community
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: '#e3e8e2', borderRadius: 999, padding: 4, marginBottom: 16 }}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setKind(t.id)}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center',
              backgroundColor: kind === t.id ? CARD : 'transparent',
            }}
          >
            <Text style={{ color: INK, fontWeight: kind === t.id ? '700' : '500', fontSize: 12 }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ backgroundColor: CARD, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER }}>
        <Text style={{ color: INK, fontSize: 20, fontWeight: '700' }}>{current.title}</Text>
        <Text style={{ color: MUTED, fontSize: 14, marginTop: 4, marginBottom: 16 }}>{current.subtitle}</Text>

        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
        ) : data.length === 0 ? (
          <Text style={{ color: MUTED, textAlign: 'center', paddingVertical: 30, fontSize: 14 }}>
            Not enough community data yet. Check back soon!
          </Text>
        ) : (
          data.map((row, i) => <Row key={i} kind={kind} row={row} />)
        )}
      </View>
    </ScrollView>
  );
}

function Row({ kind, row }: { kind: LeaderboardKind; row: Record<string, unknown> }) {
  const rank = Number(row.rank ?? 0);
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  const title = String(row.alias ?? row.theme_id ?? '—');
  const subtitle =
    kind === 'theme_usage' ? undefined :
    kind === 'quality' ? 'Avg quality' :
    'Longest streak';
  const right =
    kind === 'theme_usage' ? `${row.sessions} sessions` :
    kind === 'quality' ? `${Math.round(Number(row.avg))} / 100` :
    `${row.streak}d`;

  return (
    <View style={{ backgroundColor: ROW_BG, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: rank <= 3 ? 26 : 18, width: 44 }}>{medal}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: INK, fontSize: 17, fontWeight: '700' }}>{title}</Text>
        {subtitle && <Text style={{ color: MUTED, fontSize: 13 }}>{subtitle}</Text>}
      </View>
      <View style={{ backgroundColor: BG, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
        <Text style={{ color: INK, fontSize: 13, fontWeight: '600' }}>{right}</Text>
      </View>
    </View>
  );
}
