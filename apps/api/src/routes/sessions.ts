import type { FastifyInstance } from 'fastify';
import { SleepSessionSchema } from '@forestdream/shared';
import { eb } from '../lib/eurobase.js';
import { requireUser } from '../middleware/auth.js';

export function registerSessionRoutes(app: FastifyInstance) {
  app.post('/sessions', async (req, reply) => {
    const userId = requireUser(req);
    const body = SleepSessionSchema.parse(req.body);

    const { data: inserted } = await eb.db
      .from('sleep_sessions')
      .insert({
        user_id: userId,
        theme_id: body.theme_id ?? null,
        custom_mix_id: body.custom_mix_id ?? null,
        started_at: body.started_at,
        ended_at: body.ended_at ?? null,
        duration_seconds: body.duration_seconds,
        disturbance_count: body.disturbance_count,
        quality_score: body.quality_score,
        ended_reason: body.ended_reason,
      })
      .select('id');

    const sessionId = inserted?.[0]?.id;
    if (sessionId && body.events.length > 0) {
      await eb.db.from('disturbance_events').insert(
        body.events.map((e) => ({
          session_id: sessionId,
          detected_at: e.detected_at,
          kind: e.kind,
          response_layer: e.response_layer ?? null,
        }))
      );
    }
    return reply.code(201).send({ id: sessionId });
  });

  app.get('/sessions', async (req) => {
    const userId = requireUser(req);
    const { data } = await eb.db
      .from('sleep_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(200);
    return data ?? [];
  });
}
