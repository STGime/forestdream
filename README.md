# ForestDream

EU-sovereign sleep-aid app (iOS + Android). Monorepo: React Native mobile app + Node.js API + Eurobase backend.

## Layout

- `apps/mobile` — Expo React Native app
- `apps/api` — Fastify backend (leaderboard aggregation, IAP validation, alias uniqueness)
- `packages/shared` — types, tier rules, quality scoring, theme catalog
- `packages/eurobase-client` — typed wrapper around `@eurobase/sdk`
- `migrations/` — SQL migrations applied to Eurobase/Neon

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in Eurobase keys
pnpm dev
```

## Milestones

See `.claude/plans/adaptive-popping-biscuit.md` for the full implementation plan.
