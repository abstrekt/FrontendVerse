import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_FILE = join(__dirname, '..', 'questions.json');
const WARN_THRESHOLD = 200;
const ERROR_THRESHOLD = 120;

function plainLen(explanation) {
  return (explanation ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .length;
}

function audit(questions) {
  const errors = [];
  const warnings = [];

  for (const q of questions) {
    const len = plainLen(q.explanation);
    if (len < ERROR_THRESHOLD) {
      errors.push({
        type: 'too_short',
        id: q.id,
        length: len,
        message: `id ${q.id}: explanation is ${len} chars (< ${ERROR_THRESHOLD})`,
      });
    } else if (len < WARN_THRESHOLD) {
      warnings.push({
        type: 'thin',
        id: q.id,
        length: len,
        message: `id ${q.id}: explanation is ${len} chars (< ${WARN_THRESHOLD})`,
      });
    }
  }

  return {
    total: questions.length,
    errors,
    warnings,
    ok: errors.length === 0,
  };
}

function printReport(result) {
  console.log(`MCQ explanation audit — ${result.total} questions in ${QUESTIONS_FILE}`);
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

  if (result.ok && result.warnings.length === 0) {
    console.log('All explanations meet length thresholds.');
  } else if (result.ok) {
    console.log('No error-level failures (all explanations >= 120 chars).');
  } else {
    console.log('Audit failed — expand explanations listed above.');
  }
}

const data = JSON.parse(readFileSync(QUESTIONS_FILE, 'utf-8'));
const result = audit(data.questions ?? []);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printReport(result);
}

process.exit(result.ok ? 0 : 1);
