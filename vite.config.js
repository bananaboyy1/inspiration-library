import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Serves ./images at /images and ./thumbs at /thumbs in dev/preview, and copies both into dist/ on build,
// so entries' "images/<name>.<ext>" paths work unchanged.
const DIRS = ['images', 'thumbs']
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' }

function serveAssets() {
  const handler = (req, res, next) => {
    const url = decodeURIComponent((req.url || '').split('?')[0])
    const m = url.match(/^\/(images|thumbs)\/([^/]+)$/)
    if (!m) return next()
    const file = path.join(path.resolve(m[1]), m[2])
    const type = TYPES[path.extname(file).toLowerCase()]
    if (!type || !fs.existsSync(file)) return next()
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    fs.createReadStream(file).pipe(res)
  }
  return {
    name: 'serve-assets',
    // Braces matter: returning the middleware app makes Vite call it as a post hook.
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
    closeBundle() {
      for (const d of DIRS) {
        const from = path.resolve(d)
        if (!fs.existsSync(from)) continue
        const to = path.resolve('dist', d)
        fs.mkdirSync(to, { recursive: true })
        for (const f of fs.readdirSync(from)) {
          if (TYPES[path.extname(f).toLowerCase()]) fs.copyFileSync(path.join(from, f), path.join(to, f))
        }
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), serveAssets()],
  server: { fs: { allow: ['.'] } },
})
