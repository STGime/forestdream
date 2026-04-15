// Sleep quality score 0-100 from duration and disturbance count.
// Targets: 8h undisturbed = 100; each disturbance subtracts ~3; <4h heavily penalised.
export function computeQualityScore(
  durationSeconds: number,
  disturbanceCount: number
): number {
  const hours = durationSeconds / 3600;
  const durationScore = Math.min(100, Math.max(0, (hours / 8) * 100));
  const disturbancePenalty = Math.min(60, disturbanceCount * 3);
  return Math.round(Math.max(0, Math.min(100, durationScore - disturbancePenalty)));
}
