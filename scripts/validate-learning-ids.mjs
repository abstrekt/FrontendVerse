import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** Must stay in sync with learnings merge in src/App.jsx */
const LEARNING_SOURCES = [
  { file: 'data/learnings.json', key: 'learnings' },
  { file: 'data/polyfill-learnings.json', key: 'learnings' },
  { file: 'data/tekion-interview-learnings.json', key: 'learnings' },
  { file: 'data/wtfjs-learnings.json', key: 'learnings' },
  { file: 'data/devto-interview-learnings.json', key: 'learnings' },
  { file: 'data/senior-frontend-learnings.json', key: 'learnings' },
  { file: 'data/browser-learnings.json', key: 'learnings' },
];

function loadAllLearnings() {
  const entries = [];
  for (const { file, key } of LEARNING_SOURCES) {
    const path = join(ROOT, file);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const items = data[key] ?? [];
    for (const item of items) {
      entries.push({
        id: item.id,
        title: item.title ?? '(no title)',
        file,
      });
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
  const nextId = maxId + 1;

  return {
    total: entries.length,
    maxId,
    nextId,
    errors,
    ok: errors.length === 0,
  };
}

function printReport(result) {
  console.log(`Learning ID validation — ${result.total} entries across ${LEARNING_SOURCES.length} files`);
  console.log('');

  if (result.errors.length > 0) {
    console.log(`ERRORS (${result.errors.length}):`);
    for (const e of result.errors) {
      console.log(`  [${e.type}] ${e.message}`);
    }
    console.log('');
    console.log('Validation failed — fix errors above.');
  } else {
    console.log('No duplicate IDs found.');
  }
}

const jsonMode = process.argv.includes('--json');
const nextIdMode = process.argv.includes('--next-id');
const entries = loadAllLearnings();
const result = validate(entries);

if (nextIdMode) {
  if (!result.ok) {
    console.error('Cannot compute next id — duplicate IDs exist. Fix errors first.');
    process.exit(1);
  }
  console.log(result.nextId);
  process.exit(0);
}

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printReport(result);
}

process.exit(result.ok ? 0 : 1);
