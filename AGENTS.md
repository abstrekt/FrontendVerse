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
| Browser & Web Platform | `data/browser-platform-learnings.json` | `LearningsView` |
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
| Column widths | `src/hooks/useColumnWidths.js` + `components/ColumnResizer.jsx` | Draggable seams. A drag writes `--nav-width`/`--panel-width` straight to the DOM and only commits to React on pointerup. Bounds are viewport-relative, so a stored width is clamped for display without being overwritten. |
| Nav rail | `src/components/Sidebar.jsx` | Rows are generated from `SECTIONS` in `src/sections/registry.js`; counts arrive as one `{ id: { done, total } }` map built in App. |
| Top bar | `src/components/TopBar.jsx` | Section title, streak, search, shortcuts. Section-local controls go in `actions`. |
| Contextual panel | `src/components/PanelList.jsx` | The shared item list behind `LearningsPanel` and `CodingPanel`. `FilterPanel` is the MCQ variant. |
| Overview | `src/components/Dashboard.jsx` | Route `/`. Derived entirely from state App already holds. |

Adding a section is one entry in `src/sections/registry.js` plus a row in
the `navCounts` map in `App.jsx` — not a hand-written `<li>`.

**Binding a key locally?** Call `preventDefault`. `useKeyboardShortcuts`
skips any event that is already `defaultPrevented`, which is what stops a
global binding (ArrowRight = next question) from also firing while the focus
is in a widget that owns arrows — the column resizers and the step-through
traces both rely on it.

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

## React diagrams and traces

Every item in the four React files carries a generated section — a themed
draw.io blueprint for the mechanism, then a steppable trace of it running on
one concrete case.

```bash
pnpm run build:diagrams react     # the blueprint set (needs the draw.io CLI)
pnpm run build:react-traces       # write the sections into the JSON
node scripts/apply-react-traces.mjs --check   # CI guard; part of `pnpm test`
node scripts/apply-react-traces.mjs --section=react-guide   # one section, while authoring
```

| File | Role |
| --- | --- |
| `scripts/lib/react-diagrams.mjs` | **The blueprints** — ~35 `build()` functions, explicit coordinates, same DSL as Blind 75. |
| `scripts/lib/react-traces.mjs` | **The table**, keyed by section then item id: `{ diagram, alt, after, trace }`. Edit here. |
| `scripts/apply-react-traces.mjs` | Writes a `## 📊 How It Works` section into `react-guide`, `advanced-react`, `react-learnings` and `react-mcq-questions`. Idempotent. |
| `scripts/lib/trace-validate.mjs` | The shared shape check, used by both appliers. |
| `scripts/lib/diagram-lint.mjs` | Geometry check run during the diagram build — a cell outside the canvas fails it; a clipped label or a partial overlap warns. |

A blueprint is **shared**: a dozen items are about the reference trap and all
of them point at `memo_reference_trap`. The trace is per-item and must follow
the code that item publishes.

**Coverage is enforced.** `--check` fails if any item in those four files has
no entry. The only exemptions are listed in `DIAGRAM_ONLY` — `react-guide` 1
and 39, which are index pages with no single mechanism to step through.

Placement defaults to the end of the item's opening section; set `after` to an
exact `## Heading` to put it somewhere else. MCQ entries write into
`explanation`, which has no headings, so the section is appended.

**Lane kinds** beyond the Blind 75 `cells` row — `tree`, `slots`, `phases`
and `log` — are documented in `src/components/VisualTrace.jsx` and enforced by
`trace-validate.mjs`. Tones are `active · hit · bad · skip · window · done`.
Notes, the input line and the result render `` `code` `` and `**bold**`.

## Adding content

**Read the project skill before adding or bulk-loading content:**

[`.cursor/skills/load-quiz-content/SKILL.md`](.cursor/skills/load-quiz-content/SKILL.md)

It documents schemas, tagging conventions, coding test runners, merge patterns, and a step-by-step checklist.

## Reading order

`JavaScript learnings` and `Browser & Web Platform` are ordered by a curriculum
rather than by the order their source files happen to merge.

| File | Role |
| --- | --- |
| `src/data/curriculum.js` | **The order.** One module table per section: `{ key, label, ids }` in teaching order. Edit here. |
| `src/data/datasets.js` | Applies it after the merge (`applyCurriculum`) and stamps `module` / `moduleKey` on every entry. |
| `src/components/PanelList.jsx` | `groupBy="module"` renders the sticky module headers. |
| `src/data/curriculum.test.js` | CI guard; part of `pnpm test`. |

**Adding a learning to one of these sections means adding its id to a module**,
otherwise it lands at the end under "Unsorted" and the test fails. Ids are the
URL and the localStorage key for starred/completed/archived — never renumber one
to move an entry, move it in the table.

These two sections are **theory only**. Anything whose point is an
implementation (a polyfill, debounce, a scheduler) belongs in
[`data/coding-questions.json`](data/coding-questions.json), where it gets a
template and runnable tests. `data/polyfill-learnings.json` used to duplicate
those seventeen challenges as prose and was folded into their `explanation`
fields.

Moving an entry between sections needs a `relocateStoreIds` migration in
`App.jsx` — starred, completed and archived are all keyed by section + id.

## Build scripts

- `pnpm run build:output-questions` — regenerate output questions from external README
- `pnpm run validate:learning-ids` — fail on duplicate ids across merged JS learnings files
- `pnpm build` — production build
