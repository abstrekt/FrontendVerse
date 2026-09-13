# JavaScript MCQ Quiz

A personal JavaScript study app built with React and Vite. Practice MCQs, read learnings, solve coding challenges, and predict console output — all in one place with progress tracking, filters, and a searchable command palette.

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3333](http://localhost:3333).

Other scripts:

```bash
pnpm start      # alias for dev
pnpm build      # production build
pnpm preview    # preview production build
```

Package manager: **pnpm**.

## Sections

| Section | Route | Content | Count |
| --- | --- | --- | ---: |
| **Overview** | `/` | Progress across every section, streak, weak topics | — |
| **MCQ** | `/mcq`, `/mcq/list` | Multiple-choice questions (lydiahallie/javascript-questions + tagged extras) | 189 |
| **Learnings** | `/learnings`, `/learnings/:id` | Markdown articles (polyfills, WTFJS, interview notes, etc.) | 127 |
| **React Learnings** | `/react-learnings` | React-focused articles | 5 |
| **HLD** | `/hld` | High-level design notes | 2 |
| **Coding** | `/coding` | In-browser coding challenges with test runner | 23 |
| **Output** | `/output` | Predict what `console.log` prints | 71 |
| **Archived** | `/archived` | Archived items across all sections | — |

## Features

### MCQ quiz

- One question at a time in a shuffled session
- **Show options** and **Show explanation** toggles (both off by default)
- Instant feedback on answer selection; correct answer highlighted
- **Quiz** and **List** views (`/mcq` and `/mcq/list`)
- Filter by **difficulty** (Easy / Medium / Advanced) and **topic**
- **Practice weak topics** and **Review mistakes** modes
- Skip, archive, star, and mark-as-completed per question
- Session score and lifetime accuracy tracked in localStorage

### Learnings

- Sidebar navigation with article list and mobile chip picker
- Markdown answers with syntax highlighting
- Star, complete, and archive individual articles
- Separate collections for general JS, React, and HLD

### Coding challenges

- Monaco editor with saved drafts and submission history
- Automated test cases with pass/fail feedback
- Polyfill-style challenges (Array methods, Promise utilities, debounce/throttle, etc.)

### Output quiz

- Run the snippet in a sandbox and type your predicted output
- Graded against expected console output
- Optional explanation reveal after checking

### Overview

- Completion ring per section, grouped by technology
- Combined study streak across MCQ, output and coding
- Weak topics and mistake count, each a shortcut into a practice pass

### Global

- **Three-column shell** — nav rail, contextual panel (filters or item list), content. Both side columns are draggable and collapsible; drag the seam, or focus it and use ←/→ (Shift for a bigger step, Home to reset). Widths persist and are clamped to the window.
- **Command palette** — `⌘K` / `Ctrl+K` to search and jump to any question or learning
- **Light / dark theme** — persists in localStorage
- **Mobile layout** — side columns become drawers, progress strip pinned to the bottom
- **Archive** — hide items you no longer want in rotation; restore from Archived tab

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Open command palette |
| `?` | Show the full shortcut list |
| `O` / `E` | Show or hide options / explanation |
| `1`–`4`, `A`–`D` | Pick an option |
| `S` | Skip |
| `Enter` / `N` | Next question (when not typing in an input) |

## Project structure

```
js-mcq-quiz/
├── questions.json              # MCQ questions
├── data/
│   ├── learnings.json          # Core JS learnings (merged with other learning files)
│   ├── wtfjs-learnings.json
│   ├── devto-interview-learnings.json
│   ├── tekion-interview-learnings.json
│   ├── senior-frontend-learnings.json
│   ├── browser-platform-learnings.json  # Browser & Web Platform section
│   ├── react-learnings.json
│   ├── hld-learnings.json
│   ├── coding-questions.json
│   ├── output-questions.json
│   └── scope-output-questions.json
├── src/
│   ├── App.jsx                 # Main app state, routing, progress
│   ├── components/             # UI components per section
│   ├── data/curriculum.js      # Teaching order + module headers per section
│   ├── hooks/                  # useLocalStorage, useAppRoute
│   ├── styles/index.css        # Global styles and themes
│   └── utils/                  # Progress, grading, search, runners
├── scripts/
│   └── build-output-questions.mjs
└── tools/
    └── fetch-questions.mjs     # Re-sync MCQs from upstream repo
```

## Adding content

Content schemas, tagging conventions, and bulk-import patterns are documented in:

[`.cursor/skills/load-quiz-content/SKILL.md`](.cursor/skills/load-quiz-content/SKILL.md)

For agents working in this repo, see also [`AGENTS.md`](AGENTS.md).

### MCQ question schema

```json
{
  "id": 1,
  "question": "What's the output?",
  "body": "```js\nconsole.log(typeof null);\n```",
  "options": [
    { "key": "A", "text": "`\"null\"`" },
    { "key": "B", "text": "`\"object\"`" }
  ],
  "answer": "B",
  "explanation": "`typeof null` returns `\"object\"`.",
  "difficulty": "easy",
  "tags": ["data types"]
}
```

### Re-syncing MCQs from upstream

```bash
node tools/fetch-questions.mjs
```

> This overwrites `questions.json`. Back up any hand-added questions first.

### Regenerating output questions

```bash
pnpm run build:output-questions
```

### Rebuilding the Blind 75 diagrams

Each of the nine pattern blueprints carries a diagram that traces one small
concrete input — the naive cost beside the technique that removes it. They
are authored as code in `scripts/lib/blind75-diagrams.mjs`, exported through
the draw.io CLI, and themed from CSS custom properties so they follow the
light/dark toggle.

```bash
pnpm run build:diagrams            # all ten
pnpm run build:diagrams intervals  # just one
```

Needs the draw.io desktop app; see [`AGENTS.md`](AGENTS.md) for the details.

### Per-problem visual traces

Blind 75 problems carry a steppable trace of their own solution running on one
small input — play, step, or scrub through it. Traces live in
`scripts/lib/blind75-traces.mjs` and are written into the learning bodies with:

```bash
pnpm run build:traces
```

`pnpm test` fails if the two have drifted. Currently written for the ten
Arrays & Hashing problems.

### React diagrams and traces

Every React item — all 105 across the guide, the advanced course, the
interview notes and the MCQs — carries a blueprint diagram of the mechanism it
explains plus a steppable trace of that mechanism running on one concrete
case. The blueprints are shared between the items that need them; the traces
belong to their item.

```bash
pnpm run build:diagrams react   # ~35 blueprints
pnpm run build:react-traces     # write the sections into the JSON
```

Traces here go beyond the row-of-cells board the algorithm traces use: a
component tree that lights up as it re-renders, the hook slot list, the
render → commit → paint pipeline, and a console lane for the "what actually
logs?" questions. `pnpm test` fails if a trace has drifted from its source
table **or if any React item is missing one**.

## Tech stack

- **React 19** + **Vite 6**
- **Monaco Editor** — coding challenges
- **react-markdown** + **react-syntax-highlighter** — learnings and explanations
- **localStorage** — progress, theme, starred/completed/archived state

## License

Content sources vary by file (e.g. [javascript-questions](https://github.com/lydiahallie/javascript-questions), [wtfjs](https://github.com/denysdovhan/wtfjs)). Check individual data files for attribution links.
