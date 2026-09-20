# Design Inspiration Library

An open reference of design work that Claude Design (or anyone) can explore freely. **Nothing in it is a rule** — entries describe what a piece of design does and why it works, so the moves can be borrowed, mixed and re-applied to very different work, including across disciplines.

Disciplines: `web`, `app`, `branding`, `print-social`.

## Layout

```
images/          one image per entry, named <discipline>-<descriptive-slug>.<ext>
entries/         <name>.json (source of truth) + <name>.md (readable copy) per image
LIBRARY.md       generated index of every entry, grouped by discipline (see sync rule)
scripts/         ingest.mjs (add entries) · build-library.mjs (regenerate/validate LIBRARY.md)
src/, index.html Vite + React browsing app (reads entries/*.json at build time)
```

## Entry schema (`entries/<name>.json`)

`<name>` equals the image filename without its extension, and always starts with the discipline: `web-`, `app-`, `branding-`, `print-social-`.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Same as the file/image basename, e.g. `branding-geometric-wordmark` |
| `image` | string | Relative path, `images/<name>.<ext>` |
| `discipline` | `web` \| `app` \| `branding` \| `print-social` | Top-level category |
| `designType` | string | Style or format within the discipline (e.g. "SaaS landing page", "Wordmarks", "Social template pack"). **Reuse an existing value when one fits** — the app counts and filters by exact string |
| `title` | string | Short descriptive title |
| `tags` | string[] | Lowercase keywords |
| `whatItIs` | string | Plain description of what is shown |
| `whatItMeans` | string | Why it works; the mood it creates |
| `techniques` | string[] | The design moves used, phrased so they could inspire very different work, in other disciplines too |
| `bestFor` | string[] | Kinds of projects, audiences and goals it suits |
| `vocabulary` | `{term, definition}[]` | Design terms a reader could learn from this entry |

`entries/<name>.md` mirrors the JSON as readable Markdown (title, image, discipline/type/tags, and a section per field). `scripts/ingest.mjs` writes both files.

Classification notes: phone/tablet mockup scenes → `app`; brand social templates, posters, ads and UI-promo cards → `print-social`; case-study covers that show a site → `web`; UI component snippets → `web` (designType e.g. "UI components").

## Adding entries

1. Put new images in `images/` (any name).
2. Look at each image closely and write a batch file: an array of `{ "file": "<original filename>", "slug": "<discipline>-<descriptive-slug>", ...schema fields except name/image }`.
3. `node scripts/ingest.mjs path/to/batch.json` — renames the image to `<slug>.<ext>` and writes the `.json` and `.md`.
4. `npm run library` — regenerates `LIBRARY.md`.
5. `npm run check` — validates every entry and confirms `LIBRARY.md` is in sync.

Write batch JSON as plain UTF-8 **without a BOM** (PowerShell's `Set-Content`/`ConvertTo-Json` can add one).

## LIBRARY.md must always stay in sync

`LIBRARY.md` indexes every entry grouped by discipline (then design type), with a one-line summary, techniques, bestFor and image path. It is **generated** — never edit it by hand.

Whenever an entry is added, edited, renamed or deleted (JSON, MD or image), run `npm run library` before finishing, and confirm with `npm run check` (exits non-zero if an entry is invalid or `LIBRARY.md` is stale). Deleting an entry means deleting its `.json`, `.md` and image together.

## Web app

`npm install`, then `npm run dev` (or `npm run build` → `dist/`). The app has no manual counts: discipline, design-type and technique-facet counts are computed from `entries/*.json` at load, so they update automatically as entries are added. Images in `images/` are served at `/images/` by a small plugin in `vite.config.js`.

Features: browse by discipline → design type, technique filter (common words drawn from all `techniques`, with live counts), full-text search across every field, per-entry detail view, glossary of all vocabulary (terms merged case-insensitively across entries). Filters live in the URL hash so views are linkable.
