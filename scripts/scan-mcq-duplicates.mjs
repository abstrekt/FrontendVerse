import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCode } from '../tools/normalize-code.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_FILE = join(__dirname, '..', 'questions.json');
const PREFIX_LEN = 80;
const MIN_CODE_LEN = 10;

function loadQuestions() {
  const data = JSON.parse(readFileSync(QUESTIONS_FILE, 'utf-8'));
  return data.questions ?? [];
}

function optionTexts(q) {
  return (q.options ?? []).map((o) => o.text).sort().join('|');
}

function fullKey(q) {
  return `${normalizeCode(q.body)}::${optionTexts(q)}::${q.answer}`;
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()].filter(([, group]) => group.length > 1);
}

function scan(questions) {
  const errors = [];
  const warnings = [];

  const idGroups = groupBy(questions, (q) => String(q.id));
  for (const [, group] of idGroups) {
    errors.push({
      type: 'duplicate_id',
      ids: group.map((q) => q.id),
      message: `Duplicate id values: ${group.map((q) => q.id).join(', ')}`,
    });
  }

  const codeGroups = groupBy(
    questions.filter((q) => normalizeCode(q.body).length >= MIN_CODE_LEN),
    (q) => normalizeCode(q.body)
  );
  for (const [code, group] of codeGroups) {
    errors.push({
      type: 'duplicate_code',
      ids: group.map((q) => q.id),
      preview: code.slice(0, 120),
      message: `Duplicate normalized code (ids ${group.map((q) => q.id).join(', ')}): ${code.slice(0, 80)}…`,
    });
  }

  const fullGroups = groupBy(questions, fullKey);
  for (const [, group] of fullGroups) {
    const code = normalizeCode(group[0].body);
    if (code.length < MIN_CODE_LEN) continue;
    errors.push({
      type: 'duplicate_full',
      ids: group.map((q) => q.id),
      message: `Exact duplicate (body + options + answer), ids ${group.map((q) => q.id).join(', ')}`,
    });
  }

  const titleGroups = groupBy(questions, (q) => (q.question ?? '').trim());
  for (const [title, group] of titleGroups) {
    warnings.push({
      type: 'duplicate_title',
      ids: group.map((q) => q.id),
      title,
      message: `"${title}" shared by ${group.length} questions (ids ${group.map((q) => q.id).join(', ')})`,
    });
  }

  const emptyBodies = questions.filter((q) => normalizeCode(q.body).length < MIN_CODE_LEN);
  if (emptyBodies.length > 0) {
    warnings.push({
      type: 'empty_body',
      ids: emptyBodies.map((q) => q.id),
      message: `${emptyBodies.length} question(s) with empty/minimal body (ids ${emptyBodies.map((q) => q.id).join(', ')})`,
    });
  }

  const prefixMap = new Map();
  for (const q of questions) {
    const code = normalizeCode(q.body);
    if (code.length < PREFIX_LEN) continue;
    const prefix = code.slice(0, PREFIX_LEN);
    if (!prefixMap.has(prefix)) prefixMap.set(prefix, []);
    prefixMap.get(prefix).push(q);
  }
  for (const [prefix, group] of prefixMap.entries()) {
    if (group.length < 2) continue;
    warnings.push({
      type: 'review_cluster',
      ids: group.map((q) => q.id),
      preview: prefix,
      message: `Review cluster: ${group.length} questions share code prefix (ids ${group.map((q) => q.id).join(', ')})`,
    });
  }

  return {
    total: questions.length,
    errors,
    warnings,
    ok: errors.length === 0,
  };
}

function printReport(result) {
  console.log(`MCQ duplicate scan — ${result.total} questions in ${QUESTIONS_FILE}`);
  console.log('');

  if (result.errors.length > 0) {
    console.log(`ERRORS (${result.errors.length}):`);
    for (const e of result.errors) {
      console.log(`  [${e.type}] ${e.message}`);
    }
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log(`WARNINGS (${result.warnings.length}):`);
    for (const w of result.warnings) {
      console.log(`  [${w.type}] ${w.message}`);
    }
    console.log('');
  }

  if (result.ok) {
    console.log('No hard duplicate failures.');
  } else {
    console.log('Scan failed — fix errors above.');
  }
}

const jsonMode = process.argv.includes('--json');
const result = scan(loadQuestions());

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printReport(result);
}

process.exit(result.ok ? 0 : 1);
