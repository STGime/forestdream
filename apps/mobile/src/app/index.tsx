import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { eb } from '@/lib/eurobase';

export default function Index() {
  useEffect(() => {
    (async () => {
      const { data } = await eb.auth.getUser();
      if (data?.user) router.replace('/(tabs)/home');
      else router.replace('/(onboarding)/welcome');
    })();
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1410' }}>
      <ActivityIndicator color="#8fd19e" />
    </View>
  );
}
