import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#dde4dd' },
        tabBarActiveTintColor: '#1b2e1f',
        tabBarInactiveTintColor: '#8b9e8a',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker' }} />
      <Tabs.Screen name="mixer" options={{ title: 'Mixer' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
