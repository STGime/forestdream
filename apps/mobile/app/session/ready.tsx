import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { eb } from '@/lib/eurobase';
import type { Theme } from '@forestdream/shared';

export default function Ready() {
  const { themeId, mixId } = useLocalSearchParams<{ themeId?: string; mixId?: string }>();
  const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    import('expo-av').then(({ Audio }) =>
      Audio.getPermissionsAsync().then((p) =>
        setMicStatus(p.granted ? 'granted' : 'denied')
      )
    );
  }, []);

  const { data: theme } = useQuery<Theme | null>({
    queryKey: ['theme', themeId],
    enabled: !!themeId,
    queryFn: async () => {
      const res = await eb.db.from<Theme>('themes').eq('id', themeId!);
      const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      return rows[0] ?? null;
    },
  });

  const { data: mix } = useQuery<{ id: string; name: string } | null>({
    queryKey: ['mix', mixId],
    enabled: !!mixId,
    queryFn: async () => {
      const res = await eb.db.from<{ id: string; name: string }>('custom_mixes').eq('id', mixId!);
      const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      return rows[0] ?? null;
    },
  });

  if ((themeId && !theme) || (mixId && !mix)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1410' }}>
        <ActivityIndicator color="#8fd19e" />
      </View>
    );
  }

  const title = theme?.name ?? mix?.name ?? 'Session';
  const description = theme?.description ?? 'Custom mix';

  function begin() {
    router.replace({
      pathname: '/session/active',
      params: themeId ? { themeId } : { mixId: mixId! },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 24, paddingTop: 80 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: '#8fa997', fontSize: 14, marginBottom: 40 }}>← Back</Text>
      </Pressable>

      <Text style={{ color: '#8fa997', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
        Ready to sleep
      </Text>
      <Text style={{ color: '#eafff0', fontSize: 36, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <Text style={{ color: '#b7d3bf', fontSize: 16, lineHeight: 24, marginBottom: 40 }}>{description}</Text>

      <View style={{ backgroundColor: '#162520', padding: 16, borderRadius: 12, marginBottom: 24 }}>
        <Text style={{ color: '#b7d3bf', fontSize: 13, marginBottom: 4 }}>Microphone</Text>
        <Text style={{ color: '#eafff0' }}>
          {micStatus === 'granted'
            ? '✓ Adaptive response enabled'
            : micStatus === 'denied'
            ? '– Sounds will play without disturbance detection'
            : 'Checking…'}
        </Text>
        {micStatus === 'denied' && (
          <Pressable
            onPress={async () => {
              const { Audio } = await import('expo-av');
              const p = await Audio.requestPermissionsAsync();
              setMicStatus(p.granted ? 'granted' : 'denied');
            }}
            style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3a6b4a', alignSelf: 'flex-start' }}
          >
            <Text style={{ color: '#8fd19e', fontSize: 13 }}>Enable microphone</Text>
          </Pressable>
        )}
      </View>

      <View style={{ backgroundColor: '#162520', padding: 16, borderRadius: 12, marginBottom: 40 }}>
        <Text style={{ color: '#b7d3bf', fontSize: 13, marginBottom: 4 }}>Tip</Text>
        <Text style={{ color: '#eafff0', lineHeight: 22 }}>
          Place the phone within arm's reach, screen down. The display will dim automatically.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={begin}
        style={{ backgroundColor: '#3a6b4a', padding: 18, borderRadius: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#eafff0', fontSize: 17, fontWeight: '600' }}>Start session</Text>
      </Pressable>
    </View>
  );
}
