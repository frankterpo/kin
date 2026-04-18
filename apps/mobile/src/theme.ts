export const palette = {
  bgTop: '#1a0509',
  bgMid: '#4a0e1c',
  bgBottom: '#8a1a2a',
  bgAccent: '#c4364a',
  ink: '#ffffff',
  inkDim: 'rgba(255,255,255,0.65)',
  inkMuted: 'rgba(255,255,255,0.42)',
  cardBorder: 'rgba(255,255,255,0.12)',
  cardFill: 'rgba(40,10,18,0.55)',
  accent: '#ffd27a',
  accentDim: 'rgba(255,210,122,0.6)',
  divider: 'rgba(255,255,255,0.18)',
};

export const gradient = {
  background: [palette.bgTop, palette.bgMid, palette.bgBottom, palette.bgAccent] as const,
  backgroundLocations: [0, 0.35, 0.75, 1] as const,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

export const type = {
  display: { fontSize: 84, fontWeight: '300' as const, letterSpacing: -2 },
  title: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  label: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.6 },
};
