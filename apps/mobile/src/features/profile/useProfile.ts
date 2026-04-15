import { useQuery } from '@tanstack/react-query';
import type { Profile } from '@forestdream/shared';
import { eb } from '@/lib/eurobase';

export function useProfile(): Profile | undefined {
  const { data } = useQuery<Profile | undefined>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: user } = await eb.auth.getUser();
      if (!user?.user) return undefined;
      const { data } = await eb.db.from('profiles').select('*').eq('user_id', user.user.id);
      return data?.[0] as Profile | undefined;
    },
  });
  return data;
}
