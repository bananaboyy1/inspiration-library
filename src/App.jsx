import React, { useEffect, useMemo, useState } from 'react'
import { useRoute, go, href } from './hooks.js'
import { byName, entries, styleMeta } from './data.js'
import Index from './views/Index.jsx'
import Browse from './views/Browse.jsx'
import Detail from './views/Detail.jsx'
import Glossary from './views/Glossary.jsx'
import MapMenu from './MapMenu.jsx'

export default function App() {
  const route = useRoute()
  const [mapOpen, setMapOpen] = useState(false)

  const { pathname, params } = route
  const entryName = pathname.startsWith('/entry/') ? decodeURIComponent(pathname.slice(7)) : null
  const entry = entryName ? byName.get(entryName) : null
  const view = pathname === '/glossary' ? 'glossary' : entryName ? 'entry' : pathname === '/browse' ? 'browse' : 'index'

  // The page takes on the accent of whichever style you're looking at.
  const activeStyle = view === 'entry' ? entry?.designStyle : view === 'browse' ? params.get('s') : ''
  const accent = activeStyle ? styleMeta(activeStyle).accent : '#c6ff3d'

  // Close the map whenever you navigate, and scroll to the top on new pages.
  useEffect(() => {
    setMapOpen(false)
    if (view !== 'browse') window.scrollTo(0, 0)
  }, [pathname, view])

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      const typing = tag === 'input' || tag === 'textarea'
      if (e.key === 'Escape') { setMapOpen(false); return }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/' || e.key.toLowerCase() === 'm') { e.preventDefault(); setMapOpen(true) }
      if (e.key.toLowerCase() === 'g') go('/glossary')
      if (e.key.toLowerCase() === 'h') go('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mapOpen ? 'hidden' : ''
  }, [mapOpen])

  const surprise = () => {
    const e = entries[Math.floor(Math.random() * entries.length)]
    go('/entry/' + encodeURIComponent(e.name))
  }

  return (
    <div className="app" style={{ '--accent': accent }} data-view={view}>
      <div className="grain" aria-hidden="true" />
      <a className="wordmark" href={href('/')} aria-label="Reference Library, home">
        <span>Reference</span>
        <span>Library<sup>®</sup></span>
      </a>

      {view === 'index' && <Index onSurprise={surprise} />}
      {view === 'browse' && <Browse params={params} />}
      {view === 'entry' && (entry ? <Detail e={entry} /> : <div className="lost"><h1>Lost.</h1><a href={href('/')}>Back to the index</a></div>)}
      {view === 'glossary' && <Glossary />}

      <button className={'compass' + (mapOpen ? ' open' : '')} onClick={() => setMapOpen((o) => !o)} aria-label={mapOpen ? 'Close map' : 'Open map: search, disciplines, styles, glossary'} aria-expanded={mapOpen}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <defs><path id="ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs>
          <text><textPath href="#ring" startOffset="0">MAP ✦ SEARCH ✦ STYLES ✦ GLOSSARY ✦ </textPath></text>
        </svg>
        <span className="compass-core"><i /><i /></span>
      </button>

      {mapOpen && <MapMenu onClose={() => setMapOpen(false)} onSurprise={surprise} />}
    </div>
  )
}
