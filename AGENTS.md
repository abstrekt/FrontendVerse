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

All sections load in [`src/App.jsx`](src/App.jsx). Sidebar counts update automatically from array lengths.

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
- `pnpm build` — production build
