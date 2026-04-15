import { SOOTHING_LAYERS } from '@forestdream/shared';
import type { Player } from './Player';

// When a disturbance is detected, boost the theme's soothing layer for ~60s.
export class AdaptiveResponder {
  private cooldownUntil = 0;
  constructor(private player: Player, private themeId: string) {}

  async onDisturbance(): Promise<string | undefined> {
    const now = Date.now();
    if (now < this.cooldownUntil) return;
    this.cooldownUntil = now + 30_000;
    const layer = SOOTHING_LAYERS[this.themeId]?.[0];
    if (!layer) return;
    await this.player.setLayerVolume(layer, 1.0, 2000);
    setTimeout(() => { this.player.setLayerVolume(layer, 0.6, 8000).catch(() => {}); }, 60_000);
    return layer;
  }
}
