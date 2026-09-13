---
name: load-quiz-content
description: >-
  Load or add content to js-mcq-quiz: MCQ questions, Learnings articles,
  Coding challenges, or Output questions. Use when adding questions, polyfills,
  bulk-importing content, or extending the coding test runner.
---

# Load Quiz Content

Use this skill when adding or bulk-loading content into the js-mcq-quiz app.

## Architecture

| Section         | Data file                                      | Loaded in   | UI component         |
| --------------- | ---------------------------------------------- | ----------- | -------------------- |
| MCQ             | `questions.json`                               | `App.jsx`   | `QuizQuestion`       |
| Learnings (JS)  | `data/learnings.json` (+ merge files)          | `App.jsx`   | `LearningsView`      |
| React Learnings | `data/react-learnings.json`                    | `App.jsx`   | `LearningsView`      |
| HLD             | `data/hld-learnings.json`                      | `App.jsx`   | `LearningsView`      |
| Coding          | `data/coding-questions.json`                   | `App.jsx`   | `CodingChallenge`    |
| Output          | `data/output-questions.json`                   | `App.jsx`   | `OutputQuizQuestion` |

## ID conventions

- **JS Learnings:** ids are **globally unique across all five merged files** (not per-file). Merged in `src/data/datasets.js` from `learnings.json`, `tekion-interview-learnings.json`, `wtfjs-learnings.json`, `devto-interview-learnings.json`, and `senior-frontend-learnings.json`.
- **JS Learnings and Browser & Web Platform are theory-only and curriculum-ordered.** A new entry must also be added to a module in `src/data/curriculum.js`, or `pnpm test` fails and it renders under "Unsorted". Anything whose point is an implementation goes to Coding instead.
- Before assigning a new JS Learnings id, run `pnpm run validate:learning-ids --next-id` to get `max(id) + 1` across the merged set.
- **Other sections** (React Learnings, HLD, Algorithm, Coding, MCQ, Output): ids are unique within each file/section.
- **Paired Learnings + Coding (opt-in):** reuse the coding question's id only if that id is **not already taken** in the merged JS learnings set. If taken, pick a new id and report the mismatch.
- Sidebar counts update automatically — no manual wiring needed.

## Tagging

| Section   | Field     | Pattern                                      |
| --------- | --------- | -------------------------------------------- |
| Learnings | `tags`    | concept tags only (`React`, `event loop`, …) |
| Learnings | `company` | optional — renders as distinct company badge |
| Coding    | `topics`  | same values as learnings `tags`              |
| MCQ       | `topics`  | concept tags + `difficulty`                  |

- Do **not** put internal metadata in `tags` (no `companies`, `interview`, or company slug).
- Use `company` (e.g. `"Tekion"`) for interview/company-sourced content; UI shows it separately from topic badges.
- MCQ difficulty: `easy` | `medium` | `hard` | `advance`.

## Provenance (`source`)

JSON has no comments. Persist origin with a short **`source`** string on **every new entry** (and file-level `"source"` for single-origin supplemental files — see `data/output-questions.json`).

Examples: `"https://…"`, `"Tekion interview notes"`, `"user paste: event loop"`, `"user request: debounce polyfill"`.

Keep `source` short (citation only). Full material goes in content fields. UI may ignore per-item `source`.

## Section routing

**Default: one section only.**

- **Pure explanation** → **Learnings** (`answer` field)
- **Pure implementation / coding problem** → **Coding** (`description`, `template`, `testCases`; reference solution in `explanation`)

Do **not** auto-add both unless the user explicitly asks.

- **Paired loads (opt-in):** when the user asks for both, match `id`, title, and `tags` ↔ `topics` across Learnings + Coding.

## Deduping (compare → merge, don’t discard blindly)

Before adding, scan the target file(s) for the same title, `functionName` / API, or essentially identical code/`body`. When adding a paired batch, also scan the twin section.

**Never skip a match without reading both sides.** Compare the incoming material to the existing entry’s content fields (`answer`, `explanation`, `description`, `testCases`, `options`, solution quality, edge-case coverage, clarity). Then choose one action:

| Verdict | Action |
| ------- | ------ |
| Incoming is worse or equal (same ideas, thinner/worse explained) | **Skip** — report `skipped duplicate → id N (file)` |
| Incoming is clearly better (clearer explanation, fuller solution, better tests/examples, fixes errors) | **Update** — keep existing `id`; merge best of both into that entry; refresh `source` |
| Overlap but each has unique value (extra edge cases, alternate approach, missing examples) | **Merge** — keep `id`; fold unique bits into existing fields; don’t create a second entry |
| Same topic, clearly different angle | **Add** — new id; distinct title |

Merge rules:
- Keep the existing `id` on update/merge; never invent a parallel duplicate.
- Prefer the clearer prose; keep correct technical detail from either side.
- Coding: prefer broader/correct `testCases`; keep a solid `template`; put the best reference solution in `explanation`.
- Learnings/MCQ: prefer well-structured markdown with examples; don’t drop unique insights from the existing entry.
- Report outcomes: `updated id N`, `merged into id N`, or `skipped duplicate → id N`.

## Learnings schema

```json
{
  "id": 2,
  "title": "Array.map() polyfill",
  "tags": ["polyfill", "Array", "iteration"],
  "source": "https://example.com/polyfills",
  "answer": "Markdown with ```code``` blocks, examples, and follow-ups."
}
```

Interview / company entry:

```json
{
  "id": 1,
  "title": "React Collapsible List",
  "company": "Tekion",
  "tags": ["React", "UI"],
  "source": "Tekion interview notes",
  "answer": "..."
}
```

