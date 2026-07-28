---
name: load-quiz-content
description: Ingest a source, dedupe against existing content, auto-route into quiz sections, and store provenance on each entry
---

# Load Quiz Content

Text after `/load` is a **source** (paste, URL, notes, topic list, or mixed). Do **not** wait for the user to name the section, tags, or title — **decide** those from the source, then write content.

## First step — read the skill

Before editing any data files, **read and follow**:

[`.cursor/skills/load-quiz-content/SKILL.md`](.cursor/skills/load-quiz-content/SKILL.md)

Schemas, IDs, runners, merges, and verification live there. This command owns **routing + metadata decisions**.

## Intake

1. Treat everything after `/load` as source material (and any attached files/links).
2. If the source is a URL, fetch it (or ask only if fetch fails).
3. Skim existing tags/topics in the target file(s) so new tags stay consistent with the corpus.
4. **Dedupe** — search existing content before writing (see below). Skip or merge duplicates; never silently re-add.
5. Pick next available id(s) only for items that will actually be added.
6. Write content with a **`source`** field on every new entry (see below). Do **not** commit unless asked.

Ask the user only when the source is empty, contradictory (e.g. “add as MCQ and Coding only” with no material), or unsafe to guess (wrong language / not JS-quiz related). Prefer a one-line plan (“→ Learnings + Coding, tags X; skipped 1 duplicate”) then proceed, rather than a questionnaire.

---

## Deduplicate before loading

Before writing, scan the **target section file(s)** and obvious twins (e.g. Coding when adding Learnings on the same topic).

| Match signal | Treat as duplicate when… |
| ------------ | ------------------------ |
| Title | Same or near-identical title (ignore case, punctuation, `()` / “polyfill” noise) |
| Code body | Same or trivially reformatted snippet (`body` / `code` / `template` core) |
| Function / API | Same `functionName` or same polyfill target (e.g. `myMap` / `Array.map`) |
| MCQ stem | Same question text + same essential code in `body` |
| Output | Same `code` (or same normalized console snippet) |

**Actions:**

- **Exact / near duplicate** → skip that item; report `skipped duplicate → existing id N (file)`.
- **Same topic, clearly different angle** → allow; use a distinct title.
- **Batch** → dedupe within the incoming batch too, then against the corpus.
- **Do not** add a second “Array.map() polyfill” Learning or Coding if one already exists unless the user explicitly asks to replace/update.

When updating an existing entry on request, keep the same `id` and refresh `source`.

---

## Store the source (provenance)

JSON has no comments — use a **`source`** string field (same idea as file-level `source` on `data/output-questions.json`).

**On every new entry**, set `source` to a short, stable citation:

| Incoming material | `source` value |
| ----------------- | -------------- |
| URL / GitHub / article | That URL (canonical, no tracking junk) |
| Named interview / company dump | e.g. `Tekion interview notes` or `Tekion R1 — 2026-07-28` |
| User paste with no URL | `user paste: <short topic>` (≤80 chars) |
| Topic-only `/load debounce` | `user request: debounce polyfill` |
| Regenerated from a README/script | Script or upstream URL used for the batch |

Rules:

- Put `source` on **each item** you add (Learnings, Coding, MCQ, Output, React, HLD).
- For a **new supplemental JSON file**, also set a file-level `"source"` next to the array key when the whole file shares one origin.
- Linked Learnings + Coding pair → **same** `source` string on both.
- Do **not** put the full pasted article into `source` (keep it short). Full text belongs in `answer` / `description` / etc.
- UI may ignore `source`; it is for agents and future re-loads. Do not render it unless a view already does (Output file-level link is fine as-is).

---

## Decide section(s)

Classify by **shape of the source**, not by user wording alone.

| Source looks like… | Put in | Also consider |
| ------------------ | ------ | ------------- |
| Concept explanation, article, interview write-up, “how X works”, notes with prose | **Learnings** | Pair **Coding** if it’s implementable (polyfill, util, algorithm) |
| “Implement / write a function / polyfill / code this”, stubs, LeetCode-style prompt | **Coding** | Pair **Learnings** with reference solution + explanation |
| Multiple choice with options A–D (or clear distractors) | **MCQ** | — |
| “What is the output?” + a runnable snippet, no options | **Output** | Prefer build script / existing Output pipeline when sourcing a batch README |
| React-specific concept (hooks, reconciliation, components) | **React Learnings** (`data/react-learnings.json`) | — |
| System design / HLD | **HLD** (`data/hld-learnings.json`) | — |
| Company interview notes (named company, round, “asked at …”) | Learnings file that fits topic; set **`company`** | Coding if they asked to implement |

