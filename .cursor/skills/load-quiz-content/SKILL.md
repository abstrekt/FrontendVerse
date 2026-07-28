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

- IDs are unique **within** each file, not globally across sections.
- When merging supplemental JSON (e.g. `polyfill-learnings.json`), continue IDs from the base file.
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

## Deduping

Before adding, scan the target file(s) (and Coding↔Learnings twins) for the same title, `functionName` / API, or essentially identical code/`body`. Skip near-duplicates and report existing ids unless the user asked to replace/update.

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
- For large batches, use a supplemental file and merge in `App.jsx`:

```js
import polyfillLearningsData from '../data/polyfill-learnings.json';
const allLearnings = [...learningsData.learnings, ...polyfillLearningsData.learnings];
```

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

1. Choose section(s): Learnings only, Coding only, or both (linked by matching id + tags).
2. Dedupe against existing entries (title / code / `functionName`); skip or update — don’t silently duplicate.
3. Pick next available id(s) in the target JSON file for **new** items only.
4. Write data with correct schema, tags, `source`, and test cases.
5. If supplemental file: import + merge in `App.jsx`; set file-level `source` when the batch shares one origin.
6. If new runner needed: extend `codingRunner.js`; keep result shape `{ passed, input, expected, got }`.
7. If UI assumes a specific shape: update `CodingChallenge.jsx` generically, not per question.
8. Run `pnpm dev`; spot-check render + test execution.
9. Do not commit unless asked.

## Reference example: polyfill batch

The canonical dual-section import:

| File | Content |
| ---- | ------- |
| `data/polyfill-learnings.json` | 17 read-only articles (ids 2–18), `tags: ["polyfill", ...]` |
| `data/coding-questions.json` | 17 practice problems (ids 2–18), `topics: ["polyfill", ...]` |

Tag mapping:

| id | Title | Tags |
| -- | ----- | ---- |
| 2 | Array.map() | polyfill, Array, iteration |
| 3 | Array.filter() | polyfill, Array, iteration |
| 4 | Array.reduce() | polyfill, Array, iteration |
| 5 | Function.call() | polyfill, Function, this |
| 6 | Function.apply() | polyfill, Function, this |
| 7 | Function.bind() | polyfill, Function, this |
| 8 | Deep Copy | polyfill, objects, recursion |
| 9 | Deep Merge | polyfill, objects, recursion |
| 10 | Flatten Array (infinite) | polyfill, Array, recursion |
| 11 | Flatten with Level | polyfill, Array, recursion |
| 12 | Debounce | polyfill, timing, closures |
| 13 | Throttle | polyfill, timing, closures |
| 14 | Promise Polyfill | polyfill, Promise, async |
| 15 | Promise.all() | polyfill, Promise, async |
| 16 | Promise.race() | polyfill, Promise, async |
| 17 | Promise.any() | polyfill, Promise, async |
| 18 | Promise.allSettled() | polyfill, Promise, async |

## Verification

```bash
pnpm dev
```

1. **Learnings** — 18 items; polyfill entries show `polyfill` + concept badges.
2. **Coding** — 18 questions; run tests on `myMap`, debounce, `promiseAny`.
3. **Output / MCQ** — unchanged; spot-check one question each if you touched shared code.
