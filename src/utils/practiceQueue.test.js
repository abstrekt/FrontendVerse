import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advancePass,
  appendToQueueTail,
  archiveFromQueue,
  createPracticeQueue,
  getPracticeQueueQuestionIds,
  getSkippedPracticeQueueIds,
  markAnswerCorrectInQueue,
  normalizePracticeQueue,
  openQuestionInQueue,
  recordAnswerInQueue,
  restrictQueueToPool,
  skipQuestionInQueue,
} from './practiceQueue.js';

const pool = (...ids) => ids.map((id) => ({ id }));

test('createPracticeQueue initializes explicit pending state', () => {
  const queue = createPracticeQueue([{ id: 1 }, { id: 2 }, { id: 3 }]);

  assert.deepEqual(queue.pendingIds, [1, 2, 3]);
  assert.deepEqual(queue.seenIds, []);
  assert.equal(queue.remaining, 3);
  assert.equal(queue.passTotal, 3);
});

test('advancePass moves the current item from pending to seen', () => {
  const queue = createPracticeQueue([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const next = advancePass(queue);

  assert.deepEqual(next.pendingIds, [2, 3]);
  assert.deepEqual(next.seenIds, [1]);
  assert.deepEqual(getPracticeQueueQuestionIds(next), [2, 3, 1]);
  assert.equal(next.remaining, 2);
});

test('openQuestionInQueue reopens a seen item at the front of the pass', () => {
  const queue = advancePass(createPracticeQueue([{ id: 1 }, { id: 2 }, { id: 3 }]));
  const reopened = openQuestionInQueue(queue, 1);

  assert.deepEqual(reopened.pendingIds, [1, 2, 3]);
  assert.deepEqual(reopened.seenIds, []);
  assert.equal(reopened.remaining, 3);
});

test('skipQuestionInQueue marks the current item skipped and removes it from pending', () => {
  const queue = createPracticeQueue([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const skipped = skipQuestionInQueue(queue, 1);

  assert.deepEqual(skipped.pendingIds, [2, 3]);
  assert.deepEqual(skipped.seenIds, [1]);
  assert.deepEqual(getSkippedPracticeQueueIds(skipped), [1]);
  assert.equal(skipped.remaining, 2);
});

test('appendToQueueTail unskips and requeues a seen item at the tail of pending', () => {
  const queue = skipQuestionInQueue(createPracticeQueue([{ id: 1 }, { id: 2 }, { id: 3 }]), 1);
  const unskipped = appendToQueueTail(queue, 1, { clearSkipped: true });

  assert.deepEqual(unskipped.pendingIds, [2, 3, 1]);
  assert.deepEqual(unskipped.seenIds, []);
  assert.deepEqual(getSkippedPracticeQueueIds(unskipped), []);
  assert.equal(unskipped.remaining, 3);
});

test('archiveFromQueue removes archived ids from every pass bucket', () => {
  const queue = {
    ...createPracticeQueue([{ id: 1 }, { id: 2 }, { id: 3 }]),
    answeredIds: [1, 2],
  };
  const skipped = skipQuestionInQueue(queue, 1);
  const archived = archiveFromQueue(skipped, 1);

  assert.deepEqual(archived.pendingIds, [2, 3]);
  assert.deepEqual(archived.seenIds, []);
  assert.deepEqual(archived.answeredIds, [2]);
  assert.deepEqual(getSkippedPracticeQueueIds(archived), []);
  assert.equal(archived.passTotal, 2);
});

test('recordAnswerInQueue derives score and answered, and is idempotent', () => {
  let queue = createPracticeQueue(pool(1, 2, 3));
  queue = recordAnswerInQueue(queue, 1, true);
  queue = recordAnswerInQueue(queue, 2, false);

  assert.equal(queue.answered, 2);
  assert.equal(queue.score, 1);
  assert.deepEqual(queue.correctIds, [1]);

  // Re-invoking the updater (StrictMode, concurrent rebase) must not re-count.
  const again = recordAnswerInQueue(queue, 1, true);
  assert.equal(again.answered, 2);
  assert.equal(again.score, 1);
});

test('markAnswerCorrectInQueue upgrades a wrong answer exactly once', () => {
  let queue = recordAnswerInQueue(createPracticeQueue(pool(1, 2)), 1, false);
  assert.equal(queue.score, 0);

  queue = markAnswerCorrectInQueue(queue, 1);
  assert.equal(queue.score, 1);

  queue = markAnswerCorrectInQueue(queue, 1);
  assert.equal(queue.score, 1, 'repeat upgrades must not inflate the score');

  queue = markAnswerCorrectInQueue(queue, 2);
  assert.equal(queue.score, 1, 'an unanswered question cannot be upgraded');
});

test('archiving an answered question removes its score with it', () => {
  let queue = createPracticeQueue(pool(1, 2, 3, 4, 5));
  for (const id of [1, 2, 3, 4, 5]) queue = recordAnswerInQueue(queue, id, true);
  assert.equal(queue.score, 5);
  assert.equal(queue.passTotal, 5);

  for (const id of [1, 2, 3, 4]) queue = archiveFromQueue(queue, id);

  // Previously score stayed at 5 while passTotal fell to 1, yielding pct 500.
  assert.equal(queue.passTotal, 1);
  assert.equal(queue.score, 1);
  assert.ok(queue.score <= queue.passTotal);
});

test('restrictQueueToPool drops ids the current filter hides', () => {
  let queue = createPracticeQueue(pool(1, 2, 3));
  queue = recordAnswerInQueue(queue, 1, true);
  queue = advancePass(queue);

  const restricted = restrictQueueToPool(queue, pool(1));

  assert.deepEqual(restricted.queueIds, [1]);
  assert.equal(restricted.remaining, 0);
  assert.equal(restricted.passTotal, 1);
  assert.ok(restricted.remaining <= restricted.passTotal);
});

test('restrictQueueToPool leaves the queue alone while content is still loading', () => {
  const queue = createPracticeQueue(pool(1, 2, 3));
  assert.deepEqual(restrictQueueToPool(queue, []).queueIds, [1, 2, 3]);
});

test('normalizePracticeQueue reconstructs correctIds from a legacy score counter', () => {
  const migrated = normalizePracticeQueue({
    pendingIds: [3],
    seenIds: [1, 2],
    answeredIds: [1, 2],
    score: 1,
    answered: 2,
  });

  assert.equal(migrated.answered, 2);
  assert.equal(migrated.score, 1);
  assert.deepEqual(migrated.correctIds, [1]);
});

test('normalizePracticeQueue migrates legacy queueIds and remaining into pending and seen ids', () => {
  const migrated = normalizePracticeQueue({
    queueIds: [10, 20, 30, 40],
    remaining: 2,
    passTotal: 4,
    score: 1,
    answered: 2,
  });

  assert.deepEqual(migrated.pendingIds, [10, 20]);
  assert.deepEqual(migrated.seenIds, [30, 40]);
  assert.equal(migrated.remaining, 2);
  assert.equal(migrated.passTotal, 4);
});
