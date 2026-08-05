import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runOutputCode } from './jsRunner.js';
import { compareOutputAnswer } from './outputCompare.js';

const questions = JSON.parse(
  readFileSync(new URL('../../data/output-questions.json', import.meta.url), 'utf8')
).questions;

/**
 * Every output question is graded by executing its snippet and comparing the
 * result to what the user typed. If the runner disagrees with the curated
 * `expectedLines`, the app will mark the *correct* answer wrong — silently,
 * because there is nothing else to check it against.
 */
test('every question runs and matches its curated expected output', async () => {
  assert.ok(questions.length > 0, 'expected some output questions');

  const mismatches = [];

  for (const question of questions) {
    const result = await runOutputCode(question.code, { async: question.async });

    if (result.error && !(question.expectedLines ?? []).some((l) => l.includes('Error'))) {
      mismatches.push(`#${question.id} threw: ${result.error}`);
      continue;
    }

    const expected = question.expectedLines ?? [];
    const graded = compareOutputAnswer(expected.join('\n'), result, expected);

    if (!graded.correct) {
      mismatches.push(
        `#${question.id} expected [${expected.join(' | ')}] but ran to [${result.lines.join(' | ')}]`
      );
    }
  }

  assert.deepEqual(mismatches, []);
});

test('every question has the fields the UI reads', () => {
  const problems = [];

  for (const question of questions) {
    if (!question.code?.trim()) problems.push(`#${question.id} has no code`);
    if (!Array.isArray(question.expectedLines)) {
      problems.push(`#${question.id} has no expectedLines array`);
    }
    if (!question.explanation?.trim()) problems.push(`#${question.id} has an empty explanation`);
  }

  assert.deepEqual(problems, []);
});
