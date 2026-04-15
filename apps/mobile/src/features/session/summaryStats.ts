export interface HistoryRow {
  id: string;
  duration_seconds: number | null;
  disturbance_count: number | null;
  quality_score: number | null;
  started_at: string;
}

export interface SummaryStats {
  lastDurationMin: number;
  lastDisturbances: number;
  lastQuality: number;
  weekAvgDurationMin: number;
  weekSessions: number;
  deltaVsLastMin: number | null;      // + = slept longer than previous session
  deltaVsWeekAvgMin: number | null;   // + = slept longer than last 7d avg
  dailyMinutes: Array<{ day: string; minutes: number }>; // last 7 calendar days
}

export function computeSummaryStats(sessionId: string, history: HistoryRow[]): SummaryStats | null {
  const current = history.find((h) => h.id === sessionId);
  if (!current) return null;

  const lastDurationMin = Math.round((current.duration_seconds ?? 0) / 60);
  const lastDisturbances = current.disturbance_count ?? 0;
  const lastQuality = current.quality_score ?? 0;

  const currentTs = new Date(current.started_at).getTime();
  const weekAgo = currentTs - 7 * 864e5;
  const lastWeek = history.filter((h) => {
    const t = new Date(h.started_at).getTime();
    return t < currentTs && t >= weekAgo;
  });
  const weekSessions = lastWeek.length;
  const weekAvgDurationMin = weekSessions === 0
    ? 0
    : Math.round(lastWeek.reduce((a, b) => a + (b.duration_seconds ?? 0), 0) / weekSessions / 60);

  const previous = history.find((h) => h.id !== current.id && new Date(h.started_at).getTime() < currentTs);
  const deltaVsLastMin = previous
    ? Math.round(((current.duration_seconds ?? 0) - (previous.duration_seconds ?? 0)) / 60)
    : null;
  const deltaVsWeekAvgMin = weekSessions === 0 ? null : lastDurationMin - weekAvgDurationMin;

  // 7-day bar data (including today, oldest first)
  const days: Array<{ day: string; minutes: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const end = d.getTime() + 864e5;
    const mins = history
      .filter((h) => {
        const t = new Date(h.started_at).getTime();
        return t >= d.getTime() && t < end;
      })
      .reduce((a, b) => a + (b.duration_seconds ?? 0) / 60, 0);
    days.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }), minutes: Math.round(mins) });
  }

  return {
    lastDurationMin, lastDisturbances, lastQuality,
    weekAvgDurationMin, weekSessions,
    deltaVsLastMin, deltaVsWeekAvgMin,
    dailyMinutes: days,
  };
}
