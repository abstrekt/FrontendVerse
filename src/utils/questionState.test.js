import test from 'node:test';
import assert from 'node:assert/strict';

import { createPracticeQueue, skipQuestionInQueue } from './practiceQueue.js';
import {
  buildQuestionRows,
  getPassScopeQuestions,
  getQuestionStatus,
  QUESTION_STATUS_FILTERS,
  QUESTION_STATUS_LABELS,
} from './questionState.js';

test('question status prefers skipped-in-pass over answer history', () => {
  const progress = {
    answers: {
      '7': { correct: 0, wrong: 2, lastSeen: 1, lastCorrect: false },
    },
  };

  assert.equal(getQuestionStatus(7, progress, [7]), 'skipped');
  assert.equal(getQuestionStatus(7, progress, []), 'wrong');
  assert.equal(getQuestionStatus(8, progress, []), 'unanswered');
});

test('question rows derive pass membership and mastered status from shared selectors', () => {
  const questions = [{ id: 1, question: 'One' }, { id: 2, question: 'Two' }];
  const passState = skipQuestionInQueue(createPracticeQueue(questions), 1);
  const rows = buildQuestionRows(questions, {
    progress: { answers: { '2': { correct: 1, wrong: 0, lastSeen: 1, lastCorrect: true } } },
    skippedIds: passState.skippedIds,
    completedIds: [2],
    starredIds: [1],
    passState,
  });

  assert.equal(rows[0].status, 'skipped');
  assert.equal(rows[0].isStarred, true);
  assert.equal(rows[0].isInCurrentPass, true);
  assert.equal(rows[0].isPendingInPass, false);
  assert.equal(rows[1].status, 'correct');
  assert.equal(rows[1].isCompleted, true);
  assert.equal(rows[1].isPendingInPass, true);
});

test('pass scope questions preserve current pass ordering', () => {
  const questions = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const passState = skipQuestionInQueue(createPracticeQueue(questions), 1);

  assert.deepEqual(
    getPassScopeQuestions(questions, passState).map((question) => question.id),
    [2, 3, 1]
  );
});

test('status filter labels reflect pass-local and historical semantics', () => {
  assert.equal(QUESTION_STATUS_LABELS.unanswered, 'No history');
  assert.equal(
    QUESTION_STATUS_FILTERS.find((filter) => filter.id === 'completed')?.label,
    'Mastered'
  );
});
