import { useEffect, useRef, useState, useCallback } from 'react'

// ---- tiny hash router: #/  ·  #/browse?d=&s=&t=&k=&q=  ·  #/entry/<name>  ·  #/glossary ----
const parse = () => {
  const h = window.location.hash.slice(1) || '/'
  const [pathname, qs = ''] = h.split('?')
  return { pathname, params: new URLSearchParams(qs) }
}
export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
export const href = (pathname, obj = {}) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) if (v) p.set(k, v)
  const qs = p.toString()
  return `#${pathname}${qs ? '?' + qs : ''}`
}
export const go = (pathname, obj) => { window.location.hash = href(pathname, obj).slice(1) }
export const browseHref = (obj) => href('/browse', obj)
export const entryHref = (name) => `#/entry/${encodeURIComponent(name)}`

// Progressive rendering: shows `step` items, adds more as a sentinel scrolls into view.
export function useProgressive(total, resetKey, step = 60) {
  const [count, setCount] = useState(step)
  const ref = useRef(null)
  useEffect(() => setCount(step), [resetKey, step])
  const setRef = useCallback(
    (node) => {
      if (ref.current) ref.current.disconnect()
      if (!node) return
      ref.current = new IntersectionObserver(
        (es) => { if (es[0].isIntersecting) setCount((c) => Math.min(total, c + step)) },
        { rootMargin: '1200px 0px' },
      )
      ref.current.observe(node)
    },
    [total, step],
  )
  return [Math.min(count, total), setRef, () => setCount((c) => Math.min(total, c + step))]
}

export function useDebounced(value, ms = 160) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
