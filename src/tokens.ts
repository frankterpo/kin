import { TasteVector, DesignTokens } from './types';

// Font pairings bucketed by type_class (0 to 1)
const FONT_PAIRINGS = [
  // Grotesque sans (0.0 - 0.33)
  { display: 'Inter', body: 'Inter', bucket: 0 },
  { display: 'Archivo', body: 'IBM Plex Sans', bucket: 0 },
  
  // Humanist/Geometric (0.33 - 0.66)
  { display: 'DM Sans', body: 'DM Sans', bucket: 1 },
  { display: 'Space Grotesk', body: 'Space Grotesk', bucket: 1 },
  
  // Serif/Display (0.66 - 1.0)
  { display: 'Crimson Text', body: 'Crimson Text', bucket: 2 },
  { display: 'Fraunces', body: 'IBM Plex Serif', bucket: 2 },
];

// Convert taste vector to design tokens
export function tokensFromTaste(taste: TasteVector): DesignTokens {
  // COLOR MODE
  const colorMode: 'light' | 'dark' = taste.mode > 0.5 ? 'dark' : 'light';
  
  // PALETTE - OKLCH space
  // Calculate hue (we'll use playfulness to shift hue)
  const primaryHue = taste.playfulness * 360;
  
  // Saturation from saturation dimension
  const primarySat = taste.saturation * 0.3; // 0 to 0.3 chroma in OKLCH
  
  // Lightness from mode and contrast
  const baseLightness = colorMode === 'dark' ? 0.15 : 0.98;
  const primaryLight = colorMode === 'dark' 
    ? baseLightness + taste.contrast * 0.15 
    : baseLightness - taste.contrast * 0.15;
  
  // Accent hue (complementary or analogous based on ornament)
  const accentHue = (primaryHue + (taste.ornament > 0.5 ? 180 : 30)) % 360;
  const accentSat = primarySat * 1.2;
  const accentLight = colorMode === 'dark' ? 0.65 : 0.45;
  
  // TYPOGRAPHY
  // Select font pairing based on type_class
  const bucket = Math.floor(taste.type_class * 3);
  const clampedBucket = Math.min(2, Math.max(0, bucket));
  const pairingsInBucket = FONT_PAIRINGS.filter(p => p.bucket === clampedBucket);
  const pairing = pairingsInBucket[0] || FONT_PAIRINGS[0];
  
  // Weight from type_weight (300 to 900)
  const fontWeightDisplay = Math.round(300 + taste.type_weight * 600);
  const fontWeightBody = Math.round(300 + taste.type_weight * 300); // body is lighter
  
  // SPACING & LAYOUT
  // Base unit from spacing_rhythm and density
  const spaceUnit = 4 + taste.spacing_rhythm * 8 - taste.density * 4; // 4px to 12px
  
  const density: 'airy' | 'normal' | 'dense' = 
    taste.density < 0.33 ? 'airy' : 
    taste.density > 0.66 ? 'dense' : 'normal';
  
  // RADIUS
  // Map radius dimension to pixel values
  const radiusBase = Math.round(taste.radius * 24); // 0px to 24px
  const radiusLg = Math.round(taste.radius * 32); // 0px to 32px
  
  // DEPTH & SHADOW
  const shadowEnabled = taste.depth > 0.3;
  const shadowIntensity = taste.depth;
  
  // EFFECTS
  const gradientsEnabled = taste.gradients > 0.4;
  const textureEnabled = taste.texture > 0.5;
  
  // CONTRAST
  const contrastLevel: 'low' | 'medium' | 'high' = 
    taste.contrast < 0.33 ? 'low' : 
    taste.contrast > 0.66 ? 'high' : 'medium';
  
  return {
    colorMode,
    primaryHue,
    primarySat,
    primaryLight,
    accentHue,
    accentSat,
    accentLight,
    fontDisplay: pairing.display,
    fontBody: pairing.body,
    fontWeightDisplay,
    fontWeightBody,
    spaceUnit,
    density,
    radiusBase,
    radiusLg,
    shadowEnabled,
    shadowIntensity,
    gradientsEnabled,
    textureEnabled,
    contrastLevel,
  };
}

