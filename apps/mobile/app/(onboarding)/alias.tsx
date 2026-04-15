import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { isValidAlias } from '@forestdream/shared';
import { apiFetch } from '@/lib/api';
import { eb } from '@/lib/eurobase';

export default function AliasScreen() {
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ alias: string }>('/auth/alias/suggest', { method: 'POST' })
      .then((r) => setAlias(r.alias))
      .catch(() => {});
  }, []);

  async function claim() {
    if (!isValidAlias(alias)) { setErr('Alias must be 3-24 letters/numbers.'); return; }
    setLoading(true);
    setErr(null);
    try {
      const { data: cur } = await eb.auth.getUser();
      if (!cur?.id) { router.replace('/(onboarding)/welcome'); return; }

      const { error: insErr } = await eb.db
        .from('profiles')
        .insert({ user_id: cur.id, alias, tier: 'free' });
      if (insErr) {
        const msg = String((insErr as { message?: string }).message ?? insErr);
        if (msg.toLowerCase().includes('unique')) setErr('Alias taken — try another.');
        else setErr(`Could not save alias: ${msg}`);
        return;
      }
      router.replace('/(tabs)/home');
    } catch (e) {
      setErr((e as Error).message ?? 'Could not save alias.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0b1410' }}>
      <Text style={{ color: '#eafff0', fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Choose an alias</Text>
      <Text style={{ color: '#b7d3bf', marginBottom: 24 }}>Shown on the leaderboard. No real name required.</Text>
      <TextInput
        value={alias}
        onChangeText={setAlias}
        autoCapitalize="none"
        style={{ color: '#eafff0', fontSize: 18, borderWidth: 1, borderColor: '#3a6b4a', borderRadius: 10, padding: 12, marginBottom: 12 }}
      />
      {err && <Text style={{ color: '#ff9a8a', marginBottom: 8 }}>{err}</Text>}
      <Pressable onPress={claim} disabled={loading} style={{ backgroundColor: '#3a6b4a', padding: 16, borderRadius: 12, alignItems: 'center' }}>
        {loading ? <ActivityIndicator color="#eafff0" /> : <Text style={{ color: '#eafff0', fontWeight: '600' }}>Continue</Text>}
      </Pressable>
    </View>
  );
}
