import test from 'node:test';
import assert from 'node:assert/strict';

import { compareOutputAnswer, formatExpectedOutput } from './outputCompare.js';

const ran = (...lines) => ({ lines, error: null });
const threw = (error) => ({ lines: [], error });

test('grading is case-sensitive', () => {
  // The whole point of many of these questions is that NaN is not nan.
  assert.equal(compareOutputAnswer('nan', ran('NaN')).correct, false);
  assert.equal(compareOutputAnswer('NaN', ran('NaN')).correct, true);

  assert.equal(compareOutputAnswer('Undefined', ran('undefined')).correct, false);
  assert.equal(compareOutputAnswer('undefined', ran('undefined')).correct, true);

  assert.equal(compareOutputAnswer('True', ran('true')).correct, false);
  assert.equal(compareOutputAnswer('[Object Object]', ran('[object Object]')).correct, false);
});

test('a case-only miss is flagged so the UI can say why', () => {
  const result = compareOutputAnswer('nan', ran('NaN'));
  assert.equal(result.correct, false);
  assert.equal(result.caseMismatch, true);

  const unrelated = compareOutputAnswer('42', ran('NaN'));
  assert.ok(!unrelated.caseMismatch);
});

test('a snippet that prints nothing is answerable', () => {
  // Previously unwinnable: an empty answer was rejected outright and any
  // non-empty answer failed the array comparison.
  assert.equal(compareOutputAnswer('', ran()).correct, true);
  assert.equal(compareOutputAnswer('(no output)', ran()).correct, true);
  assert.equal(compareOutputAnswer('nothing', ran()).correct, true);
  assert.equal(compareOutputAnswer('42', ran()).correct, false);
});

test('an empty answer is still wrong when there is output', () => {
  assert.equal(compareOutputAnswer('', ran('1')).correct, false);
  assert.equal(compareOutputAnswer('   ', ran('1')).correct, false);
});

test('incidental formatting is normalised away', () => {
  assert.equal(compareOutputAnswer('{ "a": 1 }', ran('{"a":1}')).correct, true);
  assert.equal(compareOutputAnswer('[ 1, 2, 3 ]', ran('[1,2,3]')).correct, true);
  assert.equal(compareOutputAnswer('“hi”', ran('"hi"')).correct, true);
});

test('multi-part answers compare per line and comma-separated', () => {
  assert.equal(compareOutputAnswer('1\n2\n3', ran('1', '2', '3')).correct, true);
  assert.equal(compareOutputAnswer('1, 2, 3', ran('1', '2', '3')).correct, true);
  assert.equal(compareOutputAnswer('1, 3, 2', ran('1', '2', '3')).correct, false);
});

test('thrown errors are compared against the error text', () => {
  assert.equal(
    compareOutputAnswer('TypeError: x is not a function', threw('TypeError: x is not a function'))
      .correct,
    true
  );
  assert.equal(compareOutputAnswer('ReferenceError', threw('TypeError: nope')).correct, false);
});

test('expectedLines is used when the snippet produced nothing at runtime', () => {
  const result = compareOutputAnswer('7', { lines: [], error: null }, ['7']);
  assert.equal(result.correct, true);
});

test('formatExpectedOutput labels the empty case', () => {
  assert.equal(formatExpectedOutput([], null), '(no output)');
  assert.equal(formatExpectedOutput(['a', 'b'], null), 'a, b');
  assert.equal(formatExpectedOutput([], 'TypeError: x'), 'TypeError: x');
});
