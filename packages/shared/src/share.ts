export interface ShareContext {
  themeName?: string;
  minutesLonger?: number;
  streakNights?: number;
}

export function buildShareMessage(ctx: ShareContext): string {
  if (ctx.streakNights && ctx.streakNights > 1) {
    return `${ctx.streakNights}-night streak with ${ctx.themeName ?? 'ForestDream'} sounds — my best sleep week yet! #ForestDream`;
  }
  if (ctx.minutesLonger && ctx.themeName) {
    return `I slept ${ctx.minutesLonger} minutes longer last night with my ${ctx.themeName} sounds! #ForestDream`;
  }
  return `Sleeping better with ForestDream. #ForestDream`;
}
