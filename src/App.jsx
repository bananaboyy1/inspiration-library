import React, { useEffect, useMemo, useState } from 'react'
import { entries, byName, imageUrl, DISCIPLINES, disciplineLabel, TECHNIQUE_WORDS, glossary } from './data.js'

const PAGE = 48

// ---------- tiny hash router: #/ (browse) · #/entry/<name> · #/glossary ----------
function parseHash() {
  const h = window.location.hash.slice(1) || '/'
  const [pathname, qs = ''] = h.split('?')
  return { pathname, params: new URLSearchParams(qs) }
}
function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
const go = (pathname, params) => {
  const qs = params ? params.toString() : ''
  window.location.hash = pathname + (qs ? `?${qs}` : '')
}
const withParam = (params, key, value) => {
  const p = new URLSearchParams(params)
  if (value) p.set(key, value)
  else p.delete(key)
  if (key === 'd') p.delete('t')
  return p
}

export default function App() {
  const route = useRoute()
  const [query, setQuery] = useState('')

  const entry = route.pathname.startsWith('/entry/') ? byName.get(decodeURIComponent(route.pathname.slice(7))) : null
  const view = route.pathname === '/glossary' ? 'glossary' : entry ? 'entry' : route.pathname.startsWith('/entry/') ? 'missing' : 'browse'

  const onSearch = (q) => {
    setQuery(q)
    if (q && view !== 'browse' && view !== 'glossary') go('/', route.params)
  }

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#/">Design Inspiration Library</a>
        <nav className="tabs">
          <a className={view === 'browse' || view === 'entry' ? 'on' : ''} href="#/">Browse</a>
          <a className={view === 'glossary' ? 'on' : ''} href="#/glossary">Glossary</a>
        </nav>
        <input
          className="search"
          type="search"
          placeholder={view === 'glossary' ? 'Search the glossary…' : `Search all ${entries.length} entries…`}
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search"
        />
      </header>
      <p className="note">An open reference. Nothing here is a rule — borrow across disciplines.</p>
      {view === 'glossary' && <Glossary query={query} />}
      {view === 'entry' && <Detail entry={entry} />}
      {view === 'missing' && <p className="empty">That entry doesn’t exist. <a href="#/">Back to browsing</a></p>}
      {view === 'browse' && <Browse params={route.params} query={query} setQuery={setQuery} />}
    </div>
  )
}

