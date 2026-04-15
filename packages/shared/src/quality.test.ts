import { describe, it, expect } from 'vitest';
import { computeQualityScore } from './quality';

describe('computeQualityScore', () => {
  it('returns 100 for 8h undisturbed', () => {
    expect(computeQualityScore(8 * 3600, 0)).toBe(100);
  });
  it('penalises disturbances', () => {
    expect(computeQualityScore(8 * 3600, 5)).toBe(85);
  });
  it('floors at 0', () => {
    expect(computeQualityScore(0, 50)).toBe(0);
  });
  it('clamps duration over 8h', () => {
    expect(computeQualityScore(12 * 3600, 0)).toBe(100);
  });
});
