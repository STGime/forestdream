import { eb } from './eurobase.js';

// Aggregate sleep_sessions into three leaderboard snapshots.
// Scope is intentionally simple for v1: last 30 days, top 100.
export async function rebuildLeaderboard(): Promise<void> {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();

  const { data: sessions } = await eb.db
    .from('sleep_sessions')
    .select('user_id, theme_id, duration_seconds, quality_score, started_at')
    .gte('started_at', since);
  if (!sessions) return;

  const { data: profiles } = await eb.db.from('profiles').select('user_id, alias');
  const aliasById = new Map<string, string>(
    (profiles ?? []).map((p: { user_id: string; alias: string }) => [p.user_id, p.alias])
  );

  // theme_usage
  const themeCounts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.theme_id) continue;
    themeCounts.set(s.theme_id, (themeCounts.get(s.theme_id) ?? 0) + 1);
  }
  const themeUsage = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([theme_id, count], i) => ({ rank: i + 1, theme_id, sessions: count }));

  // quality (avg quality_score per user)
  const qualityByUser = new Map<string, { total: number; n: number }>();
  for (const s of sessions) {
    const cur = qualityByUser.get(s.user_id) ?? { total: 0, n: 0 };
    cur.total += s.quality_score ?? 0;
    cur.n += 1;
    qualityByUser.set(s.user_id, cur);
  }
  const quality = [...qualityByUser.entries()]
    .filter(([, v]) => v.n >= 3)
    .map(([uid, v]) => ({ alias: aliasById.get(uid) ?? '—', avg: v.total / v.n }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 100)
    .map((row, i) => ({ rank: i + 1, ...row }));

  // streak: consecutive distinct dates per user
  const datesByUser = new Map<string, Set<string>>();
  for (const s of sessions) {
    const day = s.started_at.slice(0, 10);
    if (!datesByUser.has(s.user_id)) datesByUser.set(s.user_id, new Set());
    datesByUser.get(s.user_id)!.add(day);
  }
  const streaks = [...datesByUser.entries()]
    .map(([uid, days]) => ({ alias: aliasById.get(uid) ?? '—', streak: longestStreak(days) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 100)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const now = new Date().toISOString();
  await eb.db.from('leaderboard_snapshots').insert([
    { kind: 'theme_usage', computed_at: now, payload: themeUsage },
    { kind: 'quality', computed_at: now, payload: quality },
    { kind: 'streak', computed_at: now, payload: streaks },
  ]);
}

function longestStreak(days: Set<string>): number {
  const sorted = [...days].sort();
  let best = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const dt = new Date(d);
    if (prev && (dt.getTime() - prev.getTime()) === 864e5) cur += 1;
    else cur = 1;
    best = Math.max(best, cur);
    prev = dt;
  }
  return best;
}
