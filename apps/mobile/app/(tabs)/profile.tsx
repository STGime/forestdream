import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Switch, Linking } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { isValidAlias } from '@forestdream/shared';
import { useQueryClient } from '@tanstack/react-query';
import { eb } from '@/lib/eurobase';
import { useProfile } from '@/features/profile/useProfile';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const BORDER = '#dde4dd';
const ACCENT = '#d2b48c';

export default function Profile() {
  const profile = useProfile();
  const qc = useQueryClient();
  const [alias, setAlias] = useState('');
  const [saving, setSaving] = useState(false);
  const [mic, setMic] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (profile?.alias) setAlias(profile.alias); }, [profile?.alias]);
  useEffect(() => {
    Audio.getPermissionsAsync().then((p) => setMic(p.granted));
  }, []);

  const isPremium = profile?.tier === 'premium';
  const dirty = !!profile && alias !== profile.alias && isValidAlias(alias);

  async function updateAlias() {
    if (!dirty) return;
    setSaving(true); setErr(null);
    try {
      const { data: user } = await eb.auth.getUser();
      if (!user?.id) return;
      const { error } = await eb.db.from('profiles').update(user.id, { alias });
      if (error) {
        const msg = String((error as { message?: string }).message ?? error).toLowerCase();
        setErr(msg.includes('unique') ? 'Alias taken — try another.' : `Could not update: ${error}`);
        return;
      }
      qc.invalidateQueries({ queryKey: ['profile'] });
    } finally {
      setSaving(false);
    }
  }

  async function toggleMic(next: boolean) {
    if (next) {
      const p = await Audio.requestPermissionsAsync();
      setMic(p.granted);
      if (!p.granted) Linking.openSettings();
    } else {
      // Can't revoke from inside the app — send the user to system settings.
      Linking.openSettings();
    }
  }

  async function signOut() {
    await eb.auth.signOut();
    router.replace('/(onboarding)/welcome');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>🌲</Text>
        <Text style={{ color: INK, fontSize: 22, fontWeight: '700', flex: 1 }}>ForestDream</Text>
        <Text style={{ color: INK, fontSize: 22 }}>☰</Text>
      </View>
      <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 24 }} />

      <Text style={{ color: INK, fontSize: 32, fontWeight: '700' }}>Profile & Settings</Text>
      <Text style={{ color: MUTED, fontSize: 15, marginTop: 4, marginBottom: 20 }}>Manage your account and preferences</Text>

      {/* Account */}
      <View style={panel}>
        <Text style={h2}>Account Information</Text>
        <Text style={sub}>Your public profile details</Text>

        <Text style={label}>Public Alias</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={alias}
            onChangeText={setAlias}
            autoCapitalize="none"
            style={{ flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: INK, fontSize: 15, marginRight: 10 }}
          />
          <Pressable
            onPress={updateAlias}
            disabled={!dirty || saving}
            style={{ backgroundColor: ACCENT, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, opacity: dirty && !saving ? 1 : 0.55 }}
          >
            <Text style={{ color: INK, fontWeight: '600' }}>{saving ? '…' : 'Update'}</Text>
          </Pressable>
        </View>
        <Text style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>This is how you appear on leaderboards</Text>
        {err && <Text style={{ color: '#c76d60', marginTop: 6, fontSize: 13 }}>{err}</Text>}

        <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 20 }} />

        <Text style={h2}>Subscription Status</Text>
        <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          {isPremium ? (
            <View style={{ backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>✨</Text>
              <Text style={{ color: INK, fontWeight: '700' }}>Premium</Text>
            </View>
          ) : (
            <Pressable onPress={() => router.push('/premium/upgrade')}>
              <View style={{ borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: INK, fontWeight: '600' }}>Free · Upgrade →</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Permissions */}
      <View style={[panel, { marginTop: 20 }]}>
        <Text style={h2}>Permissions</Text>
        <Text style={sub}>Manage app permissions</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={{ color: INK, fontSize: 16, fontWeight: '700' }}>Microphone Access</Text>
            <Text style={{ color: MUTED, fontSize: 14, marginTop: 2 }}>Enable disturbance detection during sleep sessions</Text>
          </View>
          <Switch
            value={mic}
            onValueChange={toggleMic}
            trackColor={{ true: ACCENT, false: '#c9d0c7' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={{ backgroundColor: '#ede1cf', borderRadius: 12, padding: 14, marginTop: 16 }}>
          <Text style={{ color: INK, fontSize: 14, lineHeight: 20 }}>
            <Text style={{ fontWeight: '700' }}>🔒 Privacy Notice:</Text> All audio is processed entirely on your device. No audio data is recorded, stored, or transmitted to our servers.
          </Text>
        </View>
      </View>

      {/* Sign out */}
      <View style={[panel, { marginTop: 20 }]}>
        <Pressable onPress={signOut} style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#c76d60', fontSize: 15, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const panel = { backgroundColor: CARD, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER } as const;
const h2 = { color: INK, fontSize: 18, fontWeight: '700' as const };
const sub = { color: MUTED, fontSize: 14, marginTop: 2, marginBottom: 14 } as const;
const label = { color: INK, fontSize: 15, fontWeight: '700' as const, marginBottom: 8 };
