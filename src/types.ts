// Core taste dimension type
export interface TasteVector {
  density: number;          // 0: airy, 1: dense
  radius: number;           // 0: sharp, 1: fully rounded
  saturation: number;       // 0: muted, 1: vivid
  contrast: number;         // 0: soft, 1: stark
  mode: number;             // 0: light, 1: dark
  type_class: number;       // 0: grotesque sans, 1: serif/display
  type_weight: number;      // 0: light, 1: heavy
  spacing_rhythm: number;   // 0: tight, 1: generous
  ornament: number;         // 0: flat minimal, 1: decorated
  gradients: number;        // 0: none, 1: heavy
  depth: number;            // 0: flat, 1: shadowed/layered
  motion: number;           // 0: static, 1: animated
  playfulness: number;      // 0: serious, 1: playful
  texture: number;          // 0: clean, 1: grainy/tactile
}

// Inspiration card from corpus
export interface InspirationCard {
  id: string;
  storage_url: string;
  attrs: TasteVector;
  hues: number[];
  source?: string;
  title?: string;
  styleLabel?: string;
  visual?: 'editorial' | 'brutalist' | 'terminal' | 'candy' | 'luxury' | 'glass' | 'swiss' | 'memphis';
}

// Variant card generated from taste
export interface VariantCard {
  id: string;
  tokens: DesignTokens;
  attrs: TasteVector;
}

// Design tokens derived from taste vector
export interface DesignTokens {
  // Color
  colorMode: 'light' | 'dark';
  primaryHue: number;
  primarySat: number;
  primaryLight: number;
  accentHue: number;
  accentSat: number;
  accentLight: number;
  
  // Typography
  fontDisplay: string;
  fontBody: string;
  fontWeightDisplay: number;
  fontWeightBody: number;
  
  // Spacing & Layout
  spaceUnit: number;
  density: 'airy' | 'normal' | 'dense';
  
  // Border & Radius
  radiusBase: number;
  radiusLg: number;
  
  // Depth & Shadow
  shadowEnabled: boolean;
  shadowIntensity: number;
  
  // Effects
  gradientsEnabled: boolean;
  textureEnabled: boolean;
  
  // Contrast
  contrastLevel: 'low' | 'medium' | 'high';
}

// Session state
export interface TasteSession {
  id: string;
  taste: TasteVector;
  confidence: TasteVector;
  swipes: SwipeRecord[];
  learningRate: number;
  swipeCount: number;
}

// Individual swipe record
export interface SwipeRecord {
  cardId: string;
  cardType: 'inspiration' | 'variant';
  direction: 'left' | 'right' | 'up';
  attrs: TasteVector;
  timestamp: number;
}

// Database types
export interface Database {
  public: {
    Tables: {
      inspiration: {
        Row: InspirationCard;
        Insert: Omit<InspirationCard, 'id'>;
        Update: Partial<InspirationCard>;
      };
      sessions: {
        Row: {
          id: string;
          taste: TasteVector;
          swipes: SwipeRecord[];
          confidence: TasteVector;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          taste: TasteVector;
          swipes?: SwipeRecord[];
          confidence: TasteVector;
        };
        Update: {
          taste?: TasteVector;
          swipes?: SwipeRecord[];
          confidence?: TasteVector;
        };
      };
    };
  };
}
