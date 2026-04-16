import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from '@/features/iap/useSubscription';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const ACCENT = '#d2b48c';

const FEATURES = [
  'All premium soundscapes',
  'Unlimited sleep history',
  'Advanced statistics',
  'Custom sound mixing (up to 10 mixes)',
];

export default function Upgrade() {
  const { purchase, loading } = useSubscription();
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 220 }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          hitSlop={12}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ color: INK, fontSize: 15 }}>← Back</Text>
        </Pressable>

        <Text style={{ color: INK, fontSize: 32, fontWeight: '700', marginBottom: 20 }}>ForestDream Premium</Text>

        <View style={{ backgroundColor: CARD, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e3e8e2' }}>
          {FEATURES.map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: ACCENT, fontWeight: '700', marginRight: 10, fontSize: 16 }}>✓</Text>
              <Text style={{ color: INK, fontSize: 15, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: BG, borderTopWidth: 1, borderTopColor: '#dde4dd' }}>
        <Pressable
          disabled={loading}
          onPress={() => purchase('monthly')}
          style={{ backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 }}
        >
          <Text style={{ color: INK, fontWeight: '600', fontSize: 16 }}>Monthly</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={() => purchase('annual')}
          style={{ backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 }}
        >
          <Text style={{ color: INK, fontWeight: '600', fontSize: 16 }}>Annual (save 40%)</Text>
        </Pressable>
      </View>
    </View>
  );
}
