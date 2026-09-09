import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { computeCounts } from '../../scripts/build-data-manifest.mjs';

// data/counts.json is imported statically to keep the sidebar counts stable
// while the real datasets are still loading. A stale manifest shows the wrong
// totals on first paint, so it has to be regenerated whenever content changes.
test('data/counts.json matches the datasets on disk', () => {
  const committed = JSON.parse(readFileSync(new URL('../../data/counts.json', import.meta.url)));
  assert.deepEqual(
    committed,
    computeCounts(),
    'data/counts.json is stale — run `npm run build:data-manifest`',
  );
});
