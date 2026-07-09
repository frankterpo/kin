import Anthropic from '@anthropic-ai/sdk'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const inputDir = process.argv[2] ?? 'corpus/raw'
const outputFile = process.argv[3] ?? 'corpus/tagged.json'
const client = new Anthropic()
const dimensions = [
  'density', 'radius', 'saturation', 'contrast', 'mode', 'type_class',
  'type_weight', 'spacing_rhythm', 'ornament', 'gradients', 'depth',
  'motion', 'playfulness', 'texture',
]

const files = (await readdir(inputDir)).filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
const tagged = []

for (const [index, file] of files.entries()) {
  const extension = extname(file).toLowerCase()
  const mediaType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg'
  const image = await readFile(join(inputDir, file), 'base64')
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_VISION_MODEL ?? 'claude-sonnet-4-5',
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
        {
          type: 'text',
          text: `Score this design from 0 to 1 on these dimensions: ${dimensions.join(', ')}.
Endpoints: density airy→dense; radius sharp→rounded; saturation muted→vivid; contrast soft→stark;
mode light→dark; type_class grotesque sans→serif/display; type_weight light→heavy;
spacing_rhythm tight→generous; ornament minimal→decorated; gradients none→heavy;
depth flat→layered; motion static→animated; playfulness serious→playful; texture clean→tactile.
Return only JSON: {"attrs":{all 14 keys},"hues":[dominant hue degrees],"description":"short style label"}.`,
        },
      ],
    }],
  })
  const text = response.content.find((block) => block.type === 'text')
  if (!text || text.type !== 'text') throw new Error(`No JSON returned for ${file}`)
  const parsed = JSON.parse(text.text.replace(/^```json\s*|\s*```$/g, ''))
  tagged.push({ id: file.replace(/\.[^.]+$/, ''), file, ...parsed })
  console.log(`[${index + 1}/${files.length}] tagged ${file}`)
}

await writeFile(outputFile, JSON.stringify(tagged, null, 2))
console.log(`Wrote ${tagged.length} records to ${outputFile}`)