**Linked pair rule:** If the source is both teachable and practiceable (polyfills, debounce, Promise helpers, flatten, deep clone, etc.), add **both** Learnings + Coding with matching `id`, title, and `tags` ↔ `topics`. Prefer this over Learnings-only unless the user said “notes only” / “no coding”.

**File placement:**

| Section | File |
| ------- | ---- |
| MCQ | `questions.json` |
| JS Learnings | `data/learnings.json` or supplemental merge (large batch) |
| React Learnings | `data/react-learnings.json` |
| HLD | `data/hld-learnings.json` |
| Coding | `data/coding-questions.json` |
| Output | `data/output-questions.json` (or regenerate via `pnpm run build:output-questions`) |

Large batches → supplemental JSON + merge in `App.jsx` (see skill / polyfill pattern).

---

## Decide title

- Prefer a short, scannable title the sidebar would show: concept or API name, not a sentence.
- Good: `Array.map() polyfill`, `Event loop microtasks`, `React Collapsible List`
- Bad: `Notes from yesterday`, `Question 3`, raw URL slug
- If the source has a clear heading, normalize it; if not, invent one from the main concept.
- For Coding, title should match the Learnings twin when paired.

---

## Decide tags / topics / company / difficulty

Reuse existing vocabulary from the target file when possible (e.g. `polyfill`, `Array`, `Promise`, `event loop`, `React`, `closures`).

| Field | Rules |
| ----- | ----- |
| Learnings `tags` | 1 primary category if any (`polyfill`, `HLD`, `React`, …) **first**, then 1–3 concept tags. No company slugs in `tags`. |
| Coding `topics` | Same strings as the paired Learnings `tags`. |
| MCQ `topics` | Concept tags only; set `difficulty` separately (`easy` \| `medium` \| `hard` \| `advance`). |
| `company` | Set when source is interview/company-sourced (e.g. `"Tekion"`). Never stuff company into `tags`. |
| Coding `difficulty` | Infer from complexity: simple method polyfill → `easy`; async/edge cases → `medium`/`hard`. |

Do **not** invent one-off synonyms when a close existing tag exists (`Promise` not `Promises` if the file already uses `Promise`).

---

## Decide what to generate

| Missing in source | Generate |
| ----------------- | -------- |
| Title | Yes — from main concept |
| Tags / topics / difficulty / company | Yes — from classifier above |
| `source` | Yes — short citation (URL, company notes label, or `user paste:` / `user request:`) on every new entry |
| Learnings `answer` | Yes if source is thin notes/outline; expand into clear markdown (examples + code fences). If source is already a full article, clean/structure it — don’t discard useful detail |
| Coding `description`, `template`, `testCases`, `runner`, `functionName` | Yes — invent a solvable stub + real tests; pick runner per skill (`expression`, `asyncExpression`, `timer`, …) |
| Coding `explanation` | Yes — reference solution in markdown (can mirror Learnings answer when paired) |
| MCQ `options`, `answer`, `explanation` | Yes if only stem/code given; ensure one correct key and plausible distractors |
| Output `expectedLines` / `async` | Yes — mentally (or via runner) determine printed lines; set `async` when timers/promises matter |

Never leave placeholder text like `"TODO"` or `"Write explanation here"` in committed JSON.

---

## Workflow (execute in order)

1. **Classify** — section(s), file(s), linked pair yes/no.
2. **Dedupe** — scan corpus (+ within batch); skip or update duplicates; tell the user what was skipped.
3. **Metadata** — title, tags/topics, company, difficulty, `source`, next id(s) for new items only.
4. **Fill gaps** — generate answer / tests / options / explanation as needed.
5. **Write** — exact skill schemas including `source`; extend `codingRunner.js` only for new test patterns.
6. **Verify** — `pnpm dev`; spot-check render (and Coding tests / Output run when touched).
7. **Do not commit** unless asked.

---

## Vague or minimal sources

| User gives… | Do this |
| ----------- | ------- |
| Topic only (“debounce polyfill”) | Learnings + Coding pair; generate full answer, template, tests |
| Raw interview dump | Learnings (+ Coding if implementable); set `company` if named |
| Code snippet + “output?” | Output (or MCQ if they want options — default Output) |
| “Add these 10 MCQs” + list | MCQ; generate missing explanations/topics/difficulty |
| Empty `/load` | Ask for source material |

---

## Linked batches (reminder)

Match `id`, title, and tag values across Learnings + Coding (`tags` ↔ `topics`). Primary category tag first. Reference: `data/polyfill-learnings.json` + `data/coding-questions.json`.
