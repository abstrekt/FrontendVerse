---
name: load-quiz-content
description: Add or bulk-load quiz content (MCQ, Learnings, Coding, Output) using project schemas and conventions
---

# Load Quiz Content

Add or bulk-load content into js-mcq-quiz. Text after `/load` is the user's request (section, source material, batch description).

## First step — read the skill

Before editing any data files, **read and follow**:

[`.cursor/skills/load-quiz-content/SKILL.md`](.cursor/skills/load-quiz-content/SKILL.md)

That skill is the source of truth for schemas, ID conventions, tagging, runner types, merge patterns, and the verification checklist. Do not improvise formats.

## Workflow

1. **Parse the request** — determine section(s): MCQ, Learnings, Coding, Output, or a linked pair (e.g. Learnings + Coding with matching ids/tags).
2. **Inspect existing data** — open the target JSON file(s), find the next available id(s), and note existing tags/runners.
3. **Write content** — follow the skill schemas exactly. For large batches, prefer a supplemental JSON file merged in `App.jsx`.
4. **Extend infrastructure only when needed** — new coding test patterns → add a runner in `src/utils/codingRunner.js`; Output questions → `pnpm run build:output-questions` when appropriate.
5. **Verify** — run `pnpm dev` and spot-check render + test execution per the skill checklist.
6. **Do not commit** unless the user explicitly asks.

## Section quick reference

| Section   | Data file                        | Notes |
| --------- | -------------------------------- | ----- |
| MCQ       | `questions.json`                 | `topics` + `difficulty` |
| Learnings | `data/learnings.json` (+ merges) | `tags`; markdown `answer` |
| Coding    | `data/coding-questions.json`     | `topics` mirror learnings tags; `testCases` + `runner` |
| Output    | `data/output-questions.json`       | Regenerate via build script when sourcing externally |

## Linked batches

When adding paired Learnings + Coding content (like the polyfill batch, ids 2–18):

- Match `id`, title, and tag values across both files (`tags` ↔ `topics`).
- Primary category tag first (e.g. `polyfill`), then 1–3 concept tags.
- Reference: `data/polyfill-learnings.json` + entries in `data/coding-questions.json`.

## If the request is vague

Ask which section(s) to target and whether the user has source material (markdown, URLs, a list of topics). Then proceed using the skill checklist.
