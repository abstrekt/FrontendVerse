---
name: load-quiz-content
description: Ingest a source, compare duplicates and merge/update when better, auto-route into quiz sections, and store provenance on each entry
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
4. **Dedupe** — search existing content before writing (see below). On a match, **compare** explanations/solutions/tests; skip, update, or merge — never silently re-add, never discard without comparing.
5. Pick next globally unique id(s) for JS Learnings via `jq '.learnings | map(.id) | max' data/learnings.json` (or check other files). For other sections, use next id in the target file. Only for items that will actually be **added** (not updated/merged).
6. Write content with a **`source`** field on every new or updated entry (see below). Do **not** commit unless asked.

Ask the user only when the source is empty, contradictory (e.g. “add as MCQ and Coding only” with no material), or unsafe to guess (wrong language / not JS-quiz related). Prefer a one-line plan (“→ Coding, tags X; updated 1 duplicate, skipped 1”) then proceed, rather than a questionnaire.

---

## Deduplicate before loading

Before writing, scan the **target section file(s)**. When the user requests a Learnings + Coding pair, also scan the twin section for duplicates.

| Match signal | Treat as duplicate when… |
| ------------ | ------------------------ |
| Title | Same or near-identical title (ignore case, punctuation, `()` / “polyfill” noise) |
| Code body | Same or trivially reformatted snippet (`body` / `code` / `template` core) |
| Function / API | Same `functionName` or same polyfill target (e.g. `myMap` / `Array.map`) |
| MCQ stem | Same question text + same essential code in `body` |
| Output | Same `code` (or same normalized console snippet) |

**Do not discard on title/API match alone.** Open the existing entry and compare quality:

| Compare these fields | What “better” looks like |
| -------------------- | ------------------------ |
| Learnings `answer` | Clearer structure, more accurate, better examples/code fences, fewer gaps |
| Coding `explanation` + solution | Correctness, edge cases, readability |
| Coding `testCases` / `description` / `template` | More/better tests, clearer prompt, solid stub |
| MCQ `explanation` / `options` | Better distractors, correct key, clearer why |
| Output expected behavior | Correct `expectedLines`, proper `async` |

**Actions (pick one per match):**

| Verdict | Action | Report |
| ------- | ------ | ------ |
| Incoming ≤ existing (same or worse) | **Skip** — leave existing entry alone | `skipped duplicate → id N (file)` |
| Incoming clearly better | **Update** — keep `id`; replace/improve weak fields; refresh `source` | `updated id N (file) — <why>` |
| Both have unique value | **Merge** — keep `id`; fold unique bits into existing fields (don’t drop good existing prose for weaker new text) | `merged into id N (file) — <what was kept/added>` |
| Same topic, different angle | **Add** — new id, distinct title | as a normal add |

Rules:

- **Batch** → dedupe within the incoming batch too, then against the corpus (same compare → skip/update/merge).
- **Never** add a second “Array.map() polyfill” (or equivalent) when one already exists — update or merge that `id` instead.
- On update/merge, keep the same `id`; refresh `source` to the incoming citation (optionally note prior origin in the report, not in the JSON).
- Prefer merge over blind overwrite when the existing entry has unique examples, tests, or caveats the new source lacks.

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
- When user requests a Learnings + Coding pair → use the **same** `source` string on both.
- Do **not** put the full pasted article into `source` (keep it short). Full text belongs in `answer` / `description` / etc.
- UI may ignore `source`; it is for agents and future re-loads. Do not render it unless a view already does (Output file-level link is fine as-is).

---

## Decide section(s)

**Default: one section only.** Use this split:

- **Pure explanation** (how/why something works, concepts, articles, interview notes) → **Learnings**
- **Pure implementation** (write a function, polyfill, stub, coding problem, BFE/LeetCode prompt) → **Coding**

Classify by **shape of the source**, not by user wording alone. Do **not** auto-add Learnings + Coding together unless the user explicitly asks (e.g. “add both”, “pair them”, “like the polyfill batch”).

| Source looks like… | Put in |
| ------------------ | ------ |
| Pure explanation — prose, article, “how X works”, conceptual notes | **Learnings** |
| Pure implementation — function prompt, polyfill, stub, BFE/LeetCode, coding-problem URL | **Coding** (put reference solution in `explanation`) |
| Multiple choice with options A–D (or clear distractors) | **MCQ** |
| “What is the output?” + a runnable snippet, no options | **Output** (prefer build script / existing Output pipeline for batch READMEs) |
| React-specific concept (hooks, reconciliation, components) | **React Learnings** (`data/react-learnings.json`) |
| System design / HLD | **HLD** (`data/hld-learnings.json`) |
| Company interview notes (named company, round, “asked at …”) | Learnings file that fits topic; set **`company`** |

**Opt-in pair rule:** Add **both** Learnings + Coding only when the user explicitly requests it (e.g. “add learnings and coding”, “pair them”, “like polyfills”). Then use matching `id`, title, and `tags` ↔ `topics`. Respect opt-out phrases: `notes only`, `no coding`, `coding only`, `no learnings`.

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
- When user requests a paired batch, title should match across Learnings + Coding.

---

## Decide tags / topics / company / difficulty

Reuse existing vocabulary from the target file when possible (e.g. `polyfill`, `Array`, `Promise`, `event loop`, `React`, `closures`).

| Field | Rules |
| ----- | ----- |
| Learnings `tags` | 1 primary category if any (`polyfill`, `HLD`, `React`, …) **first**, then 1–3 concept tags. No company slugs in `tags`. |
| Coding `topics` | Same concept tags as Learnings would use; when paired, match Learnings `tags` exactly. |
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
| Coding `explanation` | Yes — reference solution in markdown (required for Coding-only loads; can mirror Learnings `answer` when paired) |
| MCQ `options`, `answer`, `explanation` | Yes if only stem/code given; ensure one correct key and plausible distractors |
| Output `expectedLines` / `async` | Yes — mentally (or via runner) determine printed lines; set `async` when timers/promises matter |

Never leave placeholder text like `"TODO"` or `"Write explanation here"` in committed JSON.

---

## Workflow (execute in order)

1. **Classify** — single section by default; paired only if user asked.
2. **Dedupe** — scan corpus (+ within batch); on matches **compare content** then skip / update / merge; report each outcome.
3. **Metadata** — title, tags/topics, company, difficulty, `source`, next id(s) for new items only.
4. **Fill gaps** — generate answer / tests / options / explanation as needed.
5. **Write** — exact skill schemas including `source`; extend `codingRunner.js` only for new test patterns.
6. **Verify** — `pnpm dev`; spot-check render (and Coding tests / Output run when touched).
7. **Do not commit** unless asked.

---

## Vague or minimal sources

| User gives… | Do this |
| ----------- | ------- |
| Topic only (“debounce polyfill”) | **Coding** — pure implementation |
| Topic only (“event loop”, “closures”) | **Learnings** — pure explanation |
| BFE / coding-problem URL | **Coding only** |
| Article URL | **Learnings only** |
| Raw interview dump | **Learnings**; set `company` if named |
| Code snippet + “output?” | Output (or MCQ if they want options — default Output) |
| “Add these 10 MCQs” + list | MCQ; generate missing explanations/topics/difficulty |
| Empty `/load` | Ask for source material |

---

## Paired batches (opt-in only)

When the user explicitly asks for Learnings + Coding together, match `id`, title, and tag values across both (`tags` ↔ `topics`). Primary category tag first. Reference: `data/polyfill-learnings.json` + `data/coding-questions.json`.
