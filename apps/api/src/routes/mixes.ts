import type { FastifyInstance } from 'fastify';
import { CustomMixSchema, MAX_CUSTOM_MIXES, isActivePremium } from '@forestdream/shared';
import { eb } from '../lib/eurobase.js';
import { requireUser } from '../middleware/auth.js';

async function assertPremium(userId: string): Promise<void> {
  const { data } = await eb.db.from('profiles').select('tier, premium_expires_at').eq('user_id', userId);
  const profile = data?.[0];
  if (!profile || !isActivePremium(profile)) {
    throw Object.assign(new Error('premium_required'), { statusCode: 402 });
  }
}

export function registerMixRoutes(app: FastifyInstance) {
  app.get('/mixes', async (req) => {
    const userId = requireUser(req);
    const { data } = await eb.db.from('custom_mixes').select('*').eq('user_id', userId);
    return data ?? [];
  });

  app.post('/mixes', async (req, reply) => {
    const userId = requireUser(req);
    await assertPremium(userId);
    const body = CustomMixSchema.parse(req.body);
    const { data: existing } = await eb.db
      .from('custom_mixes')
      .select('id')
      .eq('user_id', userId);
    if ((existing?.length ?? 0) >= MAX_CUSTOM_MIXES) {
      return reply.code(409).send({ error: 'mix_limit_exceeded' });
    }
    const { data } = await eb.db
      .from('custom_mixes')
      .insert({ user_id: userId, name: body.name, elements: body.elements })
      .select('id');
    return reply.code(201).send({ id: data?.[0]?.id });
  });

  app.delete<{ Params: { id: string } }>('/mixes/:id', async (req) => {
    const userId = requireUser(req);
    await eb.db.from('custom_mixes').delete().eq('id', req.params.id).eq('user_id', userId);
    return { ok: true };
  });
}
