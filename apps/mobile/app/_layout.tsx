import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { authReady } from '@/lib/eurobase';

const qc = new QueryClient();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    authReady.then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1410' }}>
        <ActivityIndicator color="#8fd19e" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={qc}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#0b1410' }}>
        <Slot />
      </View>
    </QueryClientProvider>
  );
}
