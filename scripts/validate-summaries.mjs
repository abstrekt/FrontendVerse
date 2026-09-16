import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Every learning entry in these files opens with a plain-words summary card:
 * what the thing is, the API you actually type, and one concrete example.
 *
 * Deliberately not listed: `blind75-learnings` already opens with its own
 * "Easy Explainer" section, `work-experience-deep-dive` is narrative, and
 * `wtfjs` / `devto-interview` are quirk- and question-shaped, so a definition
 * has nothing to define.
 */
/**
 * Files whose rollout is still in progress. A missing summary here is reported
 * as remaining work rather than a failure, so the suite stays green while the
 * batch is written. A summary that *exists* is validated exactly as strictly as
 * anywhere else — this defers the writing, not the standard.
 *
 * Delete an entry from this set the moment its file is complete; the check
 * below fails if a file listed here turns out to have nothing missing, so a
 * finished file cannot be quietly left behind.
 */
const IN_PROGRESS = new Set([]);

const FILES = [
  'data/browser-platform-learnings.json',
  'data/web-fundamentals.json',
  'data/react-guide.json',
  'data/react-learnings.json',
  'data/advanced-react.json',
  'data/learnings.json',
  'data/css-learnings.json',
  'data/algorithm-learnings.json',
  'data/test-prep.json',
  'data/senior-frontend-learnings.json',
  'data/ai-assisted-development.json',
  'data/system-design-foundations.json',
  'data/system-design-hld.json',
  'data/system-design-cases.json',
  'data/system-design-lld.json',
  'data/system-design-deep-dives.json',
  'data/system-design-playbooks.json',
];

const MAX_DEFINITION = 320;
const MAX_USE_CASE = 260;
const MAX_SIGNATURE = 80;
const API_MIN = 3;
const API_MAX = 6;

/* Words too common to prove a definition is about anything in particular. */
const STOPWORDS = new Set(
  ('a an and the of to in on for with without vs versus how what why when where which that this it '
    + 'is are be do does you your they them their from into at by as or not no more than then '
    + 'actually really just only its whats').split(' '),
);

function contentWords(text) {
  // Splits on dots too, so a title's `event.preventDefault()` matches a
  // definition that says `preventDefault()` on its own.
  return (text.toLowerCase().match(/[a-z][a-z0-9]*/g) ?? []).filter(
    (w) => w.length > 2 && !STOPWORDS.has(w),
  );
}

/* A definition has to define *this* entry's subject. A hook ("Everything else
   here is a detail of one process") talks around the topic and shares almost
   nothing with the title; a real definition names the thing. Stemming is one
   trailing `s` deep, which is enough for "worker"/"workers" and "cookie"/
   "cookies" without pulling in a dictionary. */
const stem = (w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w);

function sharesSubjectWithTitle(title, definition) {
  const titleWords = new Set(contentWords(title).map(stem));
  if (titleWords.size === 0) return true;
  return contentWords(definition).map(stem).some((w) => titleWords.has(w));
}

