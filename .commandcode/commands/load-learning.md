---
name: load-learning
description: Ingest learning material, deduplicate against existing content, and add or update learnings with proper provenance tracking
---

# Load Learning Content

Text after `/load-learning` is a **source** (paste, URL, notes, or topic). Decide the learning file, title, tags, and structure automatically — **don't wait for the user to specify metadata**.

## Quick Start

1. **Classify** the source material (explanations, concepts, guides → Learnings)
2. **Deduplicate** — search existing learnings in the target file by title, concept, or API
3. **Decide metadata** — title, tags, source citation
4. **Fill content** — expand into clear markdown with code examples
5. **Write** to the target file with proper `id`, `source`, and structure
6. **Do not commit** unless asked

## Intake Steps

1. Treat everything after `/load-learning` as source material (+ any attached files/links).
2. If source is a URL, fetch it (or ask only if fetch fails).
3. Skim existing tags/topics in the target file to stay consistent with the corpus.
4. **Deduplicate** — scan existing content before writing (see below).
5. Pick the next globally unique `id` only for **new entries** (not updates/merges).
6. Write content with a **`source`** field on every entry.

Ask the user only when the source is empty, contradictory, or unsafe to guess. Prefer a one-line plan ("→ CSS learnings, id 6, tags: flexbox, layout") then proceed.

---

## Deduplicate Before Loading

Before writing, scan the target learning file. On a match, **compare content** then skip, update, or merge.

| Match signal | Duplicate when… |
| ------------ | --------------- |
| Title | Same or near-identical title (ignore case, punctuation) |
| Concept | Same API, function, or CSS property being explained |
| Core explanation | Same core logic or teaching point (even if worded differently) |

**Compare these fields:**

| Field | What "better" looks like |
| ----- | ----------------------- |
| `answer` | Clearer structure, more accurate, better examples/code fences, practical guidance, fewer gaps |
| Explanation depth | Covers use cases, gotchas, related concepts |
| Code examples | Complete, runnable, illustrate the main point |

**Actions (pick one per match):**

| Verdict | Action | Report |
| ------- | ------ | ------ |
| Incoming ≤ existing (same or worse) | **Skip** — leave existing entry alone | `skipped duplicate → id N` |
| Incoming clearly better | **Update** — keep `id`; improve weak fields; refresh `source` | `updated id N — <why>` |
| Both have unique value | **Merge** — fold unique examples/details into existing entry | `merged into id N — <what was added>` |
| Same topic, different angle | **Add** — new `id`, distinct title | as a normal add |

---

## Store the Source (Provenance)

**On every new entry**, set `source` to a short, stable citation:

| Incoming material | `source` value |
| ----------------- | -------------- |
| URL / GitHub / article | That URL (canonical, no tracking params) |
| Named resource | e.g. `MDN: Flexbox Guide` or `CSS Tricks: Grid` |
| User paste with no URL | `user paste: <short topic>` (≤80 chars) |
| Topic request | `user request: CSS flex-basis explanation` |

Rules:
- Put `source` on **each entry** you add or update.
- Keep it short (≤120 chars). Full article text belongs in `answer`.
- UI may not render it; it's for future audits and re-loading.

---

## Decide Target File

Route to the appropriate learning data file:

| Learning type | Target file |
| ------------- | ----------- |
| CSS concepts | `data/css-learnings.json` |
| JavaScript concepts | `data/learnings.json` |
| React-specific | `data/react-learnings.json` |
| Algorithm patterns | `data/algorithm-learnings.json` |
| Advanced React | `data/advanced-react.json` |
| System Design / HLD | `data/hld-learnings.json` |
| Interview prep | Topic-specific file (e.g. `react-learnings.json`, `algorithm-learnings.json`) + set `company` if from named interview |

---

## Decide Title & Tags

**Title:**
- Short, scannable, concept-focused (not a sentence).
- Good: `flex-basis and Main Axis Sizing`, `CSS Units: px, %, rem, em, vw`
- Bad: `CSS stuff`, `notes from today`, raw URL

**Tags:**
- Reuse existing vocabulary from the target file.
- 1 primary category first (if applicable), then 1–3 concept tags.
- Good: `["CSS", "flexbox", "layout"]`, `["CSS", "units", "sizing"]`
- Examples from existing corpus: `flexbox`, `layout`, `centering`, `CSS`, `specificity`, `units`, `typography`

---

## Structure of Learning Entries

```json
{
  "id": 5,
  "title": "CSS Units: px, %, rem, em, vw",
  "tags": ["CSS", "units", "sizing", "typography"],
  "answer": "## Overview: Absolute vs. Relative Units\n\n...",
  "source": "user paste: CSS fundamentals collection"
}
```

**Required fields:**
- `id` — unique number within the file
- `title` — short, scannable concept name
- `tags` — array of strings (reuse existing tags)
- `answer` — markdown explanation (see below)
- `source` — citation string

**Answer content:**
- Start with a brief intro or overview.
- Use `##` headers to organize sections.
- Include code fences (`` ``` `` for CSS, JS, HTML).
- Provide practical examples, use cases, gotchas.
- Add related links at the end (if applicable).
- Expand thin notes into clear, structured markdown.

---

## Workflow (Execute in Order)

1. **Classify** → identify target learning file.
2. **Dedupe** → scan file by title/concept; on matches, compare and decide (skip/update/merge).
3. **Metadata** → decide title, tags, and next `id` for new entries only.
4. **Fill content** → expand source into clear markdown `answer` with examples.
5. **Write** → add to target file with proper structure and `source`.
6. **Verify** — quickly spot-check the entry in the app.
7. **Do not commit** unless asked.

---

## Examples

### Example 1: URL Article
```
User: /load-learning https://example.com/article-on-closures
```
→ Read the article → Learnings file (JavaScript concepts) → Dedupe by title/concept → Expand into clear markdown with code examples → Add entry with `source: "https://example.com/article-on-closures"`

### Example 2: User Paste (CSS)
```
User: /load-learning
[pastes CSS flex-basis explanation from somewhere]
```
→ Recognize CSS topic → Dedupe against `css-learnings.json` → Decide title "Flex-basis and Main Axis Sizing" → Structure markdown → Add with `source: "user paste: CSS fundamentals"`

### Example 3: Topic Request
```
User: /load-learning event loop and microtasks explanation
```
→ Learnings file (JS concepts) → No duplicate found → Create new entry → Generate clear explanation covering event loop, task queues, microtasks → Add with `source: "user request: event loop and microtasks"`

---

## Vague or Minimal Sources

| User gives… | Do this |
| ----------- | ------- |
| Topic only ("closures", "event loop") | Create comprehensive explanation based on common interview/learning patterns |
| Article URL | Fetch → extract main points → structure into learning format |
| Code snippet without explanation | Ask for context, or infer from code |
| Empty `/load-learning` | Ask for source material or topic |

---

## Quick Reference: ID Numbering

For **CSS learnings**, check the highest `id` in `data/css-learnings.json` and add 1:
```bash
jq '.learnings | map(.id) | max' data/css-learnings.json
```

For **other files**, same process with the appropriate file.

Only generate `id` for **new entries** — updates/merges keep the existing `id`.

