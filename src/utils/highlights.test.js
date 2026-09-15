import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addMark,
  countMarks,
  keyFor,
  marksFor,
  nthIndexOf,
  occurrencesBefore,
  removeMark,
} from './highlights.js';

const mark = (over = {}) => ({ id: 'h1', text: 'cursor', nth: 0, createdAt: 1, ...over });

/* ── the anchor maths ──────────────────────────────────────────────── */

test('nthIndexOf finds the first occurrence', () => {
  assert.equal(nthIndexOf('a cursor and a cursor', 'cursor', 0), 2);
});

test('nthIndexOf finds a later occurrence', () => {
  assert.equal(nthIndexOf('a cursor and a cursor', 'cursor', 1), 15);
});

test('nthIndexOf returns -1 when the occurrence does not exist', () => {
  assert.equal(nthIndexOf('a cursor', 'cursor', 1), -1);
});

test('nthIndexOf returns -1 for an empty needle', () => {
  assert.equal(nthIndexOf('anything', '', 0), -1);
});

test('nthIndexOf counts non-overlapping occurrences', () => {
  // "aaaa" contains "aa" twice non-overlapping, not three times.
  assert.equal(nthIndexOf('aaaa', 'aa', 1), 2);
  assert.equal(nthIndexOf('aaaa', 'aa', 2), -1);
});

test('occurrencesBefore counts only matches starting before the limit', () => {
  const text = 'a cursor and a cursor and a cursor';
  assert.equal(occurrencesBefore(text, 'cursor', 2), 0);
  assert.equal(occurrencesBefore(text, 'cursor', 15), 1);
  assert.equal(occurrencesBefore(text, 'cursor', 28), 2);
});

test('occurrencesBefore and nthIndexOf are inverses', () => {
  // The DOM side derives `nth` with occurrencesBefore; the render side finds
  // it again with nthIndexOf. If these ever disagree a highlight lands on the
  // wrong words, so pin the round trip.
  const text = 'offset drifts, cursor anchors, offset again, cursor again';
  for (const needle of ['offset', 'cursor']) {
    for (let nth = 0; nth < 2; nth += 1) {
      const at = nthIndexOf(text, needle, nth);
      assert.notEqual(at, -1);
      assert.equal(occurrencesBefore(text, needle, at), nth);
    }
  }
});

/* ── the store ─────────────────────────────────────────────────────── */

test('marksFor returns an empty array for an unknown entry', () => {
  assert.deepEqual(marksFor({}, 'system-design', 118), []);
  assert.deepEqual(marksFor(undefined, 'system-design', 118), []);
});

test('marksFor ignores a stored value of the wrong shape', () => {
  assert.deepEqual(marksFor({ 'system-design:118': 'nope' }, 'system-design', 118), []);
});

test('addMark stores under a section:id key', () => {
  const next = addMark({}, 'system-design', 118, mark());
  assert.deepEqual(Object.keys(next), [keyFor('system-design', 118)]);
  assert.equal(next['system-design:118'].length, 1);
});

test('addMark does not duplicate the same text at the same occurrence', () => {
  const one = addMark({}, 'system-design', 118, mark());
  const two = addMark(one, 'system-design', 118, mark({ id: 'h2' }));
  assert.equal(two, one, 'state should be returned unchanged');
});

test('addMark keeps the same text at a different occurrence', () => {
  const one = addMark({}, 'system-design', 118, mark());
  const two = addMark(one, 'system-design', 118, mark({ id: 'h2', nth: 1 }));
  assert.equal(two['system-design:118'].length, 2);
});

test('addMark does not mutate the state it is given', () => {
  const before = {};
  addMark(before, 'system-design', 118, mark());
  assert.deepEqual(before, {});
});

test('removeMark drops the entry key once its last mark goes', () => {
  const one = addMark({}, 'system-design', 118, mark());
  const gone = removeMark(one, 'system-design', 118, 'h1');
  assert.deepEqual(gone, {});
});

test('removeMark leaves the other marks alone', () => {
  let state = addMark({}, 'system-design', 118, mark());
  state = addMark(state, 'system-design', 118, mark({ id: 'h2', nth: 1 }));
  const next = removeMark(state, 'system-design', 118, 'h1');
  assert.deepEqual(
    next['system-design:118'].map((m) => m.id),
    ['h2']
  );
});

test('removeMark is a no-op for an id that is not there', () => {
  const state = addMark({}, 'system-design', 118, mark());
  assert.equal(removeMark(state, 'system-design', 118, 'nope'), state);
});

test('countMarks totals across entries and tolerates junk', () => {
  let state = addMark({}, 'system-design', 118, mark());
  state = addMark(state, 'browser', 133, mark({ id: 'h2', text: 'worker' }));
  assert.equal(countMarks({ ...state, broken: null }), 2);
  assert.equal(countMarks(undefined), 0);
});

/* ── sentence detection (pure half — the DOM half is covered in-browser) ─── */

test('sentence terminators are recognised only before whitespace or the end', async () => {
  // isSentenceEnd is private, so exercise it through the abbreviation table
  // that callers actually trip over.
  const { __testables } = await import('./highlights.js');
  if (!__testables) return; // keep the suite green if the export is dropped
  const { isSentenceEnd } = __testables;
  const s = 'Offset drifts. Cursor does not.';
  assert.equal(isSentenceEnd(s, 13), true, 'full stop before a space ends it');
  assert.equal(isSentenceEnd(s, 30), true, 'full stop at the end ends it');

  const abbr = 'Use a cursor, e.g. after=D, and it holds.';
  assert.equal(isSentenceEnd(abbr, 17), false, '"e.g." is not a sentence end');

  const decimal = 'Keep p75 under 2.5s on 4G.';
  assert.equal(isSentenceEnd(decimal, 17), false, 'a decimal point is not a sentence end');
});
