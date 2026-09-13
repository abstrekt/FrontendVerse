/**
 * Writes the React blueprints and traces into the learning bodies.
 *
 *   node scripts/apply-react-traces.mjs                      # apply
 *   node scripts/apply-react-traces.mjs --check              # verify, exit 1 on drift
 *   node scripts/apply-react-traces.mjs --section=react-guide  # one section, while authoring
 *
 * Every React item across the four data files gets one generated section: a
 * themed draw.io blueprint for the mechanism, then a steppable trace of that
 * mechanism running on one concrete case. The pair is deliberate — the
 * blueprint answers "how does this work", the trace answers "what happens,
 * in what order", and neither reads well without the other.
 *
 * Idempotent, like `apply-blind75-traces.mjs`: an existing generated section
 * is replaced rather than appended to, so editing a trace and re-running is
 * the normal workflow. The heading differs from the Blind 75 applier's so
 * the two can never fight over the same block.
 *
 * `--check` is wired into `npm test` and fails on two things: a section that
 * has drifted from the source table, and an item with no entry at all. The
 * coverage gate is the point — it is what makes "every item has a diagram"
 * a fact about the repo rather than a claim in a commit message.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { TRACES, DIAGRAM_ONLY } from './lib/react-traces.mjs';
import { validateTrace } from './lib/trace-validate.mjs';
import { DIAGRAMS } from './lib/react-diagrams.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const HEADING = '## 📊 How It Works';

/** Where each section's items live, and which field carries the prose. */
const FILES = {
  'react-guide': { path: 'data/react-guide.json', key: 'learnings', field: 'answer' },
  'advanced-react': { path: 'data/advanced-react.json', key: 'learnings', field: 'answer' },
  'react-learnings': { path: 'data/react-learnings.json', key: 'learnings', field: 'answer' },
  'react-mcq-questions': {
    path: 'data/react-mcq-questions.json',
    key: 'questions',
    field: 'explanation',
  },
};

function block(entry) {
  const lines = [HEADING, ''];

  if (entry.diagram) {
    lines.push(`![${entry.alt ?? entry.diagram}](/diagrams/react/${entry.diagram}.svg)`, '');
  }

  if (entry.trace) {
    lines.push('```trace', JSON.stringify(entry.trace, null, 2), '```', '');
  }

  lines.push('---', '');
  return lines.join('\n');
}

/** Drops a previous generated section, so re-running replaces rather than stacks. */
function stripExisting(body) {
  const start = body.indexOf(HEADING);
  if (start === -1) return body;

  // Run to the next level-2 heading; the trailing `---` rule belongs to the
  // section being removed.
  const after = body.indexOf('\n## ', start + HEADING.length);
  const end = after === -1 ? body.length : after + 1;
  return body.slice(0, start) + body.slice(end);
}

/**
 * Index of the heading the section should be inserted above.
 *
 * These bodies have no house section order — one opens with "The mystery",
 * another with "Class lifecycle (legacy but still asked)" — so there is no
 * single anchor to look for the way the Blind 75 applier looks for `## 💻`.
 * The default puts the picture after the item's opening section, which is
 * where it helps most: the reader has the problem and not yet the detail.
 * An entry names an exact heading with `after` when it wants somewhere else.
 */
function insertionPoint(body, entry) {
  if (entry.after) {
    const at = body.indexOf(entry.after);
    if (at === -1) return -1;
    const next = body.indexOf('\n## ', at + entry.after.length);
    return next === -1 ? body.length : next + 1;
  }

  // Start of the first level-2 heading, wherever it is.
  let firstAt;
  if (body.startsWith('## ')) {
    firstAt = 0;
  } else {
    const at = body.indexOf('\n## ');
    if (at === -1) return body.length; // no headings at all — an MCQ explanation
    firstAt = at + 1;
  }

  // The second heading is the end of the opening section. When there is
  // only one — often a closing "## Key takeaways" — go above it instead, so
  // the figure still lands after the prose rather than below the summary.
  const second = body.indexOf('\n## ', firstAt + 3);
  if (second !== -1) return second + 1;
  return firstAt === 0 ? body.length : firstAt;
}

function insert(body, entry) {
  const cleaned = stripExisting(body);
  const at = insertionPoint(cleaned, entry);

  if (at >= cleaned.length) {
    return `${cleaned.trimEnd()}\n\n${block(entry)}`.trimEnd() + '\n';
  }
  return cleaned.slice(0, at) + block(entry) + cleaned.slice(at);
}

function main() {
  const check = process.argv.includes('--check');

  // Authoring a section at a time needs a way to write what is finished
  // without the coverage gate refusing the whole run. `--check` ignores
  // this on purpose: the CI guard always looks at everything.
  const only = process.argv.find((a) => a.startsWith('--section='))?.slice('--section='.length);
  if (only && !FILES[only]) {
    console.error(`✗ unknown section "${only}". Known: ${Object.keys(FILES).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  let applied = 0;
  let changed = 0;
  const problems = [];
  const writes = [];

  for (const [section, { path, key, field }] of Object.entries(FILES)) {
    if (only && !check && section !== only) continue;

    const full = join(ROOT, path);
    const raw = readFileSync(full, 'utf8');
    const data = JSON.parse(raw);
    const items = data[key];
    const table = TRACES[section] ?? {};
    const exempt = new Set(DIAGRAM_ONLY[section] ?? []);

    // Coverage: every item in the file needs an entry. This is the check
    // that keeps a newly-added learning from quietly shipping without one.
    for (const item of items) {
      if (!table[item.id]) {
        problems.push(`${section}#${item.id} "${item.title ?? item.question}" has no entry`);
      }
    }

    for (const [id, entry] of Object.entries(table)) {
      const item = items.find((it) => String(it.id) === String(id));
      if (!item) {
        problems.push(`${section}#${id} has an entry but no such item`);
        continue;
      }

      if (entry.diagram && !DIAGRAMS[entry.diagram]) {
        problems.push(`${section}#${id} names unknown diagram "${entry.diagram}"`);
        continue;
      }

      if (entry.trace) {
        validateTrace(entry.trace, `${section}#${id}`);
      } else if (!exempt.has(Number(id))) {
        problems.push(`${section}#${id} has no trace and is not in DIAGRAM_ONLY`);
        continue;
      }

      if (entry.after && !item[field].includes(entry.after)) {
        problems.push(`${section}#${id} anchors after "${entry.after}", which is not in the body`);
        continue;
      }

      const next = insert(item[field], entry);
      if (next !== item[field]) {
        item[field] = next;
        changed += 1;
      }
      applied += 1;
    }

    writes.push({ full, raw, out: `${JSON.stringify(data, null, 2)}\n` });
  }

  if (problems.length) {
    for (const p of problems) console.error(`✗ ${p}`);
    console.error(`\n${problems.length} problem(s). Every React item needs an entry in scripts/lib/react-traces.mjs.`);
    process.exitCode = 1;
    return;
  }

  const stale = writes.filter((w) => w.out !== w.raw);

  if (check) {
    if (stale.length) {
      console.error(
        `✗ ${stale.length} file(s) out of date — run: node scripts/apply-react-traces.mjs`
      );
      process.exitCode = 1;
    } else {
      console.log(`✓ ${applied} React diagrams + traces in sync`);
    }
    return;
  }

  for (const w of stale) writeFileSync(w.full, w.out);
  console.log(
    `✓ applied ${applied} entries (${changed} section${changed === 1 ? '' : 's'} rewritten, ${stale.length} file${stale.length === 1 ? '' : 's'} touched)`
  );
}

main();
