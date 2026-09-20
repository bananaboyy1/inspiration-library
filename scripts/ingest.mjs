// Usage: node scripts/ingest.mjs <batch.json>
// Batch file: array of entries, each with `file` (current name in images/) plus the schema fields
// and a `slug` (descriptive name starting with the discipline, no extension).
// Renames the image, writes entries/<slug>.json and entries/<slug>.md.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DISCIPLINES = ['web', 'app', 'branding', 'print-social']
const batch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))

const toMd = (e) => `# ${e.title}

![](../${e.image})

**Discipline:** ${e.discipline} · **Design type:** ${e.designType}
**Tags:** ${e.tags.join(', ')}

## What it is
${e.whatItIs}

## What it means
${e.whatItMeans}

## Techniques
${e.techniques.map((t) => `- ${t}`).join('\n')}

## Best for
${e.bestFor.map((t) => `- ${t}`).join('\n')}

## Vocabulary
${e.vocabulary.map((v) => `- **${v.term}** — ${v.definition}`).join('\n')}
`

let ok = 0
for (const b of batch) {
  const { file, slug, ...rest } = b
  const src = path.join(root, 'images', file)
  if (!fs.existsSync(src)) { console.error('MISSING', file); continue }
  if (!DISCIPLINES.includes(rest.discipline) || !slug.startsWith(rest.discipline + '-')) { console.error('BAD SLUG/DISCIPLINE', slug); continue }
  const dest = slug + path.extname(file).toLowerCase()
  if (fs.existsSync(path.join(root, 'images', dest))) { console.error('EXISTS', dest); continue }
  fs.renameSync(src, path.join(root, 'images', dest))
  const entry = { name: slug, image: `images/${dest}`, ...rest }
  fs.writeFileSync(path.join(root, 'entries', slug + '.json'), JSON.stringify(entry, null, 2) + '\n')
  fs.writeFileSync(path.join(root, 'entries', slug + '.md'), toMd(entry))
  ok++
}
console.log(`ingested ${ok}/${batch.length}`)