// Block structure — the card is a card, not a second body.
const FORBIDDEN = [
  [/\n/, 'a newline'],
  [/^#|\s#{1,6}\s/, 'a heading'],
  [/!\[/, 'an image'],
  [/\]\(/, 'a link'],
];

function checkProse(label, text, max, errors) {
  if (typeof text !== 'string' || !text.trim()) {
    errors.push(`${label} is missing or empty`);
    return;
  }
  if (text.length > max) errors.push(`${label} is ${text.length} chars (max ${max})`);
  for (const [pattern, what] of FORBIDDEN) {
    if (pattern.test(text)) errors.push(`${label} contains ${what}`);
  }
}

function checkEntry(item) {
  const errors = [];
  const summary = item.summary;

  if (!summary || typeof summary !== 'object') {
    return ['no summary'];
  }

  checkProse('definition', summary.definition, MAX_DEFINITION, errors);
  checkProse('useCase', summary.useCase, MAX_USE_CASE, errors);

  if (
    typeof summary.definition === 'string'
    && !sharesSubjectWithTitle(item.title ?? '', summary.definition)
  ) {
    errors.push('definition never names the entry\'s subject — it reads as a hook, not a definition');
  }

  /* An entry that shows real code has an API surface, so the card has to name
     it. This is the check that stops a hands-on entry shipping prose only.
     A *languaged* fence, because a bare ``` block is a transcript, a tree
     diagram or terminal output — the mock-interview entries are full of them
     and have no API to list. */
  const hasCode = /```[a-z]/i.test(item.answer ?? '');
  if (summary.api === undefined) {
    if (hasCode) errors.push('entry has code blocks but the summary has no `api` rows');
    return errors;
  }

  if (!Array.isArray(summary.api)) {
    errors.push('api is not an array');
    return errors;
  }
  if (summary.api.length < API_MIN || summary.api.length > API_MAX) {
    errors.push(`api has ${summary.api.length} rows (want ${API_MIN}–${API_MAX})`);
  }

  const seen = new Set();
  summary.api.forEach((row, i) => {
    const at = `api[${i}]`;
    if (!row || typeof row !== 'object') {
      errors.push(`${at} is not an object`);
      return;
    }
    const { signature, note } = row;
    if (typeof signature !== 'string' || !signature.trim()) {
      errors.push(`${at}.signature is missing or empty`);
    } else {
      if (signature.length > MAX_SIGNATURE) {
        errors.push(`${at}.signature is ${signature.length} chars (max ${MAX_SIGNATURE})`);
      }
      if (seen.has(signature)) errors.push(`${at}.signature "${signature}" is a duplicate`);
      seen.add(signature);
    }
    checkProse(`${at}.note`, note, MAX_USE_CASE, errors);
  });

  return errors;
}

const argv = process.argv.slice(2);
const listMissing = argv.includes('--list-missing');

let total = 0;
let withSummary = 0;
const failures = [];
const pending = [];
const pendingByFile = new Map();

for (const file of FILES) {
  const data = JSON.parse(readFileSync(join(ROOT, file), 'utf-8'));
  for (const item of data.learnings ?? []) {
    total += 1;
    const errors = checkEntry(item);
    if (item.summary) withSummary += 1;
    if (errors.length === 0) continue;

    const entry = { file, id: item.id, title: item.title ?? '(no title)', errors };
    // Only an *absent* summary is deferrable. A malformed one is a failure
    // wherever it lives.
    if (errors[0] === 'no summary' && IN_PROGRESS.has(file)) {
      pending.push(entry);
      pendingByFile.set(file, (pendingByFile.get(file) ?? 0) + 1);
    } else {
      failures.push(entry);
    }
  }
}

for (const file of IN_PROGRESS) {
  if (!pendingByFile.has(file)) {
    failures.push({
      file,
      id: '—',
      title: '(whole file)',
      errors: [`every entry now has a summary — remove this file from IN_PROGRESS`],
    });
  }
}

if (listMissing) {
  // Rollout checklist: what is still unwritten, grouped by file.
  const missing = [...failures, ...pending].filter((f) => f.errors[0] === 'no summary');
  let current = null;
  for (const f of missing) {
    if (f.file !== current) {
      console.log(`\n${f.file}`);
      current = f.file;
    }
    console.log(`  [ ] ${f.id} — ${f.title}`);
  }
  console.log(`\n${missing.length} of ${total} entries still need a summary.`);
  process.exit(0);
}

console.log(
  `Summary validation — ${withSummary}/${total} entries across ${FILES.length} files`,
);

if (pending.length > 0) {
  console.log('');
  console.log(`IN PROGRESS — ${pending.length} entries still to write:`);
  for (const [file, count] of pendingByFile) console.log(`  ${file} — ${count}`);
  console.log('  (run with --list-missing for the per-entry checklist)');
}

if (failures.length > 0) {
  console.log('');
  console.log(`ERRORS (${failures.length} entries):`);
  for (const f of failures) {
    console.log(`  ${f.file} — ${f.id} ${f.title}`);
    for (const e of f.errors) console.log(`      ${e}`);
  }
  console.log('');
  console.log('Validation failed — fix errors above (run with --list-missing for a checklist).');
  process.exit(1);
}

console.log(
  pending.length > 0
    ? '  Every summary written so far is well-formed.'
    : '  Every entry has a well-formed plain-words summary.',
);
