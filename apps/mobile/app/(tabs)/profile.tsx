import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { eb } from '@/lib/eurobase';
import { useProfile } from '@/features/profile/useProfile';

export default function Profile() {
  const profile = useProfile();
  async function signOut() {
    await eb.auth.signOut();
    router.replace('/(onboarding)/welcome');
  }
  async function micSettings() {
    const res = await Audio.requestPermissionsAsync();
    Alert.alert('Microphone', res.granted ? 'Enabled' : 'Disabled — edit in system Settings');
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#0b1410', padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700', marginBottom: 20 }}>Profile</Text>
      <Row label="Alias" value={profile?.alias ?? '—'} />
      <Row label="Plan" value={profile?.tier ?? 'free'} />
      {profile?.premium_expires_at && <Row label="Renews" value={new Date(profile.premium_expires_at).toLocaleDateString()} />}
      <Pressable onPress={micSettings} style={btn}><Text style={btnText}>Microphone permission</Text></Pressable>
      <Pressable onPress={() => router.push('/premium/upgrade')} style={btn}><Text style={btnText}>Manage subscription</Text></Pressable>
      <Pressable onPress={signOut} style={[btn, { backgroundColor: '#3a2a2a' }]}><Text style={btnText}>Sign out</Text></Pressable>
      <Text style={{ color: '#5e7366', fontSize: 12, marginTop: 24, lineHeight: 18 }}>
        Audio is analysed entirely on-device. No recordings are ever saved or transmitted.
      </Text>
    </View>
  );
}

const btn = { backgroundColor: '#162520', padding: 14, borderRadius: 10, marginBottom: 8 } as const;
const btnText = { color: '#eafff0' } as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: '#1f2b23', borderBottomWidth: 1, marginBottom: 6 }}>
      <Text style={{ color: '#8fa997' }}>{label}</Text>
      <Text style={{ color: '#eafff0' }}>{value}</Text>
    </View>
  );
}
