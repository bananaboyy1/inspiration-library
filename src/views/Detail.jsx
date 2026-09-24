import React, { useEffect, useMemo } from 'react'
import { DISCIPLINES, byStyle, entries, disciplineLabel, disciplineColor, styleMeta, hash, glossary } from '../data.js'
import { browseHref, entryHref, href, go } from '../hooks.js'
import { Card } from '../components.jsx'

const glossTerms = new Set(glossary.map((g) => g.term.toLowerCase()))

export default function Detail({ e }) {
  const m = styleMeta(e.designStyle)
  const list = byStyle.get(e.designStyle)
  const i = list.findIndex((x) => x.name === e.name)
  const prev = list[(i - 1 + list.length) % list.length]
  const next = list[(i + 1) % list.length]

  // ← / → move through the same style; Esc goes back.
  useEffect(() => {
    const on = (ev) => {
      if (ev.target.tagName === 'INPUT') return
      if (ev.key === 'ArrowRight') go('/entry/' + encodeURIComponent(next.name))
      if (ev.key === 'ArrowLeft') go('/entry/' + encodeURIComponent(prev.name))
      if (ev.key === 'Backspace') window.history.back()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [prev, next])

  // The same style seen in the other disciplines: the point of grouping by style.
  const elsewhere = useMemo(
    () =>
      DISCIPLINES.filter((d) => d.slug !== e.discipline).map((d) => ({
        d,
        items: list.filter((x) => x.discipline === d.slug).sort((a, b) => hash(e.name + a.name) - hash(e.name + b.name)).slice(0, 4),
        total: list.filter((x) => x.discipline === d.slug).length,
      })),
    [e, list],
  )
  const sameType = useMemo(
    () => entries.filter((x) => x.name !== e.name && x.designType === e.designType && x.discipline === e.discipline).sort((a, b) => hash(e.name + a.name) - hash(e.name + b.name)).slice(0, 6),
    [e],
  )

  return (
    <main className={`detail st-${m.slug}`} data-motif={m.slug}>
      <nav className="crumbs mono" aria-label="Where you are">
        <a href={href('/')}>Index</a><span>/</span>
        <a href={browseHref({ s: e.designStyle })}>{e.designStyle}</a><span>/</span>
        <a href={browseHref({ s: e.designStyle, d: e.discipline })}>{disciplineLabel(e.discipline)}</a><span>/</span>
        <a href={browseHref({ d: e.discipline, t: e.designType })}>{e.designType}</a>
      </nav>

      <div className="dgrid">
        <figure className="shot">
          <a href={e.url} target="_blank" rel="noreferrer" title="Open the full image">
            <img src={e.url} alt={e.title} decoding="async" />
          </a>
          <div className="stepper mono">
            <a href={entryHref(prev.name)} rel="prev">← prev</a>
            <span>{i + 1} / {list.length} in {e.designStyle}</span>
            <a href={entryHref(next.name)} rel="next">next →</a>
          </div>
        </figure>

        <div className="dbody">
          <div className="dtags">
            <a className="pill" style={{ '--dc': disciplineColor(e.discipline) }} href={browseHref({ d: e.discipline })}><i className="dot" />{disciplineLabel(e.discipline)}</a>
            <a className="pill" href={browseHref({ d: e.discipline, t: e.designType })}>{e.designType}</a>
            <a className="pill solid" href={browseHref({ s: e.designStyle })}>{e.designStyle}</a>
          </div>
          <h1 className="dh1">{e.title}</h1>
          <div className="chips small">{e.tags.map((tg) => <a key={tg} className="chip" href={browseHref({ q: tg })}>{tg}</a>)}</div>

          <section className="dsec two">
            <div><h2 className="mono">What it is</h2><p>{e.whatItIs}</p></div>
            <div><h2 className="mono">What it means</h2><p>{e.whatItMeans}</p></div>
          </section>

          <section className="dsec">
            <h2 className="mono">Techniques <em>borrow freely, in any discipline</em></h2>
            <ol className="techs">{e.techniques.map((x, n) => <li key={n}><b>{String(n + 1).padStart(2, '0')}</b><span>{x}</span></li>)}</ol>
          </section>

          <section className="dsec">
            <h2 className="mono">Best for</h2>
            <ul className="bestfor">{e.bestFor.map((x, n) => <li key={n}>{x}</li>)}</ul>
          </section>

          <section className="dsec">
            <h2 className="mono">Vocabulary</h2>
            <dl className="vocab">
              {e.vocabulary.map((v) => (
                <div key={v.term}>
                  <dt>{glossTerms.has(v.term.toLowerCase()) ? <a href={href('/glossary', { q: v.term })}>{v.term}</a> : v.term}</dt>
                  <dd>{v.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <section className="elsewhere">
        <h2><span className="mono">Same look, elsewhere</span><em>{e.designStyle} in the other disciplines</em></h2>
        <div className="lanes">
          {elsewhere.map(({ d, items, total }) => (
            <div className="lane" key={d.slug} style={{ '--dc': d.color }}>
              <h3><i className="dot" />{d.label}<b>{total}</b></h3>
              {items.map((x) => <Card key={x.name} e={x} showStyle={false} />)}
              {!items.length && <p className="dim">None yet.</p>}
              {total > items.length && <a className="lane-more mono" href={browseHref({ s: e.designStyle, d: d.slug })}>all {total} →</a>}
            </div>
          ))}
        </div>
      </section>

      {sameType.length > 0 && (
        <section className="elsewhere">
          <h2><span className="mono">More of the same kind</span><em>{e.designType}</em></h2>
          <div className="wall small">{sameType.map((x) => <Card key={x.name} e={x} />)}</div>
        </section>
      )}
    </main>
  )
}
