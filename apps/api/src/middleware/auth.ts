import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    jwt?: string;
  }
}

// Extracts Eurobase JWT and user id from the Authorization header.
// Verification relies on Eurobase's RLS + service key check when performing writes.
async function authPluginImpl(app: FastifyInstance) {
  app.addHook('onRequest', async (req: FastifyRequest) => {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith('Bearer ')) return;
    const jwt = hdr.slice(7);
    req.jwt = jwt;
    try {
      const [, payload] = jwt.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      req.userId = decoded.sub;
    } catch {
      // invalid token; leave userId undefined
    }
  });
}

export const authPlugin = fp(authPluginImpl);

export function requireUser(req: FastifyRequest): string {
  if (!req.userId) throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  return req.userId;
}
