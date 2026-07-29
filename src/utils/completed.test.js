import test from 'node:test';
import assert from 'node:assert/strict';

import { EMPTY_COMPLETED, sortCompletedToEnd } from './completed.js';

const items = [
  { id: 1, title: 'First' },
  { id: 2, title: 'Second' },
  { id: 3, title: 'Third' },
  { id: 4, title: 'Fourth' },
];

test('sortCompletedToEnd returns items unchanged when none are completed', () => {
  const result = sortCompletedToEnd(items, 'learnings', EMPTY_COMPLETED);
  assert.deepEqual(result.map((item) => item.id), [1, 2, 3, 4]);
});

test('sortCompletedToEnd returns empty array for empty input', () => {
  const result = sortCompletedToEnd([], 'learnings', EMPTY_COMPLETED);
  assert.deepEqual(result, []);
});

test('sortCompletedToEnd moves completed items to the end preserving relative order', () => {
  const completed = { ...EMPTY_COMPLETED, learnings: [2, 4] };
  const result = sortCompletedToEnd(items, 'learnings', completed);
  assert.deepEqual(result.map((item) => item.id), [1, 3, 2, 4]);
});

test('sortCompletedToEnd preserves relative order within completed group', () => {
  const completed = { ...EMPTY_COMPLETED, learnings: [1, 3] };
  const result = sortCompletedToEnd(items, 'learnings', completed);
  assert.deepEqual(result.map((item) => item.id), [2, 4, 1, 3]);
});

test('sortCompletedToEnd handles all items completed', () => {
  const completed = { ...EMPTY_COMPLETED, learnings: [1, 2, 3, 4] };
  const result = sortCompletedToEnd(items, 'learnings', completed);
  assert.deepEqual(result.map((item) => item.id), [1, 2, 3, 4]);
});

test('sortCompletedToEnd is scoped to the given section', () => {
  const completed = { ...EMPTY_COMPLETED, learnings: [1, 2], 'react-learnings': [3] };
  const learningsResult = sortCompletedToEnd(items, 'learnings', completed);
  assert.deepEqual(learningsResult.map((item) => item.id), [3, 4, 1, 2]);

  const reactResult = sortCompletedToEnd(items, 'react-learnings', completed);
  assert.deepEqual(reactResult.map((item) => item.id), [1, 2, 4, 3]);
});
