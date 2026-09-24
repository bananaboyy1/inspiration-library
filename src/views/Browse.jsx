import React, { useEffect, useMemo, useState } from 'react'
import { DISCIPLINES, STYLES, TECHNIQUE_WORDS, entries, disciplineLabel, disciplineColor, styleMeta, STYLE_BLURB } from '../data.js'
import { browseHref, href, useProgressive } from '../hooks.js'
import { Card, StyleDot } from '../components.jsx'

const LANE_STEP = 18

export default function Browse({ params }) {
  const d = params.get('d') || ''
  const s = params.get('s') || ''
  const t = params.get('t') || ''
  const k = params.get('k') || ''
  const q = params.get('q') || ''
  const v = params.get('v') || ''
  const cur = { d, s, t, k, q, v }

  const [qLocal, setQLocal] = useState(q)
  const [allTypes, setAllTypes] = useState(false)
  const [allTech, setAllTech] = useState(false)
  useEffect(() => setQLocal(q), [q])
  // typing updates the URL (replace, so the back button isn't flooded)
  useEffect(() => {
    if (qLocal === q) return
    const id = setTimeout(() => window.location.replace(browseHref({ ...cur, q: qLocal.trim() })), 220)
    return () => clearTimeout(id)
  }, [qLocal]) // eslint-disable-line

  const terms = useMemo(() => q.toLowerCase().split(/\s+/).filter(Boolean), [q])

  // One pass computes results and the live count of every facet (each counted with the *other* filters applied).
  const { results, discCounts, styleCounts, typeRows, techRows } = useMemo(() => {
    const results = []
    const discCounts = {}
    const styleCounts = {}
    const typeMap = new Map()
    const techMap = new Map()
    for (const e of entries) {
      const pd = !d || e.discipline === d
      const ps = !s || e.designStyle === s
      const pt = !t || e.designType === t
      const pk = !k || e._words.has(k)
      const pq = terms.every((w) => e._hay.includes(w))
      if (!pq) continue
      if (ps && pt && pk) discCounts[e.discipline] = (discCounts[e.discipline] || 0) + 1
      if (pd && pt && pk) styleCounts[e.designStyle] = (styleCounts[e.designStyle] || 0) + 1
      if (pd && ps && pk) {
        const key = e.discipline + '\u0000' + e.designType
        typeMap.set(key, (typeMap.get(key) || 0) + 1)
      }
      if (pd && ps && pt) for (const w of TECHNIQUE_WORDS) if (e._words.has(w)) techMap.set(w, (techMap.get(w) || 0) + 1)
      if (pd && ps && pt && pk) results.push(e)
    }
    const typeRows = [...typeMap.entries()]
      .map(([key, n]) => { const [disc, type] = key.split('\u0000'); return { disc, type, n } })
      .filter((r) => !d || r.disc === d)
      .sort((a, b) => b.n - a.n || a.type.localeCompare(b.type))
    const techRows = [...techMap.entries()].sort((a, b) => b[1] - a[1])
    return { results, discCounts, styleCounts, typeRows, techRows }
  }, [d, s, t, k, terms])

  const totalDisc = Object.values(discCounts).reduce((a, b) => a + b, 0)
  const meta = s ? styleMeta(s) : null
  const mode = v || (s && !d ? 'lanes' : 'wall')
  const active = d || s || t || k || q
  const title = s || (d ? disciplineLabel(d) : q ? `“${q}”` : 'Everything')

  const typeShown = allTypes ? typeRows : typeRows.slice(0, 14)
  const techShown = allTech ? techRows.slice(0, 80) : techRows.slice(0, 22)

  return (
    <main className={`browse ${meta ? 'st-' + meta.slug : ''}`}>
      <header className="bhead" data-motif={meta ? meta.slug : 'none'}>
        <nav className="crumbs mono" aria-label="Where you are">
          <a href={href('/')}>Index</a>
          <span>/</span>
          <a href={browseHref({})}>All</a>
          {s && <><span>/</span><a href={browseHref({ s })}>{s}</a></>}
          {d && <><span>/</span><a href={browseHref({ s, d })}>{disciplineLabel(d)}</a></>}
          {t && <><span>/</span><span>{t}</span></>}
        </nav>
        <div className="btitle">
          <h1 className="bh1">{title}</h1>
          <span className="bcount" aria-live="polite">{results.length.toLocaleString()}</span>
        </div>
        {s && STYLE_BLURB[s] && <p className="blurb">{STYLE_BLURB[s]}</p>}

        <div className="finder">
          <label className="search" htmlFor="bq">
            <span className="mono">Search</span>
            <input id="bq" value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder="anything: mood, colour, technique, term…" autoComplete="off" spellCheck="false" />
          </label>
          {active && <a className="clear mono" href={browseHref({})} onClick={() => setQLocal('')}>Clear all ✕</a>}
        </div>

        <div className="facet">
          <span className="facet-l mono">Discipline</span>
          <div className="tiles">
            <a className={'tile' + (!d ? ' on' : '')} href={browseHref({ ...cur, d: '' })}><span>All</span><b>{totalDisc.toLocaleString()}</b></a>
            {DISCIPLINES.map((x) => (
              <a key={x.slug} className={'tile' + (d === x.slug ? ' on' : '')} style={{ '--dc': x.color }} href={browseHref({ ...cur, d: d === x.slug ? '' : x.slug, t: '' })}>
                <i className="dot" /><span>{x.label}</span><b>{(discCounts[x.slug] || 0).toLocaleString()}</b>
              </a>
            ))}
          </div>
        </div>

        <div className="facet">
          <span className="facet-l mono">Style</span>
          <div className="chips scroll">
            <a className={'chip' + (!s ? ' on' : '')} href={browseHref({ ...cur, s: '' })}>All styles</a>
            {STYLES.map((x) => (
              <a key={x} className={'chip' + (s === x ? ' on' : '')} style={{ '--accent': styleMeta(x).accent }} href={browseHref({ ...cur, s: s === x ? '' : x })}>
                <StyleDot style={x} />{x}<b>{styleCounts[x] || 0}</b>
              </a>
            ))}
          </div>
        </div>

        <div className="facet">
          <span className="facet-l mono">Design type</span>
          <div className="chips">
            {t && <a className="chip on" href={browseHref({ ...cur, t: '' })}>{t} ✕</a>}
            {typeShown.filter((r) => r.type !== t).map((r) => (
              <a key={r.disc + r.type} className="chip" href={browseHref({ ...cur, t: r.type, d: d || r.disc })}>
                {!d && <i className="dot" style={{ background: disciplineColor(r.disc) }} />}{r.type}<b>{r.n}</b>
              </a>
            ))}
            {typeRows.length > 14 && <button className="chip ghost" onClick={() => setAllTypes(!allTypes)}>{allTypes ? 'fewer' : `+${typeRows.length - 14} more`}</button>}
            {!typeRows.length && <span className="dim">No design types match.</span>}
          </div>
        </div>

        <div className="facet">
          <span className="facet-l mono">Technique</span>
          <div className="chips">
            {k && !techShown.some(([w]) => w === k) && <a className="chip on" href={browseHref({ ...cur, k: '' })}>{k} ✕</a>}
            {techShown.map(([w, n]) => (
              <a key={w} className={'chip' + (k === w ? ' on' : '')} href={browseHref({ ...cur, k: k === w ? '' : w })}>{w}<b>{n}</b></a>
            ))}
            {techRows.length > 22 && <button className="chip ghost" onClick={() => setAllTech(!allTech)}>{allTech ? 'fewer' : 'more techniques'}</button>}
          </div>
        </div>
      </header>

      <div className="results">
        <div className="rbar mono">
          <span><b>{results.length.toLocaleString()}</b> {results.length === 1 ? 'reference' : 'references'}</span>
          <span className="views">
            <a className={mode === 'lanes' ? 'on' : ''} href={browseHref({ ...cur, v: 'lanes', d: '' })} title="One column per discipline, side by side">Lanes</a>
            <a className={mode === 'wall' ? 'on' : ''} href={browseHref({ ...cur, v: 'wall' })} title="One mixed wall">Wall</a>
          </span>
        </div>
        {!results.length && <p className="empty">Nothing matches that combination. Loosen a filter.</p>}
        {mode === 'lanes' && results.length > 0 ? <Lanes results={results} resetKey={JSON.stringify(cur)} /> : <Wall results={results} resetKey={JSON.stringify(cur)} />}
      </div>
    </main>
  )
}

