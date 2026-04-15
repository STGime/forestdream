import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { eb } from '@/lib/eurobase';
import type { Theme } from '@forestdream/shared';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const ACCENT = '#d2b48c';

export default function Ready() {
  const { themeId, mixId } = useLocalSearchParams<{ themeId?: string; mixId?: string }>();
  const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    import('expo-av').then(({ Audio }) =>
      Audio.getPermissionsAsync().then((p) => setMicStatus(p.granted ? 'granted' : 'denied'))
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator color={ACCENT} />
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

  async function requestMic() {
    const { Audio } = await import('expo-av');
    const p = await Audio.requestPermissionsAsync();
    setMicStatus(p.granted ? 'granted' : 'denied');
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 20 }}>
      <View style={{ backgroundColor: CARD, borderRadius: 20, padding: 32, alignItems: 'center' }}>
        <Text style={{ color: INK, fontSize: 34, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
        <Text style={{ color: MUTED, fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
          {description}
        </Text>

        <Text style={{ color: INK, fontSize: 56, fontWeight: '800', marginTop: 36, marginBottom: 36, letterSpacing: 2 }}>
          00:00:00
        </Text>

        <Pressable
          onPress={begin}
          style={{ backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 14, alignItems: 'center', width: '100%', marginBottom: 12 }}
        >
          <Text style={{ color: INK, fontSize: 16, fontWeight: '600' }}>Start Sleep Session</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          style={{ borderWidth: 1, borderColor: '#dde4dd', paddingVertical: 16, borderRadius: 14, alignItems: 'center', width: '100%' }}
        >
          <Text style={{ color: INK, fontSize: 16 }}>Back to Home</Text>
        </Pressable>

        {micStatus === 'denied' && (
          <Pressable onPress={requestMic} style={{ marginTop: 20 }}>
            <Text style={{ color: MUTED, fontSize: 13, textAlign: 'center' }}>
              Tap to enable microphone for disturbance detection
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
