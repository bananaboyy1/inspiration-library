import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DISCIPLINES, STYLES, byStyle, entries, styleMeta } from './data.js'
import { browseHref, href, entryHref, useDebounced, go } from './hooks.js'
import { SplitBar } from './components.jsx'

// The "map": a full-screen overlay that replaces the navbar. Search, disciplines, styles, glossary.
export default function MapMenu({ onClose, onSurprise }) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q, 120)
  const input = useRef(null)
  useEffect(() => { input.current?.focus() }, [])

  const results = useMemo(() => {
    const terms = dq.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return { list: [], total: 0 }
    const list = []
    let total = 0
    for (const e of entries) {
      if (terms.every((t) => e._hay.includes(t))) { total++; if (list.length < 10) list.push(e) }
    }
    return { list, total }
  }, [dq])

  const discCounts = DISCIPLINES.map((d) => ({ ...d, n: entries.filter((e) => e.discipline === d.slug).length }))
  const submit = (ev) => { ev.preventDefault(); if (q.trim()) go('/browse', { q: q.trim() }) }

  return (
    <div className="map" role="dialog" aria-modal="true" aria-label="Map">
      <div className="map-scroll">
        <form className="map-search" onSubmit={submit}>
          <label htmlFor="map-q">Search everything</label>
          <input id="map-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="glass, serif, onboarding, lime…" autoComplete="off" spellCheck="false" />
          <span className="hint">{q ? `${results.total.toLocaleString()} match${results.total === 1 ? '' : 'es'} · enter to see all` : `${entries.length.toLocaleString()} references · press / anywhere`}</span>
        </form>

        {results.list.length > 0 && (
          <div className="map-results">
            {results.list.map((e) => (
              <a key={e.name} href={entryHref(e.name)} className="mini">
                <img src={e.thumb} alt="" loading="lazy" decoding="async" />
                <span>{e.title}</span>
              </a>
            ))}
            {results.total > results.list.length && <a className="mini more" href={browseHref({ q: q.trim() })}>+ {results.total - results.list.length} more →</a>}
          </div>
        )}

        <div className="map-grid">
          <section>
            <h2>Disciplines</h2>
            <div className="map-disc">
              {discCounts.map((d) => (
                <a key={d.slug} href={browseHref({ d: d.slug })} style={{ '--dc': d.color }}>
                  <span>{d.label}</span>
                  <b>{d.n.toLocaleString()}</b>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2>Design styles <em>across every discipline</em></h2>
            <div className="map-styles">
              {STYLES.map((s) => {
                const list = byStyle.get(s)
                const counts = {}
                for (const e of list) counts[e.discipline] = (counts[e.discipline] || 0) + 1
                return (
                  <a key={s} href={browseHref({ s })} style={{ '--accent': styleMeta(s).accent }}>
                    <span className="nm">{s}</span>
                    <SplitBar counts={counts} />
                    <b>{list.length}</b>
                  </a>
                )
              })}
            </div>
          </section>

          <section className="map-links">
            <h2>Elsewhere</h2>
            <a href={href('/')}>Index of styles <kbd>H</kbd></a>
            <a href={browseHref({})}>Every reference <kbd>{entries.length.toLocaleString()}</kbd></a>
            <a href={href('/glossary')}>Glossary of terms <kbd>G</kbd></a>
            <button onClick={onSurprise}>Surprise me ↯</button>
          </section>
        </div>
      </div>
      <button className="map-close" onClick={onClose} aria-label="Close map">esc</button>
    </div>
  )
}
