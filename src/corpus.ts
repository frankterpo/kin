import type { InspirationCard, TasteVector } from './types'

const v = (
  density: number, radius: number, saturation: number, contrast: number,
  mode: number, type_class: number, type_weight: number, spacing_rhythm: number,
  ornament: number, gradients: number, depth: number, motion: number,
  playfulness: number, texture: number,
): TasteVector => ({
  density, radius, saturation, contrast, mode, type_class, type_weight,
  spacing_rhythm, ornament, gradients, depth, motion, playfulness, texture,
})

export const SEED_CORPUS: InspirationCard[] = [
  {
    id: 'editorial-01', storage_url: '', title: 'Neue Culture', styleLabel: 'Editorial',
    visual: 'editorial', hues: [34, 8], source: 'Taste Engine studio composition',
    attrs: v(.28, .04, .18, .82, .06, .92, .48, .82, .35, .02, .08, .05, .12, .22),
  },
  {
    id: 'candy-01', storage_url: '', title: 'Soft Serve', styleLabel: 'Neo candy',
    visual: 'candy', hues: [316, 56], source: 'Taste Engine studio composition',
    attrs: v(.62, .94, .92, .78, .08, .18, .78, .34, .82, .72, .76, .82, .96, .18),
  },
  {
    id: 'terminal-01', storage_url: '', title: 'Local First', styleLabel: 'Terminal',
    visual: 'terminal', hues: [142, 220], source: 'Taste Engine studio composition',
    attrs: v(.82, .05, .48, .92, .96, .06, .62, .16, .08, .02, .06, .18, .08, .38),
  },
  {
    id: 'luxury-01', storage_url: '', title: 'Maison 27', styleLabel: 'Quiet luxury',
    visual: 'luxury', hues: [42, 24], source: 'Taste Engine studio composition',
    attrs: v(.12, .03, .12, .46, .08, .96, .22, .96, .28, .08, .12, .02, .04, .42),
  },
  {
    id: 'brutalist-01', storage_url: '', title: 'MAKE NOISE', styleLabel: 'Brutalist',
    visual: 'brutalist', hues: [58, 4], source: 'Taste Engine studio composition',
    attrs: v(.86, 0, 1, 1, .1, .06, 1, .08, .46, .02, .12, .25, .72, .62),
  },
  {
    id: 'glass-01', storage_url: '', title: 'Luminous', styleLabel: 'Glass',
    visual: 'glass', hues: [262, 192], source: 'Taste Engine studio composition',
    attrs: v(.32, .72, .72, .38, .88, .12, .34, .68, .72, .94, .92, .72, .58, .08),
  },
  {
    id: 'swiss-01', storage_url: '', title: 'Form / Function', styleLabel: 'Swiss',
    visual: 'swiss', hues: [6, 0], source: 'Taste Engine studio composition',
    attrs: v(.58, 0, .76, .96, .02, .04, .88, .46, .12, 0, .02, .05, .08, .08),
  },
  {
    id: 'memphis-01', storage_url: '', title: 'Play Works', styleLabel: 'Memphis',
    visual: 'memphis', hues: [328, 46, 188], source: 'Taste Engine studio composition',
    attrs: v(.52, .42, .96, .86, .06, .24, .72, .52, 1, .38, .24, .88, 1, .72),
  },
  {
    id: 'editorial-02', storage_url: '', title: 'Field Notes', styleLabel: 'Print',
    visual: 'editorial', hues: [18, 198], source: 'Taste Engine studio composition',
    attrs: v(.74, .02, .26, .72, .04, .86, .36, .22, .56, 0, .04, .02, .14, .88),
  },
  {
    id: 'candy-02', storage_url: '', title: 'Money, but fun', styleLabel: 'Playful product',
    visual: 'candy', hues: [148, 270], source: 'Taste Engine studio composition',
    attrs: v(.54, 1, .84, .64, .12, .12, .64, .46, .68, .54, .68, .92, .94, .12),
  },
  {
    id: 'terminal-02', storage_url: '', title: 'SYSTEM / 04', styleLabel: 'Industrial',
    visual: 'terminal', hues: [28, 0], source: 'Taste Engine studio composition',
    attrs: v(.94, .01, .28, 1, .92, .02, .84, .04, .24, 0, .02, .08, .1, .74),
  },
  {
    id: 'luxury-02', storage_url: '', title: 'Arc Journal', styleLabel: 'Art direction',
    visual: 'luxury', hues: [332, 42], source: 'Taste Engine studio composition',
    attrs: v(.18, .16, .32, .56, .72, 1, .28, .88, .52, .22, .38, .14, .18, .54),
  },
]
