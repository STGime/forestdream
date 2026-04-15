import { View, Text, Pressable } from 'react-native';
import type { Theme } from '@forestdream/shared';

export function ThemeCard({ theme, locked, onPress }: { theme: Theme; locked: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 16, borderRadius: 14, marginBottom: 10,
        backgroundColor: locked ? '#121a16' : '#162520',
        borderColor: locked ? '#1f2b23' : '#3a6b4a', borderWidth: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: '#eafff0', fontSize: 18, fontWeight: '600', flex: 1 }}>{theme.name}</Text>
        {locked && <Text style={{ color: '#b7d3bf', fontSize: 12 }}>Premium</Text>}
      </View>
      <Text style={{ color: '#8fa997', marginTop: 4, fontSize: 13 }}>{theme.description}</Text>
    </Pressable>
  );
}
