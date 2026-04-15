import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { isValidAlias } from '@forestdream/shared';
import { eb } from '../lib/eurobase.js';
import { requireUser } from '../middleware/auth.js';

const AliasBody = z.object({ alias: z.string() });

export function registerProfileRoutes(app: FastifyInstance) {
  app.get('/profile', async (req) => {
    const userId = requireUser(req);
    const { data } = await eb.db.from('profiles').select('*').eq('user_id', userId);
    return data?.[0] ?? null;
  });

  app.patch('/profile/alias', async (req, reply) => {
    const userId = requireUser(req);
    const body = AliasBody.parse(req.body);
    if (!isValidAlias(body.alias)) return reply.code(400).send({ error: 'invalid_alias' });
    const taken = await eb.db
      .from('profiles')
      .select('user_id')
      .eq('alias', body.alias);
    if (taken.data?.some((r: { user_id: string }) => r.user_id !== userId)) {
      return reply.code(409).send({ error: 'alias_taken' });
    }
    await eb.db
      .from('profiles')
      .update({ alias: body.alias, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    return { ok: true };
  });
}
