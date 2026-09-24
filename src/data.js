// Everything is derived from entries/*.json at load time, so adding an entry file
// updates every count, filter, style group and the glossary automatically.
import STYLE_ORDER from '../scripts/styles.json'

const modules = import.meta.glob('../entries/*.json', { eager: true })

export const DISCIPLINES = [
  { slug: 'web', label: 'Web', color: '#7fd6ff' },
  { slug: 'app', label: 'App', color: '#c6ff3d' },
  { slug: 'branding', label: 'Branding', color: '#ff8f6b' },
  { slug: 'print-social', label: 'Print & Social', color: '#c9a7ff' },
]
export const disciplineLabel = (slug) => DISCIPLINES.find((d) => d.slug === slug)?.label ?? slug
export const disciplineColor = (slug) => DISCIPLINES.find((d) => d.slug === slug)?.color ?? '#fff'

// Each style gets its own accent, so the whole page re-tints when you enter one.
export const STYLE_META = {
  Minimalist: { accent: '#e4dfd2', slug: 'minimalist' },
  Glassmorphism: { accent: '#8adfff', slug: 'glass' },
  'Dark & Neon': { accent: '#c6ff3d', slug: 'neon' },
  'Gradient & Aurora': { accent: '#ff6fb5', slug: 'aurora' },
  'Geometric & Bauhaus': { accent: '#ff5240', slug: 'geo' },
  'Playful & Illustrated': { accent: '#ffd23f', slug: 'playful' },
  'Warm & Organic': { accent: '#ff9d5c', slug: 'warm' },
  'Photographic & Cinematic': { accent: '#f1efe9', slug: 'photo' },
  'Corporate & Clean-Tech': { accent: '#5d8bff', slug: 'corp' },
  '3D & Surreal': { accent: '#b895ff', slug: 'three' },
  Editorial: { accent: '#f4e9d0', slug: 'editorial' },
  'Retro & Pixel': { accent: '#3dff8f', slug: 'retro' },
  'Neo-Brutalist': { accent: '#ffe600', slug: 'brutal' },
}
export const styleMeta = (s) => STYLE_META[s] ?? { accent: '#c6ff3d', slug: 'neon' }

const STOP = new Set(
  ('a an and are as at be but by can for from has have in into is it its of on or over so than that the their them then these this those to up use used uses using via was were when where which while with without your you not one two three each every more most other some such only also just like make makes made per out off both any all very too between across around behind beside above below through against within along before after under onto upon same still even much many well set sets keep keeps give gives take takes let lets add adds show shows place placed put puts rather instead near next away back full etc they what who how why ones own real single').split(/\s+/),
)
const words = (text) => [...new Set(text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [])].filter((w) => !STOP.has(w))
const BASE = import.meta.env.BASE_URL

export const entries = Object.values(modules)
  .map((m) => m.default ?? m)
  .map((e) => ({
    ...e,
    designStyle: e.designStyle || 'Minimalist',
    thumb: `${BASE}thumbs/${e.name}.webp`,
    url: `${BASE}${e.image}`,
    _hay: [
      e.title, e.designType, e.designStyle, e.discipline, e.tags.join(' '), e.whatItIs, e.whatItMeans,
      e.techniques.join(' '), e.bestFor.join(' '), e.vocabulary.map((v) => `${v.term} ${v.definition}`).join(' '),
    ].join(' ').toLowerCase(),
    _words: new Set(words(e.techniques.join(' '))),
  }))
  .sort((a, b) => a.title.localeCompare(b.title))

export const byName = new Map(entries.map((e) => [e.name, e]))

// Styles present in the data, in the curated order first, then any new ones.
export const STYLES = [...new Set([...STYLE_ORDER, ...entries.map((e) => e.designStyle)])].filter((s) =>
  entries.some((e) => e.designStyle === s),
)

// Technique themes: the most common meaningful words across every entry's techniques.
const wc = new Map()
for (const e of entries) for (const w of e._words) wc.set(w, (wc.get(w) ?? 0) + 1)
export const TECHNIQUE_WORDS = [...wc.entries()]
  .filter(([, n]) => n >= 18)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 140)
  .map(([w]) => w)

// Lists by style, for prev/next and "same style elsewhere".
export const byStyle = new Map(STYLES.map((s) => [s, entries.filter((e) => e.designStyle === s)]))

// Glossary: merge vocabulary by term (case-insensitive), grouped by first letter.
const gm = new Map()
for (const e of entries) {
  for (const v of e.vocabulary) {
    const key = v.term.trim().toLowerCase()
    if (!gm.has(key)) gm.set(key, { term: v.term.trim(), defs: new Map(), entries: [] })
    const g = gm.get(key)
    const d = v.definition.trim()
    if (!g.defs.has(d)) g.defs.set(d, 0)
    g.defs.set(d, g.defs.get(d) + 1)
    if (!g.entries.includes(e.name)) g.entries.push(e.name)
  }
}
export const glossary = [...gm.values()]
  .map((g) => ({ term: g.term, definitions: [...g.defs.keys()], entries: g.entries, letter: (g.term[0] || '#').toUpperCase() }))
  .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }))
export const glossaryLetters = [...new Set(glossary.map((g) => (/[A-Z]/.test(g.letter) ? g.letter : '#')))].sort()

// Deterministic pseudo-random pick so "more like this" is stable per entry.
export function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

// One-line feel for each style, shown on the style page.
export const STYLE_BLURB = {
  Minimalist: 'Quiet surfaces, generous space and one decision per screen. Restraint as the loudest move.',
  Glassmorphism: 'Frosted, translucent layers over colour. Depth made from blur and light.',
  'Dark & Neon': 'Near-black grounds with a single electric accent. Glow, contrast and night-time confidence.',
  'Gradient & Aurora': 'Soft colour washes, mesh blends and light bleeding in from the edges.',
  'Geometric & Bauhaus': 'Circles, squares and grids doing the work. Modular, rhythmic, built from simple shapes.',
  'Playful & Illustrated': 'Stickers, doodles, mascots and rounded shapes. Friendly first, polished second.',
  'Warm & Organic': 'Earth tones, paper, wood and natural texture. Calm, tactile and handmade.',
  'Photographic & Cinematic': 'The image leads. Grain, light and people, with type laid over the top.',
  'Corporate & Clean-Tech': 'Clear hierarchy, trustworthy blues and data made legible. Professional without being dull.',
  '3D & Surreal': 'Rendered objects, chrome and impossible scenes. Physical materials in a digital world.',
  Editorial: 'Serif and italic voices, magazine pacing and considered typography.',
  'Retro & Pixel': 'Pixels, halftone, dither and nostalgia. Screens remembering older screens.',
  'Neo-Brutalist': 'Hard outlines, offset shadows, raw type and loud flat colour. Anti-polish on purpose.',
}