// Convert tokens to CSS variables
export function tokensToCSSVariables(tokens: DesignTokens): Record<string, string> {
  const isDark = tokens.colorMode === 'dark';
  
  // Generate color values in OKLCH
  const bg = isDark 
    ? `oklch(${tokens.primaryLight} ${tokens.primarySat} ${tokens.primaryHue})` 
    : `oklch(${tokens.primaryLight} ${tokens.primarySat} ${tokens.primaryHue})`;
  
  const fg = isDark 
    ? `oklch(0.95 0.01 ${tokens.primaryHue})` 
    : `oklch(0.15 0.02 ${tokens.primaryHue})`;
  
  const accent = `oklch(${tokens.accentLight} ${tokens.accentSat} ${tokens.accentHue})`;
  
  const border = isDark 
    ? `oklch(0.25 0.02 ${tokens.primaryHue})` 
    : `oklch(0.85 0.02 ${tokens.primaryHue})`;
  
  const card = isDark 
    ? `oklch(${tokens.primaryLight + 0.05} ${tokens.primarySat} ${tokens.primaryHue})` 
    : `oklch(${tokens.primaryLight - 0.03} ${tokens.primarySat} ${tokens.primaryHue})`;
  
  const muted = isDark 
    ? `oklch(0.45 0.03 ${tokens.primaryHue})` 
    : `oklch(0.55 0.03 ${tokens.primaryHue})`;
  
  // Spacing scale
  const spaceScale = {
    xs: `${tokens.spaceUnit * 0.5}px`,
    sm: `${tokens.spaceUnit}px`,
    md: `${tokens.spaceUnit * 2}px`,
    lg: `${tokens.spaceUnit * 3}px`,
    xl: `${tokens.spaceUnit * 4}px`,
  };
  
  // Shadows
  const shadow = tokens.shadowEnabled 
    ? `0 ${2 * tokens.shadowIntensity}px ${8 * tokens.shadowIntensity}px rgba(0,0,0,${0.1 * tokens.shadowIntensity})` 
    : 'none';
  
  const shadowLg = tokens.shadowEnabled 
    ? `0 ${4 * tokens.shadowIntensity}px ${16 * tokens.shadowIntensity}px rgba(0,0,0,${0.15 * tokens.shadowIntensity})` 
    : 'none';
  
  return {
    '--bg': bg,
    '--fg': fg,
    '--accent': accent,
    '--border': border,
    '--card': card,
    '--muted': muted,
    '--radius': `${tokens.radiusBase}px`,
    '--radius-lg': `${tokens.radiusLg}px`,
    '--space-xs': spaceScale.xs,
    '--space-sm': spaceScale.sm,
    '--space-md': spaceScale.md,
    '--space-lg': spaceScale.lg,
    '--space-xl': spaceScale.xl,
    '--shadow': shadow,
    '--shadow-lg': shadowLg,
    '--font-display': tokens.fontDisplay,
    '--font-body': tokens.fontBody,
    '--font-weight-display': tokens.fontWeightDisplay.toString(),
    '--font-weight-body': tokens.fontWeightBody.toString(),
  };
}

// Generate CSS string from variables
export function generateCSS(tokens: DesignTokens): string {
  const vars = tokensToCSSVariables(tokens);
  const cssVars = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  
  return `:root {\n${cssVars}\n}`;
}

// Generate Google Fonts import URL
export function generateFontImport(tokens: DesignTokens): string {
  const fonts = new Set([tokens.fontDisplay, tokens.fontBody]);
  const fontParams = Array.from(fonts).map(font => {
    const weights = [300, 400, 500, 600, 700, 800, 900];
    return `family=${font.replace(/ /g, '+')}:wght@${weights.join(';')}`;
  }).join('&');
  
  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}
