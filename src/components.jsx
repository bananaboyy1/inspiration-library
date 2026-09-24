import React, { memo } from 'react'
import { disciplineLabel, disciplineColor, styleMeta } from './data.js'
import { entryHref } from './hooks.js'

// One reference. Thumbnails are small WebP files; only what scrolls near the viewport loads.
export const Card = memo(function Card({ e, showStyle = true }) {
  return (
    <a className="card" href={entryHref(e.name)} style={{ '--dc': disciplineColor(e.discipline) }}>
      <span className="card-img">
        <img src={e.thumb} alt={e.title} loading="lazy" decoding="async" width="260" height="325" />
      </span>
      <span className="card-meta">
        <span className="card-kicker">
          <i className="dot" />
          {disciplineLabel(e.discipline)} · {e.designType}
        </span>
        <span className="card-title">{e.title}</span>
        {showStyle && <span className="card-style" style={{ color: styleMeta(e.designStyle).accent }}>{e.designStyle}</span>}
      </span>
    </a>
  )
})

export const Count = ({ n }) => <b className="count">{n.toLocaleString()}</b>

export const StyleDot = ({ style }) => <i className="sdot" style={{ background: styleMeta(style).accent }} />

// Four-segment bar showing how a set of entries splits across the disciplines.
export function SplitBar({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return (
    <span className="split" aria-hidden="true">
      {['web', 'app', 'branding', 'print-social'].map((d) => (
        <i key={d} style={{ width: `${(100 * (counts[d] || 0)) / total}%`, background: disciplineColor(d) }} title={`${disciplineLabel(d)} ${counts[d] || 0}`} />
      ))}
    </span>
  )
}