function Wall({ results, resetKey }) {
  const [n, sentinel] = useProgressive(results.length, resetKey, 60)
  return (
    <>
      <div className="wall">{results.slice(0, n).map((e) => <Card key={e.name} e={e} />)}</div>
      {n < results.length && <div ref={sentinel} className="sentinel mono">loading more…</div>}
    </>
  )
}

// One column per discipline: a single style seen in web, app, branding and print-social at once.
function Lanes({ results, resetKey }) {
  const [shown, setShown] = useState({})
  useEffect(() => setShown({}), [resetKey])
  return (
    <div className="lanes">
      {DISCIPLINES.map((x) => {
        const list = results.filter((e) => e.discipline === x.slug)
        const n = shown[x.slug] || LANE_STEP
        return (
          <section key={x.slug} className="lane" style={{ '--dc': x.color }}>
            <h3><i className="dot" />{x.label}<b>{list.length}</b></h3>
            {list.slice(0, n).map((e) => <Card key={e.name} e={e} showStyle={false} />)}
            {list.length > n && <button className="lane-more mono" onClick={() => setShown((p) => ({ ...p, [x.slug]: n + LANE_STEP * 2 }))}>+ {Math.min(LANE_STEP * 2, list.length - n)} more ({list.length - n} left)</button>}
            {!list.length && <p className="dim">Nothing in {x.label} for this combination.</p>}
          </section>
        )
      })}
    </div>
  )
}
