import { TasteVector } from './types';

// Initialize a neutral taste vector (all dimensions at 0.5)
export function initTasteVector(): TasteVector {
  return {
    density: 0.5,
    radius: 0.5,
    saturation: 0.5,
    contrast: 0.5,
    mode: 0.5,
    type_class: 0.5,
    type_weight: 0.5,
    spacing_rhythm: 0.5,
    ornament: 0.5,
    gradients: 0.5,
    depth: 0.5,
    motion: 0.5,
    playfulness: 0.5,
    texture: 0.5,
  };
}

// Initialize confidence (starts at 0 for all dimensions)
export function initConfidence(): TasteVector {
  return {
    density: 0,
    radius: 0,
    saturation: 0,
    contrast: 0,
    mode: 0,
    type_class: 0,
    type_weight: 0,
    spacing_rhythm: 0,
    ornament: 0,
    gradients: 0,
    depth: 0,
    motion: 0,
    playfulness: 0,
    texture: 0,
  };
}

// Calculate learning rate based on swipe count
export function getLearningRate(swipeCount: number): number {
  const eta0 = 0.30;
  const etaMin = 0.10;
  const decayOver = 30;
  
  if (swipeCount >= decayOver) return etaMin;
  
  const progress = swipeCount / decayOver;
  return eta0 - (eta0 - etaMin) * progress;
}

// Update taste vector based on a swipe
export function updateTaste(
  current: TasteVector,
  cardAttrs: TasteVector,
  direction: 'left' | 'right' | 'up',
  swipeCount: number
): TasteVector {
  let eta = getLearningRate(swipeCount);
  
  // Superlike doubles the learning rate
  if (direction === 'up') {
    eta *= 2;
  }
  
  const updated = { ...current };
  const dimensions = Object.keys(current) as (keyof TasteVector)[];
  
  for (const dim of dimensions) {
    const currentVal = current[dim];
    const cardVal = cardAttrs[dim];
    const diff = cardVal - currentVal;
    
    if (direction === 'right' || direction === 'up') {
      // Like: move toward the card's attributes
      updated[dim] = currentVal + eta * diff;
    } else {
      // Pass: move away, but weighted by how neutral the dimension is
      // If cardVal is near 0.5 (neutral), we don't learn much from rejecting it
      const neutrality = 1 - Math.abs(cardVal - 0.5) * 2; // 0 to 1, higher = more neutral
      const weight = 1 - neutrality * 0.5; // reduce learning on neutral dimensions
      updated[dim] = currentVal - eta * weight * diff;
    }
    
    // Clamp to [0, 1]
    updated[dim] = Math.max(0, Math.min(1, updated[dim]));
  }
  
  return updated;
}

// Update confidence based on liked cards
export function updateConfidence(
  current: TasteVector,
  likedCards: TasteVector[],
  confidence: TasteVector
): TasteVector {
  const updated = { ...confidence };
  const dimensions = Object.keys(current) as (keyof TasteVector)[];
  
  if (likedCards.length < 3) {
    // Not enough data yet
    return updated;
  }
  
  for (const dim of dimensions) {
    const values = likedCards.map(card => card[dim]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Confidence is inverse of standard deviation, scaled to [0, 1]
    // Low variance = high confidence
    const maxStdDev = 0.5; // theoretical maximum we care about
    updated[dim] = Math.max(0, Math.min(1, 1 - stdDev / maxStdDev));
  }
  
  return updated;
}

// Sample a variant taste vector near the current taste
export function sampleVariant(
  current: TasteVector,
  confidence: TasteVector,
  isOffTaste: boolean = false
): TasteVector {
  const variant = { ...current };
  const dimensions = Object.keys(current) as (keyof TasteVector)[];
  
  // Base sigma, shrinks as confidence rises
  const avgConfidence = Object.values(confidence).reduce((sum, v) => sum + v, 0) / 14;
  let sigma = 0.25 * (1 - avgConfidence * 0.6); // shrinks from 0.25 to 0.10
  
  // Off-taste cards have higher sigma
  if (isOffTaste) {
    sigma = 0.45;
  }
  
  for (const dim of dimensions) {
    // Normal distribution around current value
    const noise = normalRandom() * sigma;
    variant[dim] = current[dim] + noise;
    
    // Clamp to [0, 1]
    variant[dim] = Math.max(0, Math.min(1, variant[dim]));
  }
  
  return variant;
}

// Box-Muller transform for normal random
function normalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Get dimension name in human-readable form
export function getDimensionLabel(dim: keyof TasteVector): string {
  const labels: Record<keyof TasteVector, string> = {
    density: 'Density',
    radius: 'Roundness',
    saturation: 'Saturation',
    contrast: 'Contrast',
    mode: 'Mode',
    type_class: 'Type Class',
    type_weight: 'Type Weight',
    spacing_rhythm: 'Spacing',
    ornament: 'Ornament',
    gradients: 'Gradients',
    depth: 'Depth',
    motion: 'Motion',
    playfulness: 'Playfulness',
    texture: 'Texture',
  };
  return labels[dim];
}

// Get dimension endpoints
export function getDimensionEndpoints(dim: keyof TasteVector): [string, string] {
  const endpoints: Record<keyof TasteVector, [string, string]> = {
    density: ['Airy', 'Dense'],
    radius: ['Sharp', 'Rounded'],
    saturation: ['Muted', 'Vivid'],
    contrast: ['Soft', 'Stark'],
    mode: ['Light', 'Dark'],
    type_class: ['Sans', 'Serif'],
    type_weight: ['Light', 'Heavy'],
    spacing_rhythm: ['Tight', 'Generous'],
    ornament: ['Minimal', 'Decorated'],
    gradients: ['None', 'Heavy'],
    depth: ['Flat', 'Layered'],
    motion: ['Static', 'Animated'],
    playfulness: ['Serious', 'Playful'],
    texture: ['Clean', 'Textured'],
  };
  return endpoints[dim];
}
