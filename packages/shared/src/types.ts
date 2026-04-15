import { z } from 'zod';

export type Tier = 'free' | 'premium';

export const ProfileSchema = z.object({
  user_id: z.string().uuid(),
  alias: z.string().min(3).max(24),
  tier: z.enum(['free', 'premium']),
  premium_expires_at: z.string().nullable().optional(),
  notifications_enabled: z.boolean().optional(),
  bedtime_reminder: z.string().nullable().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const MixElementSchema = z.object({
  asset_key: z.string(),
  volume: z.number().min(0).max(1),
});
export const CustomMixSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(40),
  elements: z.array(MixElementSchema).min(2).max(8),
});
export type CustomMix = z.infer<typeof CustomMixSchema>;

export const SessionEndReason = z.enum(['manual', 'alarm', 'force_close']);

export const DisturbanceEventSchema = z.object({
  detected_at: z.string(),
  kind: z.enum(['snore', 'movement']),
  response_layer: z.string().optional(),
});
export type DisturbanceEvent = z.infer<typeof DisturbanceEventSchema>;

export const SleepSessionSchema = z.object({
  id: z.string().uuid().optional(),
  theme_id: z.string().nullable().optional(),
  custom_mix_id: z.string().uuid().nullable().optional(),
  started_at: z.string(),
  ended_at: z.string().nullable().optional(),
  duration_seconds: z.number().int().nonnegative(),
  disturbance_count: z.number().int().nonnegative().default(0),
  quality_score: z.number().int().min(0).max(100),
  ended_reason: SessionEndReason,
  events: z.array(DisturbanceEventSchema).default([]),
});
export type SleepSession = z.infer<typeof SleepSessionSchema>;

export const LeaderboardKind = z.enum(['theme_usage', 'quality', 'streak']);
export type LeaderboardKind = z.infer<typeof LeaderboardKind>;
