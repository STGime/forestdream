import type { DisturbanceEvent } from '@forestdream/shared';

// Between ending a session and the user confirming the "Sleep Session
// Complete" rating screen, we keep the raw data in memory. The user's
// 1-5 rating then sets quality_score, and we persist everything in one go.
// Discard simply clears this without writing anything.

export interface PendingSession {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  themeId?: string;
  themeName?: string;
  mixId?: string;
  events: DisturbanceEvent[];
  endedReason: 'manual' | 'alarm' | 'force_close';
}

let pending: PendingSession | null = null;

export function setPending(p: PendingSession): void { pending = p; }
export function peekPending(): PendingSession | null { return pending; }
export function takePending(): PendingSession | null {
  const p = pending;
  pending = null;
  return p;
}
