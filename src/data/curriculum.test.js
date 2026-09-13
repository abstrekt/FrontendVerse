import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM, applyCurriculum, UNSORTED_LABEL } from './curriculum.js';

/**
 * The curriculum table lives apart from the content it orders, so nothing stops
 * the two drifting: an entry added to a JSON file is unplaced, and an entry
 * deleted leaves a phantom id behind. These are the checks that catch it.
 *
 * Mirrors the merges in `src/data/datasets.js`.
 */
const SOURCES = {
  learnings: [
    'data/learnings.json',
    'data/tekion-interview-learnings.json',
    'data/wtfjs-learnings.json',
    'data/devto-interview-learnings.json',
    'data/senior-frontend-learnings.json',
  ],
  browser: ['data/browser-platform-learnings.json'],
  blind75: ['data/blind75-learnings.json'],
  'system-design': [
    'data/system-design-foundations.json',
    'data/system-design-hld.json',
    'data/system-design-cases.json',
    'data/system-design-lld.json',
    'data/system-design-deep-dives.json',
    'data/system-design-playbooks.json',
  ],
};

function loadIds(files) {
  return files.flatMap(
    (file) => JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')).learnings,
  ).map((item) => item.id);
}

for (const [section, files] of Object.entries(SOURCES)) {
  const dataIds = loadIds(files);
  const tableIds = CURRICULUM[section].flatMap((mod) => mod.ids);

  test(`${section}: no id is listed twice`, () => {
    assert.equal(new Set(tableIds).size, tableIds.length);
  });

  test(`${section}: every entry is placed in a module`, () => {
    const placed = new Set(tableIds);
    assert.deepEqual(dataIds.filter((id) => !placed.has(id)), []);
  });

  test(`${section}: the table names no entry that does not exist`, () => {
    const present = new Set(dataIds);
    assert.deepEqual(tableIds.filter((id) => !present.has(id)), []);
  });

  test(`${section}: module keys and labels are unique`, () => {
    const keys = CURRICULUM[section].map((mod) => mod.key);
    const labels = CURRICULUM[section].map((mod) => mod.label);
    assert.equal(new Set(keys).size, keys.length);
    assert.equal(new Set(labels).size, labels.length);
  });
}

test('applyCurriculum sorts into module order and stamps each entry', () => {
  const first = CURRICULUM.learnings[0];
  const second = CURRICULUM.learnings[1];
  const items = [{ id: second.ids[0] }, { id: first.ids[1] }, { id: first.ids[0] }];

  const sorted = applyCurriculum('learnings', items);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [first.ids[0], first.ids[1], second.ids[0]],
  );
  assert.equal(sorted[0].module, first.label);
  assert.equal(sorted[0].moduleKey, first.key);
  assert.equal(sorted[2].module, second.label);
});

test('applyCurriculum parks unlisted entries at the end rather than dropping them', () => {
  const known = CURRICULUM.learnings[0].ids[0];
  const sorted = applyCurriculum('learnings', [{ id: 99999 }, { id: known }]);

  assert.deepEqual(sorted.map((item) => item.id), [known, 99999]);
  assert.equal(sorted[1].module, UNSORTED_LABEL);
});

test('applyCurriculum leaves sections without a table untouched', () => {
  const items = [{ id: 3 }, { id: 1 }];
  assert.deepEqual(applyCurriculum('css', items), items);
});
