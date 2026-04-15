// Short descriptor pills per theme, shown on theme cards.
export const THEME_TAGS: Record<string, string[]> = {
  rainforest: ['rain', 'birds', 'canopy'],
  mediterranean: ['waves', 'cicadas', 'breeze'],
  nordic: ['wind', 'owl', 'pine'],
  tropical_storm: ['heavy rain', 'ocean waves', 'storm wind'],
  alpine_meadow: ['stream', 'bells', 'meadow'],
  coastal_fog: ['surf', 'foghorn', 'mist'],
};

// Colour accent per theme for the hero image placeholder.
export const THEME_COLORS: Record<string, { from: string; to: string; emoji: string }> = {
  rainforest:     { from: '#2d6a4f', to: '#74c69d', emoji: '🌿' },
  mediterranean:  { from: '#e9a07b', to: '#3c6e71', emoji: '🌅' },
  nordic:         { from: '#5d737e', to: '#c5d3d6', emoji: '🌲' },
  tropical_storm: { from: '#1b3a4b', to: '#6a7b8b', emoji: '⛈️' },
  alpine_meadow:  { from: '#6a994e', to: '#a7c957', emoji: '🏔️' },
  coastal_fog:    { from: '#8ea8a8', to: '#d4dde0', emoji: '🌫️' },
};

// Pill tags for custom mix element keys.
export function mixTags(elements: Array<{ asset_key: string }>): string[] {
  return elements.slice(0, 4).map((e) => e.asset_key.split('/').pop()?.replace(/\.m4a$/, '') ?? e.asset_key);
}
