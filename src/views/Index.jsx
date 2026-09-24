import React, { useMemo, useState } from 'react'
import { DISCIPLINES, STYLES, byStyle, entries, glossary, styleMeta, hash, disciplineColor } from '../data.js'
import { browseHref, href } from '../hooks.js'
import { SplitBar } from '../components.jsx'

const pick = (list, seed) => list[hash(seed) % list.length]

export default function Index({ onSurprise }) {
  const [hover, setHover] = useState(null)

  const rows = useMemo(
    () =>
      STYLES.map((s) => {
        const list = byStyle.get(s)
        const counts = {}
        for (const e of list) counts[e.discipline] = (counts[e.discipline] || 0) + 1
        return { s, n: list.length, counts, list }
      }).sort((a, b) => b.n - a.n),
    [],
  )
  const discs = useMemo(
    () => DISCIPLINES.map((d) => ({ ...d, list: entries.filter((e) => e.discipline === d.slug) })),
    [],
  )

  return (
    <main className="index">
      <header className="hero">
        <p className="mono">{entries.length.toLocaleString()} references · {DISCIPLINES.length} disciplines · {STYLES.length} styles · nothing here is a rule</p>
        <h1>
          <span>A library</span>
          <span>of <em>looks.</em></span>
        </h1>
        <p className="lede">
          Web, app, branding and print sorted by how they feel, not where they live. Pick a style and watch it
          travel across every discipline.
        </p>
      </header>

      <div className="ticker" aria-hidden="true">
        <div>
          {[...STYLES, ...STYLES].map((s, i) => <span key={i} style={{ color: styleMeta(s).accent }}>{s} ✦</span>)}
        </div>
      </div>

      <section className="rows" aria-label="Design styles">
        <div className="rows-head mono"><span>No.</span><span>Style</span><span>Web · App · Brand · Print</span><span>Refs</span></div>
        {rows.map(({ s, n, counts, list }, i) => {
          const m = styleMeta(s)
          return (
            <a
              key={s}
              className={`row st-${m.slug}`}
              href={browseHref({ s })}
              style={{ '--accent': m.accent }}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover((h) => (h === s ? null : h))}
              onFocus={() => setHover(s)}
            >
              <span className="row-no mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="row-name">{s}</span>
              <SplitBar counts={counts} />
              <span className="row-n">{n}</span>
              {hover === s && (
                <span className="peek" aria-hidden="true">
                  {DISCIPLINES.map((d, j) => {
                    const sub = list.filter((e) => e.discipline === d.slug)
                    if (!sub.length) return null
                    const e = pick(sub, s + d.slug)
                    return <img key={d.slug} src={e.thumb} alt="" style={{ '--r': `${(j - 1.5) * 4}deg`, borderColor: d.color }} />
                  })}
                </span>
              )}
            </a>
          )
        })}
        <a className="row row-all" href={browseHref({})}>
          <span className="row-no mono">∞</span>
          <span className="row-name">Every reference</span>
          <span />
          <span className="row-n">{entries.length.toLocaleString()}</span>
        </a>
      </section>

      <section className="discs" aria-label="Disciplines">
        <h2 className="mono">Or go by discipline</h2>
        <div className="disc-grid">
          {discs.map((d) => (
            <a key={d.slug} className="disc" href={browseHref({ d: d.slug })} style={{ '--dc': d.color }}>
              <span className="disc-collage" aria-hidden="true">
                {[0, 1, 2].map((k) => <img key={k} src={pick(d.list, d.slug + k).thumb} alt="" loading="lazy" decoding="async" />)}
              </span>
              <span className="disc-name">{d.label}</span>
              <span className="disc-n">{d.list.length.toLocaleString()}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="outro">
        <a className="outro-a" href={href('/glossary')}><span className="mono">Vocabulary</span><b>{glossary.length.toLocaleString()} terms</b><em>Glossary →</em></a>
        <button className="outro-a" onClick={onSurprise}><span className="mono">Feeling lucky</span><b>One at random</b><em>Surprise me ↯</em></button>
      </section>

      <footer className="foot mono">
        <span>Press <kbd>/</kbd> to search, <kbd>M</kbd> for the map, <kbd>G</kbd> for the glossary.</span>
        <span style={{ color: disciplineColor('app') }}>●</span>
      </footer>
    </main>
  )
}
