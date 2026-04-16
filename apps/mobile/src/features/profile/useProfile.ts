import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Profile } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';
import { loadDevPremium } from './devPremium';

// Local dev override — swap for RevenueCat entitlements later.
function useDevPremium(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => { loadDevPremium().then(setOn); }, []);
  return on;
}

export function useProfile(): Profile | null | undefined {
  const devPremium = useDevPremium();
  const { data } = useQuery<Profile | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: user } = await eb.auth.getUser();
      if (!user?.id) return null;
      const res = await eb.db.from<Profile>('profiles').eq('user_id', user.id);
      const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      return rows[0] ?? null;
    },
  });
  if (!data) return data;
  return devPremium ? { ...data, tier: 'premium' as const } : data;
}
