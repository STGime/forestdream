import { useQuery } from '@tanstack/react-query';
import type { Profile } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';

export function useProfile(): Profile | null | undefined {
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
  return data;
}
