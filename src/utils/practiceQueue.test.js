import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advancePass,
  appendToQueueTail,
  archiveFromQueue,
  createPracticeQueue,
  getPracticeQueueQuestionIds,
  getSkippedPracticeQueueIds,
  normalizePracticeQueue,
  openQuestionInQueue,
  skipQuestionInQueue,
} from './practiceQueue.js';

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
