import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Serves ./images at /images in dev and copies it into dist/ on build,
// so entries' "images/<name>.<ext>" paths work unchanged.
function serveImages() {
  const dir = path.resolve('images')
  const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' }
  const handler = (req, res, next) => {
    const url = decodeURIComponent((req.url || '').split('?')[0])
    const m = url.match(/^\/images\/([^/]+)$/)
    if (!m) return next()
    const file = path.join(dir, m[1])
    const type = types[path.extname(file).toLowerCase()]
    if (!type || !fs.existsSync(file)) return next()
    res.setHeader('Content-Type', type)
    fs.createReadStream(file).pipe(res)
  }
  return {
    name: 'serve-images',
    // Braces matter: returning the middleware app makes Vite call it as a post hook.
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
    closeBundle() {
      const out = path.resolve('dist/images')
      fs.mkdirSync(out, { recursive: true })
      for (const f of fs.readdirSync(dir)) {
        if (types[path.extname(f).toLowerCase()]) fs.copyFileSync(path.join(dir, f), path.join(out, f))
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), serveImages()],
  server: { fs: { allow: ['.'] } },
})