- `answer` is markdown; code blocks render via `CodeBody`.
- For large batches, use a supplemental file and add it to the merge list in
  `src/data/datasets.js` (and to `scripts/validate-learning-ids.mjs`,
  `scripts/build-data-manifest.mjs`, `scripts/format-code-snippets.mjs`,
  `src/data/curriculum.test.js`).

## Coding schema

```json
{
  "id": 2,
  "title": "Array.map() polyfill",
  "difficulty": "easy",
  "topics": ["polyfill", "Array", "iteration"],
  "source": "https://example.com/polyfills",
  "runner": "expression",
  "functionName": "myMap",
  "description": "Markdown problem statement",
  "template": "Array.prototype.myMap = function (callback, thisArg) {\n  // Write your code here\n};\n",
  "testCases": [
    {
      "setup": "const arr = [1, 2, 3];",
      "code": "arr.myMap(x => x * 2)",
      "expected": [2, 4, 6]
    }
  ],
  "explanation": "Markdown reference solution"
}
```

### Runner types (`src/utils/codingRunner.js`)

| `runner`               | When to use                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `sequentialResolution` | Custom async harness with global `resolvedPromises` side effect     |
| `expression`           | Sync: run user code, eval `setup` + `code`, `deepEqual` on result  |
| `asyncExpression`      | Same but `await` the expression (Promises, MyPromise)               |
| `timer`                | debounce/throttle — fake `setTimeout` with working `clearTimeout`   |

**Expression test case shape:**

```json
{
  "setup": "const arr = [1, 2, 3];",
  "code": "arr.myMap(x => x * 2)",
  "expected": [2, 4, 6]
}
```

**Timer test case shape:**

```json
{
  "setup": "let count = 0; const fn = () => count++; const debounced = debounce(fn, 100);",
  "calls": [
    { "expr": "debounced()", "advance": 0 },
    { "expr": "debounced()", "advance": 10 },
    { "expr": "debounced()", "advance": 10 }
  ],
  "code": "count",
  "expected": 1
}
```

**Sequential resolution test case shape:**

```json
{
  "input": { "promises": [1, 2, 0, 1], "order": [2, 1, 3, 4] },
  "expected": { "resolvedPromises": [2, 1], "error": "Error Thrown" }
}
```

Rules:
- Callbacks and sparse arrays go in `setup`/`code` strings (not raw JSON).
- When adding a new test pattern, add a runner — don't hardcode per-question logic in the UI.
- All runners return `{ passed, input, expected, got }`.

## Output questions

- Regenerate via `pnpm run build:output-questions` ([`scripts/build-output-questions.mjs`](../../../scripts/build-output-questions.mjs)).
- Schema: `code`, `expectedLines`, `async` flag.
- Validated by [`src/utils/jsRunner.js`](../../../src/utils/jsRunner.js) with fake timers for async snippets.

## MCQ questions

- Root [`questions.json`](../../../questions.json).
- Helper scripts: [`tools/fetch-questions.mjs`](../../../tools/fetch-questions.mjs), [`tools/tag-questions.mjs`](../../../tools/tag-questions.mjs).
- Schema: `question`, `body` (markdown code fence), `options[{key,text}]`, `answer`, `explanation`, `topics`, `difficulty`, `source`.

## Checklist for adding a content batch

1. Choose **one section** by default (Learnings, Coding, MCQ, or Output). Dual-section (linked Learnings + Coding) only when the user explicitly requests it.
2. Dedupe against existing entries (title / code / `functionName`); **compare content** — skip only if equal/worse; otherwise update or merge into the existing `id`.
3. Pick next globally unique id(s) for JS Learnings via `pnpm run validate:learning-ids --next-id` (or a reserved pair id when safe). For other sections, use next id in the target file.
4. Write data with correct schema, tags, `source`, and test cases.
5. If supplemental file: import + merge in `App.jsx`; set file-level `source` when the batch shares one origin.
6. If new runner needed: extend `codingRunner.js`; keep result shape `{ passed, input, expected, got }`.
7. If UI assumes a specific shape: update `CodingChallenge.jsx` generically, not per question.
8. Run `pnpm run validate:learning-ids` (must pass for JS Learnings); run `pnpm dev` and spot-check render + test execution.
9. Do not commit unless asked.

## Reference example: the polyfill batch

The seventeen polyfills (`Array.map`, `Function.bind`, Debounce, Throttle, the
Promise combinators) are the canonical **paired** batch — and the worked example
of where each half belongs.

They exist **only** in [`data/coding-questions.json`](data/coding-questions.json)
(ids 3–19), each with a `template`, `testCases`, and an `explanation` carrying
the solution, a "Behind the scenes" walkthrough and interview follow-ups. They
used to be duplicated as read-only articles in a `polyfill-learnings.json`; that
file was folded into those `explanation` fields and deleted, because a section
that is theory and a section that is practice should not both own the same
topic.

So for a paired import, opt-in means: the **concept** goes to a learnings
section and into a curriculum module; the **implementation** goes to Coding.
Tags mirror topics (`tags` ↔ `topics`), primary category first — for these,
`polyfill` then the concept (`Array`, `Promise`, `this`).

Reuse an id across the pair only if it is free in the merged JS learnings set;
`pnpm run validate:learning-ids --next-id` reports the next free one.

## Verification

```bash
pnpm test    # unit tests, duplicate-id check, curriculum coverage
pnpm dev
```

1. **Learnings / Browser** — the new entry appears under the module you filed it in, not under "Unsorted".
2. **Coding** — the challenge runs its tests.
3. **Output / MCQ** — unchanged; spot-check one question each if you touched shared code.
