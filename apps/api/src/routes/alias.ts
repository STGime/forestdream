import type { FastifyInstance } from 'fastify';
import { generateAlias, isValidAlias } from '@forestdream/shared';
import { eb } from '../lib/eurobase.js';

export function registerAliasRoutes(app: FastifyInstance) {
  // Suggest a unique alias (up to 8 attempts).
  app.post('/auth/alias/suggest', async () => {
    for (let i = 0; i < 8; i++) {
      const alias = generateAlias();
      const { data } = await eb.db.from('profiles').select('alias').eq('alias', alias);
      if (!data || data.length === 0) return { alias };
    }
    return { alias: `${generateAlias()}${Date.now() % 1000}` };
  });

  // Check if an alias is available.
  app.get<{ Querystring: { alias: string } }>('/auth/alias/check', async (req, reply) => {
    const { alias } = req.query;
    if (!isValidAlias(alias)) return reply.code(400).send({ error: 'invalid_alias' });
    const { data } = await eb.db.from('profiles').select('alias').eq('alias', alias);
    return { available: !data || data.length === 0 };
  });
}
