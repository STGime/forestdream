import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eb } from '../lib/eurobase.js';
import { requireUser } from '../middleware/auth.js';
import { validateReceipt } from '../lib/iap.js';

const Body = z.object({
  platform: z.enum(['ios', 'android']),
  receipt: z.string(),
  productId: z.string(),
});

export function registerIapRoutes(app: FastifyInstance) {
  app.post('/iap/validate', async (req, reply) => {
    const userId = requireUser(req);
    const body = Body.parse(req.body);
    const result = await validateReceipt(body);
    if (!result.valid) return reply.code(400).send({ error: 'invalid_receipt' });
    await eb.db
      .from('profiles')
      .update({
        tier: 'premium',
        premium_expires_at: result.expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    return { tier: 'premium', premium_expires_at: result.expiresAt };
  });
}
