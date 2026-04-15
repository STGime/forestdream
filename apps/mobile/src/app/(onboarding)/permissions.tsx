import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

export default function Permissions() {
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  async function request() {
    const res = await Audio.requestPermissionsAsync();
    setStatus(res.granted ? 'granted' : 'denied');
    setTimeout(() => router.push('/(onboarding)/alias'), 600);
  }

  function skip() {
    router.push('/(onboarding)/alias');
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0b1410' }}>
      <Text style={{ color: '#eafff0', fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Microphone</Text>
      <Text style={{ color: '#b7d3bf', fontSize: 15, lineHeight: 22, marginBottom: 32 }}>
        To detect snoring and respond with soothing sounds, ForestDream listens through your microphone while you sleep.
        {'\n\n'}All analysis happens on your device in real time. No audio is recorded, stored, or uploaded.
      </Text>
      <Pressable onPress={request} style={{ backgroundColor: '#3a6b4a', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#eafff0', fontWeight: '600' }}>Allow microphone</Text>
      </Pressable>
      <Pressable onPress={skip} style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ color: '#8fa997' }}>Not now</Text>
      </Pressable>
      {status !== 'idle' && (
        <Text style={{ color: '#8fa997', textAlign: 'center', marginTop: 12 }}>
          {status === 'granted' ? 'Thanks — disturbance detection enabled.' : 'No problem — you can enable it later in Settings.'}
        </Text>
      )}
    </View>
  );
}