// ---------- Browse ----------
function Browse({ params, query, setQuery }) {
  const d = params.get('d') || ''
  const t = params.get('t') || ''
  const k = params.get('k') || ''
  const [shown, setShown] = useState(PAGE)
  const [allTech, setAllTech] = useState(false)

  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])
  useEffect(() => setShown(PAGE), [d, t, k, query])

  const match = (e, skip) =>
    (skip === 'd' || !d || e.discipline === d) &&
    (skip === 't' || !t || e.designType === t) &&
    (skip === 'k' || !k || e._words.has(k)) &&
    terms.every((w) => e._hay.includes(w))

  const results = useMemo(() => entries.filter((e) => match(e)), [d, t, k, terms])

  // Faceted live counts: each facet is counted with every *other* filter applied.
  const discCounts = useMemo(() => {
    const c = {}
    for (const e of entries) if (match(e, 'd')) c[e.discipline] = (c[e.discipline] || 0) + 1
    return c
  }, [d, t, k, terms])
  const totalForDisc = useMemo(() => Object.values(discCounts).reduce((a, b) => a + b, 0), [discCounts])

  const typeCounts = useMemo(() => {
    const c = new Map()
    for (const e of entries) if (match(e, 't')) {
      const key = e.discipline + '\u0000' + e.designType
      c.set(key, (c.get(key) || 0) + 1)
    }
    return c
  }, [d, t, k, terms])

  const techCounts = useMemo(() => {
    const c = new Map()
    for (const e of entries) if (match(e, 'k')) for (const w of TECHNIQUE_WORDS) if (e._words.has(w)) c.set(w, (c.get(w) || 0) + 1)
    return [...c.entries()].sort((a, b) => b[1] - a[1])
  }, [d, t, k, terms])

  const typeRows = [...typeCounts.entries()]
    .map(([key, n]) => { const [disc, type] = key.split('\u0000'); return { disc, type, n } })
    .filter((r) => !d || r.disc === d)
    .sort((a, b) => b.n - a.n || a.type.localeCompare(b.type))

  const setD = (v) => go('/', withParam(params, 'd', v))
  const setT = (row) => {
    const p = new URLSearchParams(params)
    if (row && row.type !== t) { p.set('t', row.type); p.set('d', row.disc) } else p.delete('t')
    go('/', p)
  }
  const setK = (v) => go('/', withParam(params, 'k', v === k ? '' : v))
  const clear = () => { setQuery(''); go('/') }
  const active = d || t || k || query

  return (
    <div className="layout">
      <aside className="side">
        <h3>Discipline</h3>
        <ul className="facet">
          <li><button className={!d ? 'on' : ''} onClick={() => setD('')}><span>All</span><b>{totalForDisc}</b></button></li>
          {DISCIPLINES.map((x) => (
            <li key={x.slug}>
              <button className={d === x.slug ? 'on' : ''} onClick={() => setD(d === x.slug ? '' : x.slug)}>
                <span>{x.label}</span><b>{discCounts[x.slug] || 0}</b>
              </button>
              {d === x.slug && (
                <ul className="facet sub">
                  {typeRows.map((r) => (
                    <li key={r.type}>
                      <button className={t === r.type ? 'on' : ''} onClick={() => setT(r)}><span>{r.type}</span><b>{r.n}</b></button>
                    </li>
                  ))}
                  {!typeRows.length && <li className="dim">No design types match.</li>}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {!d && (
          <>
            <h3>Design type</h3>
            <ul className="facet sub scroll">
              {typeRows.map((r) => (
                <li key={r.disc + r.type}>
                  <button className={t === r.type ? 'on' : ''} onClick={() => setT(r)}>
                    <span>{r.type} <em>{disciplineLabel(r.disc)}</em></span><b>{r.n}</b>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <h3>Technique</h3>
        <div className="chips">
          {techCounts.slice(0, allTech ? 150 : 24).map(([w, n]) => (
            <button key={w} className={'chip' + (k === w ? ' on' : '')} onClick={() => setK(w)}>{w} <b>{n}</b></button>
          ))}
          {k && !techCounts.some(([w]) => w === k) && <button className="chip on" onClick={() => setK(k)}>{k} <b>0</b></button>}
        </div>
        <button className="link" onClick={() => setAllTech(!allTech)}>{allTech ? 'Show fewer' : 'Show more techniques'}</button>
      </aside>

      <main>
        <div className="bar">
          <strong>{results.length}</strong> {results.length === 1 ? 'entry' : 'entries'}
          {d && <span className="tag">{disciplineLabel(d)}</span>}
          {t && <span className="tag">{t}</span>}
          {k && <span className="tag">technique: {k}</span>}
          {query && <span className="tag">“{query}”</span>}
          {active && <button className="link" onClick={clear}>Clear all</button>}
        </div>
        {!results.length && <p className="empty">Nothing matches. Try fewer filters.</p>}
        <div className="grid">
          {results.slice(0, shown).map((e) => (
            <a key={e.name} className="card" href={`#/entry/${encodeURIComponent(e.name)}`}>
              <img src={imageUrl(e)} alt={e.title} loading="lazy" />
              <div className="meta">
                <span className="kicker">{disciplineLabel(e.discipline)} · {e.designType}</span>
                <h4>{e.title}</h4>
              </div>
            </a>
          ))}
        </div>
        {shown < results.length && (
          <div className="more"><button onClick={() => setShown(shown + PAGE)}>Show more ({results.length - shown} left)</button></div>
        )}
      </main>
    </div>
  )
}

// ---------- Detail ----------
function Detail({ entry: e }) {
  useEffect(() => window.scrollTo(0, 0), [e?.name])
  const related = useMemo(
    () => entries.filter((x) => x.name !== e.name && x.designType === e.designType && x.discipline === e.discipline).slice(0, 6),
    [e],
  )
  const inGlossary = new Set(glossary.map((g) => g.term.toLowerCase()))
  return (
    <article className="detail">
      <p><a href="#/" onClick={(ev) => { ev.preventDefault(); window.history.length > 1 ? window.history.back() : go('/') }}>← Back</a></p>
      <div className="dhead">
        <a className="shot" href={imageUrl(e)} target="_blank" rel="noreferrer"><img src={imageUrl(e)} alt={e.title} /></a>
        <div>
          <span className="kicker">
            <a href={`#/?d=${e.discipline}`}>{disciplineLabel(e.discipline)}</a> ›{' '}
            <a href={`#/?d=${e.discipline}&t=${encodeURIComponent(e.designType)}`}>{e.designType}</a>
          </span>
          <h1>{e.title}</h1>
          <div className="chips">{e.tags.map((tg) => <span className="chip static" key={tg}>{tg}</span>)}</div>
          <Section title="What it is"><p>{e.whatItIs}</p></Section>
          <Section title="What it means"><p>{e.whatItMeans}</p></Section>
        </div>
      </div>
      <div className="cols">
        <Section title="Techniques"><ul>{e.techniques.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
        <Section title="Best for"><ul>{e.bestFor.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
      </div>
      <Section title="Vocabulary">
        <dl>
          {e.vocabulary.map((v) => (
            <div key={v.term}>
              <dt>{inGlossary.has(v.term.toLowerCase()) ? <a href={`#/glossary`} onClick={() => sessionStorageSafe(v.term)}>{v.term}</a> : v.term}</dt>
              <dd>{v.definition}</dd>
            </div>
          ))}
        </dl>
      </Section>
      {!!related.length && (
        <Section title={`More ${e.designType}`}>
          <div className="grid small">
            {related.map((x) => (
              <a key={x.name} className="card" href={`#/entry/${encodeURIComponent(x.name)}`}>
                <img src={imageUrl(x)} alt={x.title} loading="lazy" />
                <div className="meta"><h4>{x.title}</h4></div>
              </a>
            ))}
          </div>
        </Section>
      )}
    </article>
  )
}
const sessionStorageSafe = (term) => { try { window.sessionStorage.setItem('glossaryFocus', term) } catch { /* ignore */ } }
const Section = ({ title, children }) => <section className="sec"><h3>{title}</h3>{children}</section>

// ---------- Glossary ----------
function Glossary({ query }) {
  const [open, setOpen] = useState(null)
  const q = query.toLowerCase().trim()
  const list = useMemo(
    () => (q ? glossary.filter((g) => g.term.toLowerCase().includes(q) || g.definitions.some((d) => d.text.toLowerCase().includes(q))) : glossary),
    [q],
  )
  const letters = useMemo(() => [...new Set(list.map((g) => g.term[0].toUpperCase()))], [list])
  const [limit, setLimit] = useState(200)
  useEffect(() => setLimit(200), [q])
  let last = ''
  return (
    <main className="gloss">
      <div className="bar"><strong>{list.length}</strong> terms from {entries.length} entries</div>
      <div className="letters">{letters.map((l) => <a key={l} href={`#/glossary`} onClick={(ev) => { ev.preventDefault(); const el = document.getElementById('L' + l); if (el) el.scrollIntoView() ; else setLimit(list.length) }}>{l}</a>)}</div>
      <dl>
        {list.slice(0, limit).map((g) => {
          const L = g.term[0].toUpperCase()
          const head = L !== last ? <h2 id={'L' + L} key={'h' + L}>{L}</h2> : null
          last = L
          const isOpen = open === g.term
          return (
            <React.Fragment key={g.term}>
              {head}
              <div className="term">
                <dt>{g.term} <em>{g.entries.length} {g.entries.length === 1 ? 'entry' : 'entries'}</em></dt>
                <dd>
                  {g.definitions[0].text}
                  {g.definitions.length > 1 && <span className="dim"> (+{g.definitions.length - 1} variant{g.definitions.length > 2 ? 's' : ''})</span>}
                  <div><button className="link" onClick={() => setOpen(isOpen ? null : g.term)}>{isOpen ? 'Hide' : 'Show'} entries</button></div>
                  {isOpen && (
                    <>
                      {g.definitions.slice(1).map((d, i) => <p className="alt" key={i}>{d.text}</p>)}
                      <ul className="used">
                        {g.entries.slice(0, 30).map((n) => <li key={n}><a href={`#/entry/${encodeURIComponent(n)}`}>{byName.get(n).title}</a></li>)}
                        {g.entries.length > 30 && <li className="dim">…and {g.entries.length - 30} more</li>}
                      </ul>
                    </>
                  )}
                </dd>
              </div>
            </React.Fragment>
          )
        })}
      </dl>
      {limit < list.length && <div className="more"><button onClick={() => setLimit(limit + 400)}>Show more terms ({list.length - limit} left)</button></div>}
    </main>
  )
}
