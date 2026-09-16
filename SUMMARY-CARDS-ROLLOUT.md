# Plain-words summary cards — rollout state

Every learning entry opens with a card giving a jargon-free definition, the API
you actually type, and one concrete example — before any hook, diagram or code.
The mechanism is finished and 248 of 292 entries are written. **44 remain**, in
two files.

```bash
node scripts/validate-summaries.mjs                # state + what is left
node scripts/validate-summaries.mjs --list-missing # the per-entry checklist
```

`pnpm test` runs the validator and is green: the two unfinished files are listed
in `IN_PROGRESS` in the script, where a *missing* summary is reported as
remaining work rather than a failure. A summary that exists is validated exactly
as strictly there as anywhere else.

## What is left

| File | Entries | Route |
| --- | --- | --- |
| `data/react-learnings.json` | 28 | `/react-learnings/:id` |
| `data/advanced-react.json` | 16 | `/advanced-react/:id` |

`--list-missing` prints them as a checklist with ids and titles.

## The field

Sits on each entry object between `tags`/`difficulty` and `answer`:

```json
"summary": {
  "definition": "A web worker is a background thread that runs your JavaScript without freezing the page. A service worker is a background script sitting between your page and the network, so it can answer requests from a cache — including when you are offline.",
  "api": [
    { "signature": "new Worker(url, { type: 'module' })", "note": "starts a web worker; one page owns it, and it dies with that page" },
    { "signature": "worker.postMessage(data) / worker.onmessage", "note": "the only way in and out — the data is copied, not shared" },
    { "signature": "caches.open(name) → cache.match / cache.put", "note": "the storage a service worker serves those answers from" }
  ],
  "useCase": "A web worker parses a 50,000-row CSV export while the user keeps scrolling the table. A service worker makes that same app open on a train with no signal."
}
```

`data/browser-platform-learnings.json` id 133 is the reference entry — read it
before writing a batch.

## Authoring rules

These are what the card exists for. The validator enforces the mechanical half;
the rest is judgement.

- **`definition`** — one sentence (two only for a comparison entry), present
  tense, naming the subject in the first three words: *"A web worker is…"*,
  *"Reconciliation is…"*. The second clause says what problem it removes. No
  jargon left undefined in the same sentence, no "as we saw", no forward
  references. Explain what it **is**, not why it is interesting. A comparison
  entry defines **both** subjects. Max 320 chars.
- **`api`** — 3–6 rows of the things you actually type. `signature` is the real
  constructor, method, hook, header or attribute — **verify it against the
  entry's own code blocks**; it is `new Worker(...)`, not `new WebWorker()`. An
  invented API in the card is worse than no card. `note` is the one thing worth
  knowing that the signature does not say: a mandatory argument, a gotcha, a
  lifetime. Order them as you would meet them, not alphabetically. Where the
  entry is about syntax rather than calls, `signature` is that syntax
  (`<link rel="preload" as="font" crossorigin>`, `key`, `Cache-Control: no-cache`).
- **`useCase`** — one sentence, a specific scene, not a category. *"Parsing a
  50,000-row CSV while the user keeps scrolling"*, never *"CPU-heavy work"*. For
  a comparison entry, one scene per subject, so the contrast is the example.
  Max 260 chars.
- Backticks for identifiers are fine in all three. No headings, lists, links,
  images or newlines.
- Where the existing `answer` already opens with a usable definition, lift and
  simplify it — the body keeps its own hook.

British spellings (*optimise*, *memoise*, *prioritise*) match the existing
prose.

## How to write a batch

