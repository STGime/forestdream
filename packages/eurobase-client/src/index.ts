import { createClient as createEurobaseClient } from '@eurobase/sdk';

export interface EurobaseConfig {
  url: string;
  apiKey: string;
}

export function createClient(cfg: EurobaseConfig) {
  return createEurobaseClient({ url: cfg.url, apiKey: cfg.apiKey });
}

// Table name constants - single source of truth
export const TABLES = {
  profiles: 'profiles',
  themes: 'themes',
  sleep_sessions: 'sleep_sessions',
  disturbance_events: 'disturbance_events',
  custom_mixes: 'custom_mixes',
  leaderboard_snapshots: 'leaderboard_snapshots',
} as const;

export type EurobaseClient = ReturnType<typeof createClient>;
