import React, { useEffect, useMemo, useState } from 'react'
import { glossary, glossaryLetters, byName } from '../data.js'
import { entryHref, href, useProgressive, useRoute } from '../hooks.js'

const letterOf = (g) => (/[A-Z]/.test(g.letter) ? g.letter : '#')

export default function Glossary() {
  const { params } = useRoute()
  const [q, setQ] = useState(params.get('q') || '')
  const [letter, setLetter] = useState(() => (params.get('q') ? '' : glossaryLetters[0]))
  const [open, setOpen] = useState(null)

  const counts = useMemo(() => {
    const c = {}
    for (const g of glossary) c[letterOf(g)] = (c[letterOf(g)] || 0) + 1
    return c
  }, [])

  const term = q.trim().toLowerCase()
  const list = useMemo(() => {
    if (term) return glossary.filter((g) => g.term.toLowerCase().includes(term) || g.definitions.some((d) => d.toLowerCase().includes(term)))
    return glossary.filter((g) => letterOf(g) === letter)
  }, [term, letter])

  const [n, sentinel] = useProgressive(list.length, term + letter, 80)
  useEffect(() => { if (term) setLetter('') }, [term])

  return (
    <main className="gloss">
      <header className="ghead">
        <nav className="crumbs mono"><a href={href('/')}>Index</a><span>/</span><span>Glossary</span></nav>
        <div className="btitle"><h1 className="bh1">Glossary</h1><span className="bcount">{glossary.length.toLocaleString()}</span></div>
        <p className="blurb">Every term defined across the library, merged. Open a term to see where it shows up.</p>
        <label className="search" htmlFor="gq">
          <span className="mono">Find a term</span>
          <input id="gq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="halftone, eyebrow, bento…" autoComplete="off" spellCheck="false" />
        </label>
      </header>

      <div className="gbody">
        <nav className="alpha" aria-label="Letters">
          {glossaryLetters.map((L) => (
            <button key={L} className={letter === L && !term ? 'on' : ''} onClick={() => { setQ(''); setLetter(L); setOpen(null); window.scrollTo({ top: 0 }) }}>
              <span>{L}</span><small>{counts[L]}</small>
            </button>
          ))}
        </nav>
        <div className="glist">
          <div className="rbar mono"><span><b>{list.length.toLocaleString()}</b> {term ? `matching “${q.trim()}”` : `under ${letter}`}</span></div>
          {list.slice(0, n).map((g) => {
            const isOpen = open === g.term
            return (
              <article key={g.term} className={'gterm' + (isOpen ? ' open' : '')}>
                <button className="gterm-h" onClick={() => setOpen(isOpen ? null : g.term)} aria-expanded={isOpen}>
                  <h3>{g.term}</h3>
                  <span className="mono">{g.entries.length} {g.entries.length === 1 ? 'reference' : 'references'}</span>
                </button>
                <p>{g.definitions[0]}</p>
                {isOpen && (
                  <div className="gmore">
                    {g.definitions.slice(1, 4).map((d, i) => <p className="alt" key={i}>{d}</p>)}
                    <ul>
                      {g.entries.slice(0, 12).map((name) => <li key={name}><a href={entryHref(name)}><img src={byName.get(name).thumb} alt="" loading="lazy" decoding="async" /><span>{byName.get(name).title}</span></a></li>)}
                    </ul>
                    {g.entries.length > 12 && <span className="dim">…and {g.entries.length - 12} more</span>}
                  </div>
                )}
              </article>
            )
          })}
          {n < list.length && <div ref={sentinel} className="sentinel mono">loading more…</div>}
        </div>
      </div>
    </main>
  )
}
