import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { eb } from '@/lib/eurobase';

export default function Index() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await eb.auth.getUser();
        if (cancelled) return;
        if (!data?.id) {
          router.replace('/(onboarding)/welcome');
          return;
        }
        const res = await eb.db.from('profiles').eq('user_id', data.id);
        const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
        router.replace(rows.length > 0 ? '/(tabs)/home' : '/(onboarding)/alias');
      } catch (e) {
        console.warn('[Index] routing failed', e);
        if (!cancelled) router.replace('/(onboarding)/welcome');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1410' }}>
      <ActivityIndicator color="#8fd19e" size="large" />
      <Text style={{ color: '#8fa997', marginTop: 12, fontSize: 16 }}>ForestDream</Text>
    </View>
  );
}
