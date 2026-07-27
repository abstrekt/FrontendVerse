# JavaScript MCQ Quiz

An interactive quiz app with all **155 questions** from [lydiahallie/javascript-questions](https://github.com/lydiahallie/javascript-questions). Questions appear one at a time in random order; both the answer options and the explanation are hidden behind toggles (off by default).

## Quick start

```bash
cd js-mcq-quiz
pnpm install
pnpm start
# Open http://localhost:3000
```

> **Why a server?** The browser blocks `fetch('questions.json')` when you open `index.html` directly via `file://`.

## Features

- **Random order** — questions are shuffled every time you load or restart
- **One at a time** — no scrolling walls of text
- **Two toggles per question** (both start OFF, reset on each new question):
  - **Show options** — reveals A/B/C/D answer buttons
  - **Show explanation** — reveals the correct answer + formatted markdown explanation
- **Click to answer** — instant green/red feedback; the correct answer is always highlighted after you pick
- **Score tracking** — `Score: 8/11` in the header
- **Press Enter** to advance to the next question
- **Restart (reshuffle)** button on the results screen
- **Light / dark theme** — toggle from the toolbar (persists in localStorage)
- **Syntax highlighting** (on/off) — code blocks highlighted via highlight.js

## Adding your own questions

Edit `questions.json` and append an object matching the schema:

```json
{
  "id": 999,
  "question": "What is the output?",
  "body": "```js\nconsole.log(typeof null);\n```",
  "options": [
    { "key": "A", "text": "`\"null\"`" },
    { "key": "B", "text": "`\"object\"`" },
    { "key": "C", "text": "`\"undefined\"`" },
    { "key": "D", "text": "`null`" }
  ],
  "answer": "B",
  "explanation": "`typeof null` returns `\"object\"` — this is a well-known JavaScript bug from its first implementation."
}
```

- `id` — unique number, used only for ordering in the raw JSON
- `question` — the question text (plain or single-line)
- `body` — optional markdown (code blocks, images, etc.) shown between the question and options
- `options` — 2–4 options with `key` (A–D) and `text` (markdown inline, usually backtick-wrapped values)
- `answer` — must match one of the option keys
- `explanation` — markdown shown when the **Show explanation** toggle is open

## Re-syncing from the upstream repo

```bash
node tools/fetch-questions.mjs
```

> ⚠️ **This overwrites `questions.json`** — any hand-added questions will be lost. Keep your custom questions in a separate file and merge them manually, or add your own entries after re-running the parser.

## How it's built

- **Vue 3** (CDN) — reactive UI, no build step
- **marked** (CDN) — parses all question bodies, option texts, and explanations as markdown
- **highlight.js** (CDN) — syntax highlights code blocks in questions and explanations
- **Parser** (`tools/fetch-questions.mjs`) — downloads the raw README from the `javascript-questions` repo and extracts every question into structured JSON
