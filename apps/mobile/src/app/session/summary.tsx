import { View, Text, Pressable, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { buildShareMessage } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => (await eb.db.from('sleep_sessions').select('*').eq('id', id)).data?.[0],
  });

  async function share() {
    const msg = buildShareMessage({ themeName: data?.theme_id, minutesLonger: Math.round((data?.duration_seconds ?? 0) / 60) });
    await Share.share({ message: msg });
  }

  if (!data) return <View style={{ flex: 1, backgroundColor: '#0b1410' }} />;
  return (
    <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700', marginBottom: 20 }}>Good morning</Text>
      <Text style={{ color: '#b7d3bf', fontSize: 18 }}>{Math.round(data.duration_seconds / 60)} minutes</Text>
      <Text style={{ color: '#b7d3bf', fontSize: 18 }}>{data.disturbance_count} disturbances</Text>
      <Text style={{ color: '#8fd19e', fontSize: 48, fontWeight: '700', marginVertical: 16 }}>{data.quality_score}</Text>
      <Text style={{ color: '#5e7366', marginBottom: 32 }}>Sleep quality</Text>
      <Pressable onPress={share} style={{ backgroundColor: '#3a6b4a', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: '#eafff0' }}>Share milestone</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#8fa997' }}>Done</Text>
      </Pressable>
    </View>
  );
}
