interface Row {
  theme_id: string | null;
  duration_seconds: number | null;
  disturbance_count: number | null;
}

// Produce 1-3 plain-language insights from session history.
export function analysePatterns(sessions: Row[]): string[] {
  if (sessions.length < 3) return ['Log a few more sessions to unlock pattern insights.'];
  const byTheme = new Map<string, { total: number; n: number; dist: number }>();
  for (const s of sessions) {
    if (!s.theme_id || s.duration_seconds == null) continue;
    const cur = byTheme.get(s.theme_id) ?? { total: 0, n: 0, dist: 0 };
    cur.total += s.duration_seconds;
    cur.dist += s.disturbance_count ?? 0;
    cur.n += 1;
    byTheme.set(s.theme_id, cur);
  }
  const ranked = [...byTheme.entries()]
    .map(([id, v]) => ({ id, avg: v.total / v.n, avgDist: v.dist / v.n }))
    .sort((a, b) => b.avg - a.avg);
  if (ranked.length < 2) return ['Try more themes to compare which work best.'];
  const best = ranked[0];
  const rest = ranked.slice(1).reduce((a, b) => a + b.avg, 0) / (ranked.length - 1);
  const diff = Math.round((best.avg - rest) / 60);
  const out: string[] = [];
  if (diff > 0) out.push(`You sleep ${diff} minutes longer on average with ${best.id}.`);
  const calmest = [...byTheme.entries()].sort((a, b) => a[1].dist / a[1].n - b[1].dist / b[1].n)[0];
  if (calmest) out.push(`${calmest[0]} averages the fewest disturbances.`);
  return out;
}
