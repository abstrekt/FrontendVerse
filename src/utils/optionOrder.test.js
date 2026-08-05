import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { presentOptions } from './optionOrder.js';

const questions = JSON.parse(
  readFileSync(new URL('../../questions.json', import.meta.url), 'utf8')
).questions;

const sample = [
  { key: 'A', text: 'alpha' },
  { key: 'B', text: 'beta' },
  { key: 'C', text: 'gamma' },
  { key: 'D', text: 'delta' },
];

test('the presented order is stable for a given question', () => {
  const first = presentOptions(sample, 'C', 42);
  const second = presentOptions(sample, 'C', 42);

  assert.deepEqual(
    first.options.map((o) => o.text),
    second.options.map((o) => o.text)
  );
  assert.equal(first.answer, second.answer);
});

test('different questions get different orders', () => {
  const orders = new Set(
    [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
      presentOptions(sample, 'A', seed).options.map((o) => o.text).join()
    )
  );
  assert.ok(orders.size > 1, 'seeding should actually vary the order');
});

test('every option survives, re-lettered in display order', () => {
  const { options } = presentOptions(sample, 'A', 7);

  assert.deepEqual(options.map((o) => o.key), ['A', 'B', 'C', 'D']);
  assert.deepEqual(
    options.map((o) => o.text).sort(),
    sample.map((o) => o.text).sort()
  );
});

test('the returned answer key points at the originally correct option', () => {
  for (const seed of [0, 1, 2, 3, 99, 12345]) {
    const { options, answer } = presentOptions(sample, 'C', seed);
    const correct = options.find((o) => o.key === answer);
    assert.equal(correct.text, 'gamma', `seed ${seed} lost the correct answer`);
  }
});

test('questions with fewer or more than four options are handled', () => {
  const two = presentOptions(sample.slice(0, 2), 'B', 3);
  assert.equal(two.options.length, 2);
  assert.equal(two.options.find((o) => o.key === two.answer).text, 'beta');

  const five = presentOptions([...sample, { key: 'E', text: 'epsilon' }], 'E', 3);
  assert.deepEqual(five.options.map((o) => o.key), ['A', 'B', 'C', 'D', 'E']);
  assert.equal(five.options.find((o) => o.key === five.answer).text, 'epsilon');
});

test('an answer key not present in the options does not silently break', () => {
  const { answer } = presentOptions(sample, 'Z', 1);
  assert.equal(answer, 'Z');
});

/**
 * The authored data is badly biased — D is correct in only 26 of 246 questions
 * (10.6%), and always guessing B scores far above chance. This asserts the
 * presented positions are close to uniform, which is the whole point.
 */
test('shuffling removes the answer-position bias across the real question set', () => {
  const counts = {};
  let fourOption = 0;

  for (const question of questions) {
    const { answer } = presentOptions(question.options, question.answer, question.id);
    if (question.options.length !== 4) continue;
    fourOption++;
    counts[answer] = (counts[answer] ?? 0) + 1;
  }

  const expected = fourOption / 4;
  for (const key of ['A', 'B', 'C', 'D']) {
    const share = (counts[key] ?? 0) / fourOption;
    assert.ok(
      Math.abs(share - 0.25) < 0.07,
      `option ${key} is correct ${(share * 100).toFixed(1)}% of the time (expected ~25%)`
    );
  }

  assert.ok(expected > 0);
});
