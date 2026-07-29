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
| **MCQ** | `/mcq`, `/mcq/list` | Multiple-choice questions (lydiahallie/javascript-questions + tagged extras) | 231 |
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

### Global

- **Command palette** — `⌘K` / `Ctrl+K` to search and jump to any question or learning
- **Light / dark theme** — persists in localStorage
- **Collapsible sidebar and filter panel** on desktop
- **Mobile layout** — section tabs, progress bar, and responsive quiz footer
- **Archive** — hide items you no longer want in rotation; restore from Archived tab

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Open command palette |
| `Enter` | Next question (when not typing in an input) |

## Project structure

```
js-mcq-quiz/
├── questions.json              # MCQ questions
├── data/
│   ├── learnings.json          # Core learnings (merged with other learning files)
│   ├── polyfill-learnings.json
│   ├── wtfjs-learnings.json
│   ├── devto-interview-learnings.json
│   ├── tekion-interview-learnings.json
│   ├── react-learnings.json
│   ├── hld-learnings.json
│   ├── coding-questions.json
│   ├── output-questions.json
│   └── scope-output-questions.json
├── src/
│   ├── App.jsx                 # Main app state, routing, progress
│   ├── components/             # UI components per section
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

## Tech stack

- **React 19** + **Vite 6**
- **Monaco Editor** — coding challenges
- **react-markdown** + **react-syntax-highlighter** — learnings and explanations
- **localStorage** — progress, theme, starred/completed/archived state

## License

Content sources vary by file (e.g. [javascript-questions](https://github.com/lydiahallie/javascript-questions), [wtfjs](https://github.com/denysdovhan/wtfjs)). Check individual data files for attribution links.
