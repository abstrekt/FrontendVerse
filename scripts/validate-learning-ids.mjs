import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Sections whose content is merged from several files, so ids have to be
 * unique across the whole group rather than per file.
 *
 * Must stay in sync with the merges in `src/data/datasets.js`. A section with
 * a single data file is not listed: its ids are unique by construction.
 */
const GROUPS = {
  learnings: [
    'data/learnings.json',
    'data/tekion-interview-learnings.json',
    'data/wtfjs-learnings.json',
    'data/devto-interview-learnings.json',
    'data/senior-frontend-learnings.json',
  ],
  'system-design': [
    'data/system-design-foundations.json',
    'data/system-design-hld.json',
    'data/system-design-cases.json',
    'data/system-design-lld.json',
    'data/system-design-deep-dives.json',
    'data/system-design-playbooks.json',
  ],
};

const DEFAULT_GROUP = 'learnings';

function loadGroup(files) {
  const entries = [];
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(ROOT, file), 'utf-8'));
    for (const item of data.learnings ?? []) {
      entries.push({ id: item.id, title: item.title ?? '(no title)', file });
    }
  }
  return entries;
}

function validate(entries) {
  const byId = new Map();
  for (const entry of entries) {
    if (!byId.has(entry.id)) byId.set(entry.id, []);
    byId.get(entry.id).push(entry);
  }

  const errors = [];
  for (const [id, group] of byId.entries()) {
    if (group.length > 1) {
      errors.push({
        type: 'duplicate_id',
        id,
        entries: group,
        message: `id ${id} used by:\n${group.map((e) => `    - ${e.file} — ${e.title}`).join('\n')}`,
      });
    }
  }

  const ids = entries.map((e) => e.id);
  const maxId = ids.length > 0 ? Math.max(...ids) : 0;

  return { total: entries.length, maxId, nextId: maxId + 1, errors, ok: errors.length === 0 };
}

function printReport(group, files, result) {
  console.log(
    `${group} ID validation — ${result.total} entries across ${files.length} files`,
  );

  if (result.errors.length > 0) {
    console.log('');
    console.log(`ERRORS (${result.errors.length}):`);
    for (const e of result.errors) console.log(`  [${e.type}] ${e.message}`);
    console.log('');
    console.log('Validation failed — fix errors above.');
  } else {
    console.log('  No duplicate IDs found.');
  }
}

const argv = process.argv.slice(2);
const jsonMode = argv.includes('--json');
const nextIdMode = argv.includes('--next-id');

// A bare argument names the group. Defaults to `learnings` so existing callers
// (`--next-id` in the /load command) keep working unchanged.
const named = argv.find((a) => !a.startsWith('-'));
if (named && !GROUPS[named]) {
  console.error(`Unknown group "${named}". Known: ${Object.keys(GROUPS).join(', ')}`);
  process.exit(1);
}

const results = Object.fromEntries(
  Object.entries(GROUPS).map(([group, files]) => [group, validate(loadGroup(files))]),
);

if (nextIdMode) {
  const group = named ?? DEFAULT_GROUP;
  if (!results[group].ok) {
    console.error(`Cannot compute next id for ${group} — duplicate IDs exist. Fix errors first.`);
    process.exit(1);
  }
  console.log(results[group].nextId);
  process.exit(0);
}

// Without a named group, every group is checked — that is what `npm test` runs.
const checked = named ? [named] : Object.keys(GROUPS);

if (jsonMode) {
  console.log(JSON.stringify(named ? results[named] : results, null, 2));
} else {
  for (const group of checked) printReport(group, GROUPS[group], results[group]);
}

process.exit(checked.every((g) => results[g].ok) ? 0 : 1);
