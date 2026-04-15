import type { FastifyInstance } from 'fastify';
import { LeaderboardKind } from '@forestdream/shared';
import { eb } from '../lib/eurobase.js';
import { rebuildLeaderboard } from '../lib/leaderboard.js';

export function registerLeaderboardRoutes(app: FastifyInstance) {
  app.get<{ Params: { kind: string } }>('/leaderboard/:kind', async (req, reply) => {
    const parsed = LeaderboardKind.safeParse(req.params.kind);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_kind' });
    const { data } = await eb.db
      .from('leaderboard_snapshots')
      .select('*')
      .eq('kind', parsed.data)
      .order('computed_at', { ascending: false })
      .limit(1);
    return data?.[0]?.payload ?? [];
  });

  app.post('/internal/leaderboard/rebuild', async (req, reply) => {
    if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
      return reply.code(403).send({ error: 'forbidden' });
    }
    await rebuildLeaderboard();
    return { ok: true };
  });
}
