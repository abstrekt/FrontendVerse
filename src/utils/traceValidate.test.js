import test from 'node:test';
import assert from 'node:assert/strict';

import { validateTrace, LANE_KINDS, TONES } from '../../scripts/lib/trace-validate.mjs';

/**
 * The trace format is authored by hand and only ever read back as JSON
 * embedded in a markdown string, so these cases pin the errors that would
 * otherwise surface as a silently half-drawn board in the browser.
 */

const cellsTrace = () => ({
  input: 'nums = [3, 2, 4]',
  lanes: [{ id: 'nums', label: 'nums', cells: [3, 2, 4], indices: true }],
  vars: ['need'],
  steps: [
    {
      note: 'Read 3.',
      cursors: { nums: { i: 0 } },
      marks: { nums: { 0: 'active' } },
      vars: { need: '3' },
    },
  ],
  result: 'return [1, 2]',
});

const reactTrace = () => ({
  input: '<App/> with a memoised <List/>',
  lanes: [
    {
      id: 'tree',
      label: 'tree',
      kind: 'tree',
      nodes: [
        { id: 'app', label: 'App' },
        { id: 'list', label: 'List', parent: 'app' },
        { id: 'row', label: 'Row', parent: 'list' },
      ],
    },
    { id: 'hooks', label: 'hooks', kind: 'slots', slots: ['count', 'name'] },
    { id: 'phase', label: 'phase', kind: 'phases', of: ['render', 'commit', 'paint'] },
    { id: 'out', label: 'console', kind: 'log' },
  ],
  vars: ['state'],
  steps: [
    {
      note: 'setState on App re-renders it; List bails out.',
      cursors: { tree: { at: 'app' }, phase: { now: 'render' }, hooks: { slot: 'count' } },
      marks: { tree: { app: 'active', list: 'skip' }, hooks: { count: 'active' }, out: { 0: 'done' } },
      cells: { hooks: ['1', 'ada'], out: ['App rendered'] },
      vars: { state: '1' },
    },
  ],
});

test('accepts the canonical cells trace', () => {
  assert.doesNotThrow(() => validateTrace(cellsTrace(), '#10'));
});

test('accepts every React lane kind together', () => {
  assert.doesNotThrow(() => validateTrace(reactTrace(), 'guide#2'));
});

test('accepts a range mark and a null cursor', () => {
  const t = cellsTrace();
  t.steps[0].marks.nums = { '0-2': 'window' };
  t.steps[0].cursors.nums = { i: null };
  assert.doesNotThrow(() => validateTrace(t));
});

test('every documented kind and tone is exported', () => {
  for (const kind of ['cells', 'tree', 'slots', 'phases', 'log']) {
    assert.ok(LANE_KINDS.has(kind), `missing kind ${kind}`);
  }
  for (const tone of ['active', 'hit', 'bad', 'skip', 'window', 'done']) {
    assert.ok(TONES.has(tone), `missing tone ${tone}`);
  }
});

test('rejects a mark on an undeclared lane', () => {
  const t = cellsTrace();
  t.steps[0].marks = { ghost: { 0: 'active' } };
  assert.throws(() => validateTrace(t, '#10'), /#10: step 1 marks unknown lane "ghost"/);
});

test('rejects an undeclared var', () => {
  const t = cellsTrace();
  t.steps[0].vars = { total: '9' };
  assert.throws(() => validateTrace(t), /sets undeclared var "total"/);
});

test('rejects an unknown tone', () => {
  const t = cellsTrace();
  t.steps[0].marks.nums = { 0: 'sparkly' };
  assert.throws(() => validateTrace(t), /unknown tone "sparkly"/);
});

test('rejects an unknown lane kind', () => {
  const t = cellsTrace();
  t.lanes[0].kind = 'galaxy';
  assert.throws(() => validateTrace(t), /unknown kind "galaxy"/);
});

test('rejects a tree mark on a node that does not exist', () => {
  const t = reactTrace();
  t.steps[0].marks.tree = { footer: 'active' };
  assert.throws(() => validateTrace(t), /unknown tree key "footer"/);
});

test('rejects a forward parent reference in a tree', () => {
  const t = reactTrace();
  t.lanes[0].nodes = [
    { id: 'list', label: 'List', parent: 'app' },
    { id: 'app', label: 'App' },
  ];
  assert.throws(() => validateTrace(t), /names parent "app" before it is declared/);
});

test('rejects a tree with no root', () => {
  const t = reactTrace();
  t.lanes[0].nodes = [{ id: 'app', label: 'App', parent: 'app' }];
  assert.throws(() => validateTrace(t), /names parent "app" before it is declared/);
});

test('rejects a cursor pointing at a phase that is not declared', () => {
  const t = reactTrace();
  t.steps[0].cursors.phase = { now: 'hydrate' };
  assert.throws(() => validateTrace(t), /cursor points at unknown phases "hydrate"/);
});

test('rejects a slots content override of the wrong length', () => {
  const t = reactTrace();
  t.steps[0].cells.hooks = ['1'];
  assert.throws(() => validateTrace(t), /has 1 values, expected 2/);
});

test('rejects content on a phases lane', () => {
  const t = reactTrace();
  t.steps[0].cells.phase = ['render'];
  assert.throws(() => validateTrace(t), /sets content on phases lane "phase"/);
});

test('rejects a duplicate lane id', () => {
  const t = cellsTrace();
  t.lanes.push({ id: 'nums', cells: [1] });
  assert.throws(() => validateTrace(t), /declares lane "nums" twice/);
});

test('rejects a step with no note', () => {
  const t = cellsTrace();
  delete t.steps[0].note;
  assert.throws(() => validateTrace(t), /step 1 has no note/);
});

test('rejects a trace with no steps', () => {
  const t = cellsTrace();
  t.steps = [];
  assert.throws(() => validateTrace(t), /has no steps/);
});