1. Dump the file's outlines so you write from the entry, not from memory:

   ```bash
   node -e "
   const a=JSON.parse(require('fs').readFileSync('data/react-learnings.json','utf8')).learnings;
   for(const e of a){
     console.log('### '+e.id+' — '+e.title+'  [code:'+/\`\`\`[a-z]/i.test(e.answer)+']');
     console.log('lede: '+e.answer.trim().split('\n\n')[0].replace(/\n/g,' ').slice(0,180));
     console.log('heads: '+(e.answer.match(/^#{2,3} .+/gm)||[]).map(h=>h.replace(/^#+ /,'')).join(' | '));
     const c=[...e.answer.matchAll(/\`([^\`\n]{2,50})\`/g)].map(m=>m[1]);
     const f={}; c.forEach(x=>f[x]=(f[x]||0)+1);
     console.log('code: '+Object.entries(f).sort((x,y)=>y[1]-x[1]).slice(0,14).map(([x])=>x).join(' · '));
     console.log('');
   }"
   ```

   The `code:` flag is whether the entry has a **languaged** fence — if true,
   `api` is required. `[code:false]` entries (prose or transcript only) may omit
   it. The `code:` line is your candidate signature list, already ranked.

2. Write a `{ "<id>": { …summary… } }` patch file, then merge it in. The applier
   places `summary` immediately before `answer` and preserves the file's 2-space
   formatting, so diffs stay clean:

   ```js
   // scripts/apply-summaries-batch.mjs — recreate if absent, it is a scratch tool
   import { readFileSync, writeFileSync } from 'node:fs';
   const [, , dataFile, patchFile] = process.argv;
   const data = JSON.parse(readFileSync(dataFile, 'utf-8'));
   const patch = JSON.parse(readFileSync(patchFile, 'utf-8'));
   data.learnings = data.learnings.map((item) => {
     const summary = patch[String(item.id)];
     if (!summary) return item;
     const out = {};
     for (const [k, v] of Object.entries(item)) {
       if (k === 'answer') out.summary = summary;
       out[k] = v;
     }
     return out;
   });
   writeFileSync(dataFile, JSON.stringify(data, null, 2) + '\n');
   ```

3. `node scripts/validate-summaries.mjs` and fix what it names.

4. When a file is complete, **remove it from `IN_PROGRESS`** in
   `scripts/validate-summaries.mjs`. The validator fails if a listed file turns
   out to have nothing missing, so a finished file cannot be quietly left behind.

## Two validator rules worth knowing before they fire

- **"definition never names the entry's subject"** — the definition must share a
  content word with the title (one trailing `s` of stemming). It fires on a real
  hook opener, and it also fires on a spelling mismatch: a title saying
  *Virtualizing* against a definition saying *virtualising* does not match. Work
  a title word into the sentence; do not weaken the sentence to satisfy it.
- **"entry has code blocks but the summary has no `api` rows"** — triggered by a
  fence with a language. A bare ` ``` ` block is a transcript, a tree diagram or
  terminal output and does not require `api`.

## The files the mechanism lives in

| File | Role |
| --- | --- |
| `src/components/LearningSummary.jsx` | The card. Renders `definition`, the `api` table and `useCase` through `CodeBody`, so backticks pick up the standard inline-code styling. |
| `src/components/LearningsView.jsx` | Renders the card inside `.learning-answer-scroll`, **above** the `articleRef` div. |
| `src/styles/index.css` | `.learning-summary*` rules next to `.learning-answer`, plus the stacked-row variant under 860px. Tokens only. |
| `src/utils/searchIndex.js` | `summaryText()` flattens the card into one searchable field, weighted 60 — above `body`, below `tags` — so a bare method name finds the entry that introduces it. |
| `scripts/validate-summaries.mjs` | The validator. `FILES` is the scope, `IN_PROGRESS` is the deferral list. |

**The card is deliberately outside `articleRef`.** Select-to-highlight anchors
marks by nth-occurrence of a string within that element
(`src/utils/highlights.js`, `src/utils/markRanges.js`). Text inside it but not
passed through the marked `CodeBody` would shift every stored `nth` and silently
move existing highlights. The cost is that the card itself is not highlightable.
Do not move it inside without rewriting the anchoring.

## Out of scope, deliberately

`blind75-learnings` already opens with `## 💡 Easy Explainer`;
`work-experience-deep-dive` is narrative; `wtfjs-learnings` and
`devto-interview-learnings` are quirk- and question-shaped. None are in `FILES`.
The non-learning banks (`coding-questions`, `output-questions`, `questions.json`,
`react-mcq-questions`) have their own shapes and are untouched.
