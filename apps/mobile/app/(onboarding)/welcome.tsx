import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { eb } from '@/lib/eurobase';

type Mode = 'signin' | 'signup';

export default function Welcome() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setInfo(null);
    if (!email.includes('@')) { setErr('Please enter a valid email.'); return; }
    if (password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await eb.auth.signIn({ email: email.trim(), password });
        if (res.error) { setErr(String(res.error)); return; }
        await decideRouteAfterAuth();
      } else {
        const res = await eb.auth.signUp({ email: email.trim(), password });
        if (res.error) { setErr(String(res.error)); return; }
        if (!eb.auth.getSession?.()) {
          setInfo('Account created. Please check your email to confirm, then sign in.');
          setMode('signin');
          return;
        }
        router.replace('/(onboarding)/alias');
      }
    } catch (e) {
      setErr((e as Error).message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function decideRouteAfterAuth() {
    const { data: user } = await eb.auth.getUser();
    if (!user?.id) { setErr('Sign-in succeeded but no user returned.'); return; }
    const res = await eb.db.from('profiles').eq('user_id', user.id);
    const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    router.replace(rows.length > 0 ? '/(tabs)/home' : '/(onboarding)/alias');
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b1410' }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ backgroundColor: '#162520', borderRadius: 20, padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, marginRight: 8 }}>🌲</Text>
          <Text style={{ color: '#eafff0', fontSize: 28, fontWeight: '700' }}>ForestDream</Text>
        </View>
        <Text style={{ color: '#8fa997', textAlign: 'center', marginBottom: 24 }}>
          Sleep better with soothing forest sounds
        </Text>

        <View style={{ flexDirection: 'row', backgroundColor: '#0b1410', borderRadius: 999, padding: 4, marginBottom: 24 }}>
          <Tab active={mode === 'signin'} label="Sign In" onPress={() => setMode('signin')} />
          <Tab active={mode === 'signup'} label="Sign Up" onPress={() => setMode('signup')} />
        </View>

        <Text style={{ color: '#b7d3bf', fontWeight: '600', marginBottom: 6 }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#5e7366"
          style={input}
        />
        <Text style={{ color: '#b7d3bf', fontWeight: '600', marginBottom: 6, marginTop: 16 }}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          placeholderTextColor="#5e7366"
          style={input}
        />

        {err && <Text style={{ color: '#ff9a8a', marginTop: 12 }}>{err}</Text>}
        {info && <Text style={{ color: '#8fd19e', marginTop: 12 }}>{info}</Text>}

        <Pressable
          onPress={submit}
          disabled={loading}
          style={{ backgroundColor: '#c9a37a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 }}
        >
          {loading ? <ActivityIndicator color="#0b1410" /> : (
            <Text style={{ color: '#0b1410', fontWeight: '700' }}>
              {mode === 'signin' ? 'Sign In' : 'Create account'}
            </Text>
          )}
        </Pressable>

        {mode === 'signup' && (
          <Text style={{ color: '#5e7366', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            You'll need to confirm your email before signing in.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function Tab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center',
        backgroundColor: active ? '#3a6b4a' : 'transparent',
      }}
    >
      <Text style={{ color: active ? '#eafff0' : '#8fa997', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const input = {
  color: '#eafff0',
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#3a6b4a',
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  backgroundColor: '#0b1410',
} as const;
