import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { canAccess, MAX_CUSTOM_MIXES, type CustomMix } from '@forestdream/shared';
import { useProfile } from '@/features/profile/useProfile';
import { eb } from '@/lib/eurobase';

const AVAILABLE = [
  { key: 'rain', label: 'Rain' },
  { key: 'wind', label: 'Wind' },
  { key: 'owl', label: 'Owl' },
  { key: 'thunder', label: 'Thunder' },
  { key: 'stream', label: 'Stream' },
  { key: 'cicadas', label: 'Cicadas' },
];

export default function Mixer() {
  const profile = useProfile();
  const [name, setName] = useState('');
  const [vols, setVols] = useState<Record<string, number>>({});

  if (!profile || !canAccess('custom_mixes', profile.tier)) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0b1410' }}>
        <Text style={{ color: '#eafff0', fontSize: 20, textAlign: 'center' }}>Custom mixing is a Premium feature.</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 14, marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: '#8fd19e' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  async function save() {
    const elements = Object.entries(vols)
      .filter(([, v]) => v > 0)
      .map(([asset_key, volume]) => ({ asset_key, volume }));
    if (elements.length < 2 || !name) return;
    const mix: CustomMix = { name, elements };
    const { data: existing } = await eb.db.from('custom_mixes').select('id');
    if ((existing?.length ?? 0) >= MAX_CUSTOM_MIXES) return;
    await eb.db.from('custom_mixes').insert({ name: mix.name, elements: mix.elements });
    router.back();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1410' }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ color: '#eafff0', fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Custom Mix</Text>
      <TextInput
        placeholder="Mix name"
        placeholderTextColor="#5e7366"
        value={name}
        onChangeText={setName}
        style={{ color: '#eafff0', borderWidth: 1, borderColor: '#3a6b4a', borderRadius: 10, padding: 12, marginBottom: 16 }}
      />
      {AVAILABLE.map((el) => (
        <View key={el.key} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#b7d3bf', marginBottom: 4 }}>
            {el.label} · {Math.round((vols[el.key] ?? 0) * 100)}%
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <Pressable
                key={v}
                onPress={() => setVols({ ...vols, [el.key]: v })}
                style={{ flex: 1, padding: 10, marginRight: 4, backgroundColor: (vols[el.key] ?? 0) === v ? '#3a6b4a' : '#162520', borderRadius: 6, alignItems: 'center' }}
              >
                <Text style={{ color: '#eafff0', fontSize: 12 }}>{Math.round(v * 100)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Pressable onPress={save} style={{ backgroundColor: '#3a6b4a', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: '#eafff0' }}>Save mix</Text>
      </Pressable>
    </ScrollView>
  );
}
