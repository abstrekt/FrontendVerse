/**
 * Writes the traces in lib/blind75-traces.mjs into the learning bodies.
 *
 *   node scripts/apply-blind75-traces.mjs          # apply
 *   node scripts/apply-blind75-traces.mjs --check  # verify, exit 1 on drift
 *
 * Idempotent: an existing generated trace section is replaced rather than
 * appended to, so re-running after editing a trace is the normal workflow.
 * The section is inserted after "The Trick" and before the full solution —
 * the point is to watch the thing run before reading the code.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { TRACES } from './lib/blind75-traces.mjs';
import { validateTrace } from './lib/trace-validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data', 'blind75-learnings.json');

const HEADING = '## 📊 Visual Trace';

function block(trace) {
  // No generated-by marker: react-markdown escapes raw HTML, so an HTML
  // comment renders as visible text. The heading is enough to find the
  // section again.
  return [
    HEADING,
    '',
    '```trace',
    JSON.stringify(trace, null, 2),
    '```',
    '',
    '---',
    '',
  ].join('\n');
}

/** Drops a previous "Visual Trace" section, generated or hand-written. */
function stripExisting(answer) {
  const start = answer.indexOf(HEADING);
  if (start === -1) return answer;

  // Run to the next level-2 heading; the trailing `---` rule belongs to the
  // section being removed.
  const after = answer.indexOf('\n## ', start + HEADING.length);
  const end = after === -1 ? answer.length : after + 1;
  return answer.slice(0, start) + answer.slice(end);
}

function insert(answer, trace) {
  const cleaned = stripExisting(answer);
  const anchor = cleaned.indexOf('## 💻');

  if (anchor === -1) {
    // No solution section to sit above — append rather than lose the trace.
    return `${cleaned.trimEnd()}\n\n${block(trace)}`;
  }
  return cleaned.slice(0, anchor) + block(trace) + cleaned.slice(anchor);
}

function main() {
  const check = process.argv.includes('--check');
  const raw = readFileSync(DATA, 'utf8');
  const data = JSON.parse(raw);
  const items = data.learnings;

  let changed = 0;
  const missing = [];

  for (const [id, trace] of Object.entries(TRACES)) {
    const item = items.find((it) => it.id === Number(id));
    if (!item) {
      missing.push(id);
      continue;
    }

    // A trace whose steps disagree with its own lanes is a bug worth
    // catching here rather than in the browser.
    validateTrace(trace, `#${id}`);

    const next = insert(item.answer, trace);
    if (next !== item.answer) {
      item.answer = next;
      changed += 1;
    }
  }

  if (missing.length) {
    console.error(`✗ no learning found for id(s): ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const out = `${JSON.stringify(data, null, 2)}\n`;

  if (check) {
    if (out !== raw) {
      console.error(`✗ ${changed} trace(s) out of date — run: node scripts/apply-blind75-traces.mjs`);
      process.exitCode = 1;
    } else {
      console.log(`✓ ${Object.keys(TRACES).length} traces in sync`);
    }
    return;
  }

  writeFileSync(DATA, out);
  console.log(
    `✓ applied ${Object.keys(TRACES).length} traces (${changed} file section${changed === 1 ? '' : 's'} rewritten)`
  );
}

main();
