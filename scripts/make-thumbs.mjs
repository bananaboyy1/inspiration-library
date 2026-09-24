// Generates small WebP thumbnails in thumbs/ for the browsing grid (originals in images/ are never touched).
// Skips thumbnails that are already newer than their source, so it is fast after the first run.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'images')
const out = path.join(root, 'thumbs')
fs.mkdirSync(out, { recursive: true })

const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])
const files = fs.readdirSync(src).filter((f) => exts.has(path.extname(f).toLowerCase()))
const wanted = new Set(files.map((f) => path.parse(f).name + '.webp'))

// remove thumbnails whose image no longer exists
for (const f of fs.readdirSync(out)) if (!wanted.has(f)) fs.unlinkSync(path.join(out, f))

const todo = files.filter((f) => {
  const t = path.join(out, path.parse(f).name + '.webp')
  return !fs.existsSync(t) || fs.statSync(t).mtimeMs < fs.statSync(path.join(src, f)).mtimeMs
})
if (!todo.length) {
  console.log(`thumbs: ${files.length} up to date`)
  process.exit(0)
}

let done = 0
let failed = 0
async function one(f) {
  const t = path.join(out, path.parse(f).name + '.webp')
  try {
    await sharp(path.join(src, f), { animated: false, limitInputPixels: false })
      .resize({ width: 520, height: 650, fit: 'cover', position: 'top' })
      .webp({ quality: 68, effort: 3 })
      .toFile(t)
  } catch (e) {
    failed++
    console.error('thumb failed:', f, e.message)
  }
  if (++done % 100 === 0) console.log(`thumbs: ${done}/${todo.length}`)
}
const queue = [...todo]
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await one(queue.shift()) }))
console.log(`thumbs: generated ${done - failed}/${todo.length}${failed ? `, ${failed} failed` : ''}`)
