import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import cron from 'node-cron';
import { registerAliasRoutes } from './routes/alias.js';
import { registerProfileRoutes } from './routes/profile.js';
import { registerIapRoutes } from './routes/iap.js';
import { registerSessionRoutes } from './routes/sessions.js';
import { registerLeaderboardRoutes } from './routes/leaderboard.js';
import { registerMixRoutes } from './routes/mixes.js';
import { rebuildLeaderboard } from './lib/leaderboard.js';
import { authPlugin } from './middleware/auth.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
await app.register(authPlugin);

app.get('/health', async () => ({ ok: true }));

registerAliasRoutes(app);
registerProfileRoutes(app);
registerIapRoutes(app);
registerSessionRoutes(app);
registerLeaderboardRoutes(app);
registerMixRoutes(app);

// hourly leaderboard rebuild
cron.schedule('0 * * * *', () => {
  rebuildLeaderboard().catch((e) => app.log.error(e, 'leaderboard rebuild failed'));
});

const port = Number(process.env.API_PORT ?? 3000);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`ForestDream API listening on :${port}`);
});
