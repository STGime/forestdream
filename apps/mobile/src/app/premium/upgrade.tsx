import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from '@/features/iap/useSubscription';

const FEATURES = [
  'All premium soundscapes',
  'Unlimited sleep history',
  'Advanced statistics',
  'Custom sound mixing (up to 10 mixes)',
];

export default function Upgrade() {
  const { purchase, loading } = useSubscription();
  return (
    <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 24, paddingTop: 60 }}>
      <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700', marginBottom: 20 }}>ForestDream Premium</Text>
      {FEATURES.map((f) => (
        <Text key={f} style={{ color: '#b7d3bf', marginBottom: 8 }}>✓ {f}</Text>
      ))}
      <View style={{ flex: 1 }} />
      <Pressable disabled={loading} onPress={() => purchase('monthly')} style={{ backgroundColor: '#3a6b4a', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#eafff0' }}>Monthly</Text>
      </Pressable>
      <Pressable disabled={loading} onPress={() => purchase('annual')} style={{ backgroundColor: '#3a6b4a', padding: 16, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: '#eafff0' }}>Annual (save 40%)</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/premium/mixer')} style={{ padding: 14, alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: '#8fa997' }}>Custom mixer →</Text>
      </Pressable>
    </View>
  );
}
