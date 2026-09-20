// All data is derived from entries/*.json at build time — adding an entry file
// automatically updates every count, filter and the glossary.
const modules = import.meta.glob('../entries/*.json', { eager: true })

export const DISCIPLINES = [
  { slug: 'web', label: 'Web' },
  { slug: 'app', label: 'App' },
  { slug: 'branding', label: 'Branding' },
  { slug: 'print-social', label: 'Print & Social' },
]
export const disciplineLabel = (slug) => DISCIPLINES.find((d) => d.slug === slug)?.label ?? slug

const STOP = new Set(
  ('a an and are as at be but by can for from has have in into is it its of on or over so than that the their them then these this those to up use used uses using via was were when where which while with without your you not one two three each every more most other some such only also just like make makes made per out off both any all very too between across around behind beside above below through against within along before after under against onto upon same still even much many well set sets keep keeps give gives take takes let lets add adds show shows place placed put puts rather instead near next away back full etc them they what who how why one ones own real single').split(/\s+/),
)

const words = (text) =>
  [...new Set(text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [])].filter((w) => !STOP.has(w))

export const entries = Object.values(modules)
  .map((m) => m.default ?? m)
  .map((e) => ({
    ...e,
    _hay: [
      e.title, e.designType, e.discipline, e.tags.join(' '), e.whatItIs, e.whatItMeans,
      e.techniques.join(' '), e.bestFor.join(' '), e.vocabulary.map((v) => `${v.term} ${v.definition}`).join(' '),
    ].join(' ').toLowerCase(),
    _words: new Set(words(e.techniques.join(' '))),
  }))
  .sort((a, b) => a.title.localeCompare(b.title))

export const byName = new Map(entries.map((e) => [e.name, e]))
export const imageUrl = (e) => `${import.meta.env.BASE_URL}${e.image}`

// Technique themes: the most common meaningful words across all techniques.
const wordCounts = new Map()
for (const e of entries) for (const w of e._words) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1)
export const TECHNIQUE_WORDS = [...wordCounts.entries()]
  .filter(([, n]) => n >= 12)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 150)
  .map(([w]) => w)

// Glossary: merge vocabulary by term (case-insensitive).
const glossaryMap = new Map()
for (const e of entries) {
  for (const v of e.vocabulary) {
    const key = v.term.trim().toLowerCase()
    if (!glossaryMap.has(key)) glossaryMap.set(key, { term: v.term.trim(), definitions: new Map(), entries: [] })
    const g = glossaryMap.get(key)
    const dkey = v.definition.trim()
    if (!g.definitions.has(dkey)) g.definitions.set(dkey, [])
    g.definitions.get(dkey).push(e.name)
    if (!g.entries.includes(e.name)) g.entries.push(e.name)
  }
}
export const glossary = [...glossaryMap.values()]
  .map((g) => ({ term: g.term, definitions: [...g.definitions.entries()].map(([text, names]) => ({ text, names })), entries: g.entries }))
  .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }))
