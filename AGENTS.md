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
| Web Fundamentals | `data/web-fundamentals.json`       | `LearningsView`     |
| AI-Assisted Development | `data/ai-assisted-development.json` | `LearningsView` |
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
the `navCounts` map in `App.jsx` — not a hand-written `<li>`. The full set of
touch points for a *learning* section (registry, routes, datasets, archive,
starred, completed, search index, ArchivedView, the data manifest, the snippet
formatter, the curriculum table and its test, and ~20 blocks in `App.jsx`) is
enumerated in [`ACCELDATA-PREP-REMOVAL.md`](ACCELDATA-PREP-REMOVAL.md) — build a
new one by mirroring the `css` blocks, which is what `web-fundamentals` and
`ai-dev` did.

**Binding a key locally?** Call `preventDefault`. `useKeyboardShortcuts`
skips any event that is already `defaultPrevented`, which is what stops a
global binding (ArrowRight = next question) from also firing while the focus
is in a widget that owns arrows — the column resizers and the step-through
traces both rely on it.

## Every entry opens with a plain-words summary

**Every learning entry carries a `summary` field** — a jargon-free definition,
the API you actually type, and one concrete example — rendered as a card above
the body, before any hook, diagram or code. It exists because entries used to
open with framing ("Both run JavaScript off the main thread, which is why the
question comes up constantly") that assumes you already know what the thing is.

```bash
node scripts/validate-summaries.mjs                # part of `pnpm test`
node scripts/validate-summaries.mjs --list-missing # what is still unwritten
```

The authoring rules, the reference entry, the two validator rules that catch
people, and the 44 entries still to write are in
[`SUMMARY-CARDS-ROLLOUT.md`](SUMMARY-CARDS-ROLLOUT.md). Read it before writing a
batch — a `signature` invented rather than verified against the entry's own code
blocks is worse than no card at all.

The card renders **outside** the `articleRef` element in `LearningsView`, because
select-to-highlight anchors marks by nth-occurrence within it and prose added
inside would move every stored highlight.

## Visuals are mandatory for new content

**Every new or substantially rewritten entry ships two things: a draw.io
diagram and a steppable `` ```trace `` animation.** A diagram shows the shape,
a trace shows it running. Prose alone is what this rule exists to stop.

Read [`.claude/skills/content-visuals/SKILL.md`](.claude/skills/content-visuals/SKILL.md)
before adding content — it carries the palette rules, the trace contract, the
per-section table of generated vs inline, and the checklist.

The diagrams are **generated**: `scripts/lib/<set>-diagrams.mjs` is the source,
`diagrams/**.drawio` and `public/diagrams/**.svg` are build outputs overwritten
by the next `pnpm run build:diagrams`. So the **draw.io MCP** is used either
side of the build, never as the deliverable:

- **before** — sketch the layout on the draw.io canvas, drag until it reads,
  then port the resulting geometry into the `build()` function
- **after** — open the generated `.drawio` and look at it, to catch overlaps,
  clipped labels and a canvas past 820px before it ships

List the MCP's tools (`mcp__drawio__*`) at the start of a visual task rather
than guessing names. If it is not connected, say so and fall back to writing
the `build()` and reading the exported SVG.

The only exemptions are an index entry with no single mechanism (the React set
tracks these in `DIAGRAM_ONLY`) and the trace half of a Coding challenge whose
runnable tests already are the animation. Everything else without both is
unfinished.

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

## System design diagrams and traces

The `System Design` section is ~80 long-form entries with a tiered visual
budget: twenty hand-built draw.io diagrams for the ideas that need spatial
layout, mermaid for simple flows, and five steppable traces.

```bash
pnpm run build:diagrams sysdesign                 # the whole set
pnpm run build:diagrams sysdesign caching-layers  # one diagram
```

| File | Role |
| --- | --- |
| `scripts/lib/sysdesign-diagrams.mjs` | **The diagrams.** One `build()` per idea, explicit coordinates, same DSL as Blind 75. |
| `scripts/lib/diagram-furniture.mjs` | The shared heading, takeaway strip, legend and pointer caret, plus the 820px canvas width. Used by every set. |
| `diagrams/sysdesign/*.drawio` | Generated source. Editable at app.diagrams.net, overwritten by the next build. |
| `public/diagrams/sysdesign/*.svg` | What ships, referenced from the markdown as `![alt](/diagrams/sysdesign/name.svg)`. |

**Prefer building the whole set.** Cell ids come from a counter that is not
reset between diagrams, so building one on its own renumbers only that file
and leaves it inconsistent with the rest — harmless to render, pure noise in
a diff.

**Traces here are authored inline** in the entry's `answer`, not generated by
an applier. The Blind 75 and React appliers exist because those traces are
injected into articles that were written separately; a system design trace is
written with its article, so a second generator and a second `--check` would
be cost without benefit. They use the same lane kinds and are validated by the
same `trace-validate.mjs` shape check.

**Fence languages matter here.** `format-code-snippets.mjs` runs prettier over
```` ```javascript ```` blocks, so a type signature or a shape sketch that is
not runnable JavaScript is tagged ```` ```typescript ```` — prettier skips it
and `CodeBody` still highlights it.

## Browser & Web Platform diagrams

Two draw.io blueprints, both belonging to learning 132 (`Cookies,
localStorage, and sessionStorage`) — the section's two facts that a table
keeps flattening.

```bash
pnpm run build:diagrams browser                  # both
pnpm run build:diagrams browser storage-scope    # one
```

| File | Role |
| --- | --- |
| `scripts/lib/browser-diagrams.mjs` | **The diagrams.** `storage-scope` (origin vs `Domain` + `Path`) and `cookie-auth` (the round trip, the attributes, XSS vs CSRF). Same DSL and furniture as the other sets. |
| `diagrams/browser/*.drawio` | Generated source; overwritten by the next build. |
| `public/diagrams/browser/*.svg` | What ships, referenced as `![alt](/diagrams/browser/name.svg)`. |

`request-life` and `http-versions` belong to the *Networking & Protocols*
module (ids 160–162); `request-life` also carries an inline ```` ```trace ````
stepping DNS → TCP → TLS → TTFB.

## Web Fundamentals diagrams

```bash
pnpm run build:diagrams webfund
```

| File | Role |
| --- | --- |
| `scripts/lib/webfund-diagrams.mjs` | **The diagrams.** `render-pipeline`, `script-loading`, `font-loading`, `bundler-pipeline`, `a11y-tree`, `layout-systems`, `service-worker`. |
| `diagrams/webfund/*.drawio` | Generated source; overwritten by the next build. |
| `public/diagrams/webfund/*.svg` | What ships, referenced as `![alt](/diagrams/webfund/name.svg)`. |

Traces in Web Fundamentals and Browser are **authored inline** in the entry's
`answer`, like the system-design ones — no applier, no `--check`, validated by
`trace-validate.mjs` at render.

## Cross-links between entries

Every entry links the first prose mention of a topic that has its own entry —
"tree shaking", "event delegation", "CORS" — to the entry that owns it.

```bash
pnpm run build:cross-links                       # apply
node scripts/apply-cross-links.mjs --dry         # report only
node scripts/apply-cross-links.mjs --check       # CI guard; part of `pnpm test`
```

| File | Role |
| --- | --- |
| `scripts/lib/cross-link-map.mjs` | **The dictionary** — one row per topic: `{ section, id, terms }`. Edit here. One canonical owner per topic; terms must be unambiguous in prose, which is why `state`, `cache` and `props` are not in it. |
| `scripts/apply-cross-links.mjs` | The pass. Links the first *prose* mention per topic, skipping fenced code, inline code, headings, image alt, existing links, math and HTML — and never an entry to itself. |

Two rules keep it from turning articles blue: **at most six internal links per
entry, hand-written ones counted**, and only the first mention of each topic.
Counting existing links is also what makes the pass idempotent, which is what
`--check` relies on.

The same pass rewrites a link whose text is its own URL —
`[/coding/41](/coding/41)` — to the target's title. `--check` additionally
fails if a term in the map points at an id that no longer exists.

**A term that links the wrong sense should be deleted from the map**, not
worked around in the applier.

## Adding content

**Read both project skills before adding or bulk-loading content:**

- [`.cursor/skills/load-quiz-content/SKILL.md`](.cursor/skills/load-quiz-content/SKILL.md) — schemas, tagging conventions, coding test runners, merge patterns, and a step-by-step checklist.
- [`.claude/skills/content-visuals/SKILL.md`](.claude/skills/content-visuals/SKILL.md) — the mandatory diagram + trace that ships with every entry.

Content without a diagram and an animation is not done. See
[Visuals are mandatory for new content](#visuals-are-mandatory-for-new-content).

## Reading order

`JavaScript learnings`, `Browser & Web Platform` and `System Design` are
ordered by a curriculum rather than by the order their source files happen to
merge.

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

`learnings` and `browser` are **theory only**. Anything whose point is an
implementation (a polyfill, debounce, a scheduler) belongs in
[`data/coding-questions.json`](data/coding-questions.json), where it gets a
template and runnable tests. `data/polyfill-learnings.json` used to duplicate
those seventeen challenges as prose and was folded into their `explanation`
fields.

Moving an entry between sections needs a `relocateStoreIds` migration in
`App.jsx` — starred, completed and archived are all keyed by section + id.

## Build scripts

- `pnpm run build:data-manifest` — regenerate `data/counts.json`, the nav counts
  shown before the lazy chunks land. **Required after any content change** —
  `src/utils/dataManifest.test.js` fails if it is stale.
- `pnpm run build:diagrams [set] [name]` — build a diagram set (`blind75`,
  `sysdesign`, `react`, `browser`, `webfund`); no arguments builds every set
- `pnpm run build:output-questions` — regenerate output questions from external README
- `pnpm run format:snippets` — prettier over the fenced code in the content JSON
- `pnpm run validate:learning-ids [group] [--next-id]` — fail on duplicate ids
  within a merged group (`learnings`, `system-design`); no group checks all of them
- `pnpm build` — production build
