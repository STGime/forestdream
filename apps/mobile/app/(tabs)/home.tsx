import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { eb } from '@/lib/eurobase';
import { useProfile } from '@/features/profile/useProfile';
import { THEME_TAGS, THEME_COLORS, mixTags } from '@/features/themes/tags';
import type { Theme } from '@forestdream/shared';

const BG = '#eef2ed';
const CARD = '#ffffff';
const INK = '#1b2e1f';
const MUTED = '#6b8069';
const ACCENT = '#d2b48c';

type Selection = { kind: 'theme'; id: string } | { kind: 'mix'; id: string } | null;

interface Mix { id: string; name: string; elements: Array<{ asset_key: string }> }

export default function Home() {
  const profile = useProfile();
  const [selected, setSelected] = useState<Selection>(null);

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ['themes'],
    queryFn: async () => {
      const res = await eb.db.from<Theme>('themes').order('sort_order');
      return (Array.isArray(res.data) ? res.data : res.data ? [res.data] : []) as Theme[];
    },
  });

  const { data: mixes = [] } = useQuery<Mix[]>({
    queryKey: ['mixes'],
    queryFn: async () => {
      const res = await eb.db.from<Mix>('custom_mixes');
      return (Array.isArray(res.data) ? res.data : res.data ? [res.data] : []) as Mix[];
    },
    enabled: profile?.tier === 'premium',
  });

  function begin() {
    if (!selected) return;
    router.push({
      pathname: '/session/ready',
      params: selected.kind === 'theme' ? { themeId: selected.id } : { mixId: selected.id },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 140 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: INK, fontSize: 32, fontWeight: '700' }}>🌲 ForestDream</Text>
          <Text style={{ color: MUTED, textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
            Choose a forest soundscape to help you drift into peaceful sleep
          </Text>
          <View style={{ marginTop: 10, backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: INK, fontWeight: '600', fontSize: 12 }}>
              {profile?.tier === 'premium' ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>

        <Text style={{ color: INK, fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Sleep Themes</Text>
        {themes.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            locked={t.tier === 'premium' && profile?.tier !== 'premium'}
            selected={selected?.kind === 'theme' && selected.id === t.id}
            onPress={() => {
              if (t.tier === 'premium' && profile?.tier !== 'premium') {
                router.push('/premium/upgrade');
                return;
              }
              setSelected({ kind: 'theme', id: t.id });
            }}
          />
        ))}

        {mixes.length > 0 && (
          <>
            <Text style={{ color: INK, fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 12 }}>
              Your Custom Mixes
            </Text>
            {mixes.map((m) => (
              <MixCard
                key={m.id}
                mix={m}
                selected={selected?.kind === 'mix' && selected.id === m.id}
                onPress={() => setSelected({ kind: 'mix', id: m.id })}
              />
            ))}
          </>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: BG, borderTopWidth: 1, borderTopColor: '#dde4dd' }}>
        <Pressable
          onPress={begin}
          disabled={!selected}
          style={{
            backgroundColor: selected ? ACCENT : '#e2d9ca',
            padding: 16, borderRadius: 14, alignItems: 'center',
          }}
        >
          <Text style={{ color: INK, fontWeight: '600', fontSize: 16, opacity: selected ? 1 : 0.6 }}>
            {selected ? 'Start sleep session' : 'Select a theme to begin'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ThemeCard({ theme, locked, selected, onPress }: { theme: Theme; locked: boolean; selected: boolean; onPress: () => void }) {
  const color = THEME_COLORS[theme.id] ?? { from: '#7a8b7d', to: '#c0c9c0', emoji: '🌲' };
  const tags = THEME_TAGS[theme.id] ?? [];
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: CARD,
        borderRadius: 16,
        marginBottom: 14,
        overflow: 'hidden',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? ACCENT : '#e3e8e2',
      }}
    >
      <View style={{ height: 120, backgroundColor: color.from, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', right: -20, bottom: -20, width: 180, height: 180, backgroundColor: color.to, borderRadius: 90, opacity: 0.55 }} />
        <Text style={{ fontSize: 54 }}>{color.emoji}</Text>
      </View>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: INK, fontSize: 20, fontWeight: '700', flex: 1 }}>{theme.name}</Text>
          {locked && (
            <View style={{ backgroundColor: ACCENT, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14 }}>✨</Text>
            </View>
          )}
        </View>
        <Text style={{ color: MUTED, fontSize: 14, marginBottom: 10 }}>{theme.description}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {tags.map((t) => <Pill key={t} label={t} />)}
        </View>
      </View>
    </Pressable>
  );
}

function MixCard({ mix, selected, onPress }: { mix: Mix; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: CARD,
        borderRadius: 16, padding: 16, marginBottom: 14,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? ACCENT : '#e3e8e2',
      }}
    >
      <Text style={{ color: INK, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>{mix.name}</Text>
      <Text style={{ color: MUTED, fontSize: 14, marginBottom: 10 }}>Custom mix</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {mixTags(mix.elements ?? []).map((t) => <Pill key={t} label={t} />)}
      </View>
    </Pressable>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: '#dde4dd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 6, marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
