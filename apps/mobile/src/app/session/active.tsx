import { useEffect, useState } from 'react';
import { View, Text, Pressable, Slider as RNSlider } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useSleepSession } from '@/features/session/useSleepSession';

export default function Active() {
  useKeepAwake();
  const { themeId, mixId } = useLocalSearchParams<{ themeId?: string; mixId?: string }>();
  const session = useSleepSession({ themeId, mixId });
  const [dim, setDim] = useState(false);

  useEffect(() => {
    session.start();
    const t = setTimeout(() => setDim(true), 15000);
    return () => { clearTimeout(t); session.stop('force_close'); };
  }, []);

  async function end() {
    const summary = await session.stop('manual');
    if (summary) router.replace({ pathname: '/session/summary', params: { id: summary.id } });
    else router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: dim ? '#000' : '#0b1410', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: dim ? '#203025' : '#eafff0', fontSize: 22, textAlign: 'center', marginBottom: 8 }}>
        Sleep session
      </Text>
      <Text style={{ color: '#5e7366', textAlign: 'center', marginBottom: 40 }}>
        {session.elapsedLabel} · {session.disturbanceCount} disturbances
      </Text>
      <Pressable onPress={end} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#3a6b4a', alignItems: 'center' }}>
        <Text style={{ color: '#8fd19e' }}>End session</Text>
      </Pressable>
    </View>
  );
}
