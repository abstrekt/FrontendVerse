# js-mcq-quiz — Agent Guide

JavaScript quiz app with content sections: **MCQ**, **Learnings**, **React Learnings**, **HLD**, **Algorithm**, **Coding**, and **Output**.

## Quick start

```bash
pnpm install
pnpm dev
```

Package manager: **pnpm** (`pnpm start` runs the dev server).

## Content sections

| Section   | Data file                          | UI component        |
| --------- | ---------------------------------- | ------------------- |
| MCQ       | `questions.json`                   | `QuizQuestion`      |
| Learnings | `data/learnings.json` (+ merges)   | `LearningsView`     |
| React Learnings | `data/react-learnings.json`  | `LearningsView`     |
| HLD       | `data/hld-learnings.json`          | `LearningsView`     |
| Algorithm | `data/algorithm-learnings.json`    | `LearningsView`     |
| Coding    | `data/coding-questions.json`       | `CodingChallenge`   |
| Output    | `data/output-questions.json`       | `OutputQuizQuestion`|

All sections load in [`src/App.jsx`](src/App.jsx).

## UI structure

| Piece | File | Notes |
| --- | --- | --- |
| Design tokens | `src/styles/index.css` (top) | Colour ramps, type, spacing, elevation. Light and `[data-theme="dark"]`. Component rules compose from these — never a raw hex. |
| App shell | `src/components/Layout.jsx` | Grid: nav rail, top bar, panel + content. Drawers below 860px. |
| Nav rail | `src/components/Sidebar.jsx` | Rows are generated from `SECTIONS` in `src/sections/registry.js`; counts arrive as one `{ id: { done, total } }` map built in App. |
| Top bar | `src/components/TopBar.jsx` | Section title, streak, search, shortcuts. Section-local controls go in `actions`. |
| Contextual panel | `src/components/PanelList.jsx` | The shared item list behind `LearningsPanel` and `CodingPanel`. `FilterPanel` is the MCQ variant. |
| Overview | `src/components/Dashboard.jsx` | Route `/`. Derived entirely from state App already holds. |

Adding a section is one entry in `src/sections/registry.js` plus a row in
the `navCounts` map in `App.jsx` — not a hand-written `<li>`.

## Blind 75 diagrams

```bash
pnpm run build:diagrams            # all ten
pnpm run build:diagrams graphs     # just one
```

| File | Role |
| --- | --- |
| `scripts/lib/blind75-diagrams.mjs` | **The diagrams.** One `build()` per pattern, explicit coordinates. Edit here. |
| `scripts/lib/drawio-builder.mjs` | mxGraph XML helpers — `box`, `cells`, `panel`, `arrow`, `circle`, `pill`. |
| `scripts/lib/svg-postprocess.mjs` | Strips the exporter's base64 PNG text fallbacks (~93% of the bytes) and rewrites every authoring colour to a `--dg-*` custom property. |
| `diagrams/blind75/*.drawio` | Generated source. Opens and edits in draw.io, but is overwritten by the next build. |
| `public/diagrams/blind75/*.svg` | What ships. Inlined by `components/InlineSvg.jsx` so the cascade reaches it and it follows the theme. |

Requires the draw.io desktop CLI (set `DRAWIO_BIN` if it is not on one of
the default paths). Without it the `.drawio` sources are still written and
the SVG step is skipped with a warning.

**Colours must come from the `C` palette in `drawio-builder.mjs`.** Anything
else ships as a fixed value and breaks in one theme; the build prints an
`⚠ unmapped` warning when that happens.

## Blind 75 per-problem traces

Separate from the blueprint diagrams above. Each problem gets a steppable
trace of its own solution running on one small input.

```bash
pnpm run build:traces              # write traces into the learning bodies
node scripts/apply-blind75-traces.mjs --check   # CI guard; part of `pnpm test`
```

| File | Role |
| --- | --- |
| `scripts/lib/blind75-traces.mjs` | **The traces**, keyed by learning id. Edit here. |
| `scripts/apply-blind75-traces.mjs` | Writes them into `data/blind75-learnings.json` as ```` ```trace ```` blocks. Idempotent — replaces an existing Visual Trace section rather than appending. |
| `src/components/VisualTrace.jsx` | Renders a trace: lanes of cells, cursors, marks, named state, step controls. |

The trace is data, not layout: `lanes` + `steps`, roughly ten lines per
problem. That is deliberate — there are ~76 problems, and bespoke figures for
each would neither get finished nor stay correct. The nine *blueprints* keep
their hand-authored draw.io diagrams because each explains a different idea.

`--check` fails if `blind75-traces.mjs` and the JSON have drifted, and the
applier throws if a step marks a lane or sets a variable the trace never
declared. **A trace must match the problem's published solution** — if the
code in a learning changes, update its trace.

Coverage so far: ids 10–19 (Arrays & Hashing). The rest are still to write.

## Adding content

**Read the project skill before adding or bulk-loading content:**

[`.cursor/skills/load-quiz-content/SKILL.md`](.cursor/skills/load-quiz-content/SKILL.md)

It documents schemas, tagging conventions, coding test runners, merge patterns, and a step-by-step checklist.

## Reference example

The polyfill batch (ids 2–18) shows the **paired** dual-section import pattern (opt-in when using `/load` — the command defaults to a single section unless you ask for both):

- Learnings: [`data/polyfill-learnings.json`](data/polyfill-learnings.json) — merged in `App.jsx`
- Coding: entries in [`data/coding-questions.json`](data/coding-questions.json)
- Tags: `polyfill` first, then concept tags (`Array`, `Promise`, `this`, etc.)

## Build scripts

- `pnpm run build:output-questions` — regenerate output questions from external README
- `pnpm run validate:learning-ids` — fail on duplicate ids across merged JS learnings files
- `pnpm build` — production build
