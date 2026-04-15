import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Welcome() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0b1410' }}>
      <Text style={{ color: '#eafff0', fontSize: 32, fontWeight: '700', marginBottom: 12 }}>ForestDream</Text>
      <Text style={{ color: '#b7d3bf', fontSize: 16, lineHeight: 24, marginBottom: 48 }}>
        Fall asleep faster with forest soundscapes that respond to you. We listen for disturbances on your device — no audio ever leaves your phone.
      </Text>
      <Pressable
        onPress={() => router.push('/(onboarding)/permissions')}
        style={{ backgroundColor: '#3a6b4a', padding: 16, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#eafff0', fontWeight: '600' }}>Get started</Text>
      </Pressable>
    </View>
  );
}
