import { Slot } from 'expo-router';
import { useEffect } from 'react';
export default function OnboardingLayout() {
  useEffect(() => { console.log('[OnboardingLayout] mounted'); }, []);
  return <Slot />;
}
