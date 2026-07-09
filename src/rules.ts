import type { DesignTokens, TasteVector } from './types'
import { generateCSS } from './tokens'
import { getDimensionEndpoints, getDimensionLabel } from './taste'

export function styleName(taste: TasteVector): string {
  const first =
    taste.contrast > .72 ? 'Electric' :
    taste.texture > .65 ? 'Tactile' :
    taste.mode > .68 ? 'Midnight' :
    taste.saturation < .3 ? 'Quiet' :
    taste.playfulness > .7 ? 'Playful' : 'Modern'
  const second =
    taste.radius < .24 ? 'Brutalism' :
    taste.type_class > .72 ? 'Editorial' :
    taste.gradients > .68 ? 'Aurora' :
    taste.density > .7 ? 'Terminal' :
    taste.ornament < .3 ? 'Utility' : 'Studio'
  return `${first} ${second}`
}

export function proseGuide(taste: TasteVector, tokens: DesignTokens): string {
  const preferred = (Object.keys(taste) as (keyof TasteVector)[])
    .sort((a, b) => Math.abs(taste[b] - .5) - Math.abs(taste[a] - .5))
    .slice(0, 6)
    .map((dim) => {
      const [low, high] = getDimensionEndpoints(dim)
      return `${getDimensionLabel(dim)}: ${taste[dim] < .5 ? low : high}`
    })

  return `Build interfaces in the “${styleName(taste)}” visual language.

## Direction
${preferred.map((line) => `- ${line}.`).join('\n')}
- Use ${tokens.fontDisplay} for display type and ${tokens.fontBody} for body copy.
- Use ${tokens.radiusBase}px base radii and ${tokens.radiusLg}px for large surfaces.
- Keep spacing on a ${Math.round(tokens.spaceUnit)}px base rhythm.
- ${tokens.gradientsEnabled ? 'Gradients are welcome when they clarify hierarchy.' : 'Do not use decorative gradients.'}
- ${tokens.shadowEnabled ? 'Use deliberate layered shadows for hierarchy.' : 'Prefer borders and spacing over drop shadows.'}
- Avoid generic component-library defaults. Every choice should reinforce this taste profile.`
}

export function generateTasteFile(taste: TasteVector, tokens: DesignTokens): string {
  return `---
description: Personal visual taste rules generated from swipe behavior
globs: ["**/*.{tsx,ts,jsx,js,css,html}"]
alwaysApply: true
---

# Personal Taste: ${styleName(taste)}

${proseGuide(taste, tokens)}

## Canonical design tokens

\`\`\`json
${JSON.stringify(tokens, null, 2)}
\`\`\`

## CSS variables

\`\`\`css
${generateCSS(tokens)}
\`\`\`

## Learned taste vector

\`\`\`json
${JSON.stringify(taste, null, 2)}
\`\`\`
`
}
