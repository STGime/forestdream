import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { eb } from '@/lib/eurobase';
import { ThemeCard } from '@/components/ThemeCard';
import { useProfile } from '@/features/profile/useProfile';
import type { Theme } from '@forestdream/shared';

export default function Home() {
  const profile = useProfile();
  const { data: themes } = useQuery<Theme[]>({
    queryKey: ['themes'],
    queryFn: async () => (await eb.db.from('themes').select('*').order('sort_order')).data ?? [],
  });
  const { data: mixes } = useQuery({
    queryKey: ['mixes'],
    queryFn: async () => (await eb.db.from('custom_mixes').select('*')).data ?? [],
    enabled: profile?.tier === 'premium',
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1410' }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700' }}>Good evening</Text>
      <Text style={{ color: '#8fa997', marginBottom: 20 }}>
        {profile?.tier === 'premium' ? 'Premium' : 'Free'} · {profile?.alias}
      </Text>
      <Text style={{ color: '#b7d3bf', fontSize: 16, marginBottom: 12 }}>Themes</Text>
      {themes?.map((t) => (
        <ThemeCard
          key={t.id}
          theme={t}
          locked={t.tier === 'premium' && profile?.tier !== 'premium'}
          onPress={() => {
            if (t.tier === 'premium' && profile?.tier !== 'premium') router.push('/premium/upgrade');
            else router.push({ pathname: '/session/active', params: { themeId: t.id } });
          }}
        />
      ))}
      {mixes && mixes.length > 0 && (
        <>
          <Text style={{ color: '#b7d3bf', fontSize: 16, marginVertical: 12 }}>Your mixes</Text>
          {mixes.map((m: { id: string; name: string }) => (
            <Pressable
              key={m.id}
              onPress={() => router.push({ pathname: '/session/active', params: { mixId: m.id } })}
              style={{ padding: 16, backgroundColor: '#162520', borderRadius: 12, marginBottom: 8 }}
            >
              <Text style={{ color: '#eafff0', fontWeight: '600' }}>{m.name}</Text>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}
