/**
 * Step-by-step traces for the Blind 75 problems, keyed by learning id.
 *
 * Each is rendered by `components/VisualTrace.jsx` from a ```trace fenced
 * block, and each follows the problem's own published solution — if the code
 * in the learning changes, the trace has to change with it.
 *
 * Format (see VisualTrace's header for the full contract):
 *   input   the concrete case being traced
 *   lanes   rows of cells; `cells` is the default content, `indices` numbers them
 *   vars    named state shown under the board, in this order
 *   steps   one per iteration: note, cursors, marks, vars, optional per-lane cells
 *   result  what the function returns, revealed on the last step
 *
 * Marks: active (being read now) · hit (the answer) · bad (rejected) ·
 * window (inside the current window) · done (already consumed).
 */

export const TRACES = {
  /* ── 10. Two Sum ────────────────────────────────────────────────── */
  10: {
    input: 'nums = [3, 2, 4], target = 6',
    lanes: [{ id: 'nums', label: 'nums', cells: [3, 2, 4], indices: true }],
    vars: ['need', 'map'],
    steps: [
      {
        note: 'Read 3. The partner it needs is 6 − 3 = 3. The map is empty, so remember where 3 lives and move on.',
        cursors: { nums: { i: 0 } },
        marks: { nums: { 0: 'active' } },
        vars: { need: '3', map: '{ 3 → 0 }' },
      },
      {
        note: 'Read 2. It needs 4. Nothing has left a 4 behind yet, so remember 2 as well.',
        cursors: { nums: { i: 1 } },
        marks: { nums: { 0: 'done', 1: 'active' } },
        vars: { need: '4', map: '{ 3 → 0, 2 → 1 }' },
      },
      {
        note: 'Read 4. It needs 2 — and 2 is already in the map, from index 1. One pass, no inner loop.',
        cursors: { nums: { i: 2 } },
        marks: { nums: { 0: 'done', 1: 'hit', 2: 'hit' } },
        vars: { need: '2', map: '{ 3 → 0, 2 → 1 }' },
      },
    ],
    result: 'return [1, 2]',
  },

  /* ── 11. Contains Duplicate ─────────────────────────────────────── */
  11: {
    input: 'nums = [1, 2, 3, 1]',
    lanes: [{ id: 'nums', label: 'nums', cells: [1, 2, 3, 1], indices: true }],
    vars: ['seen'],
    steps: [
      {
        note: 'The set is empty, so 1 is new. Add it.',
        cursors: { nums: { i: 0 } },
        marks: { nums: { 0: 'active' } },
        vars: { seen: '{ 1 }' },
      },
      {
        note: '2 is new too.',
        cursors: { nums: { i: 1 } },
        marks: { nums: { 0: 'done', 1: 'active' } },
        vars: { seen: '{ 1, 2 }' },
      },
      {
        note: 'And 3.',
        cursors: { nums: { i: 2 } },
        marks: { nums: { '0-1': 'done', 2: 'active' } },
        vars: { seen: '{ 1, 2, 3 }' },
      },
      {
        note: '1 is already in the set — return immediately. The early exit is why this beats sorting on most inputs.',
        cursors: { nums: { i: 3 } },
        marks: { nums: { 0: 'hit', '1-2': 'done', 3: 'hit' } },
        vars: { seen: '{ 1, 2, 3 }' },
      },
    ],
    result: 'return true',
  },

  /* ── 12. Valid Anagram ──────────────────────────────────────────── */
  12: {
    input: 's = "rat", t = "tar"',
    lanes: [
      { id: 's', label: 's', cells: ['r', 'a', 't'] },
      { id: 't', label: 't', cells: ['t', 'a', 'r'] },
    ],
    vars: ['counts'],
    steps: [
      {
        note: 'Lengths match, so it is still possible. Pass one tallies every letter of s.',
        cursors: { s: { i: 0 } },
        marks: { s: { 0: 'active' } },
        vars: { counts: '{ r: 1 }' },
      },
      {
        note: 'Tally a.',
        cursors: { s: { i: 1 } },
        marks: { s: { 0: 'done', 1: 'active' } },
        vars: { counts: '{ r: 1, a: 1 }' },
      },
      {
        note: 'Tally t. s is fully counted.',
        cursors: { s: { i: 2 } },
        marks: { s: { '0-1': 'done', 2: 'active' } },
        vars: { counts: '{ r: 1, a: 1, t: 1 }' },
      },
      {
        note: 'Pass two spends the tally using t. t has a count, so decrement it.',
        cursors: { t: { j: 0 } },
        marks: { s: { '0-2': 'done' }, t: { 0: 'active' } },
        vars: { counts: '{ r: 1, a: 1, t: 0 }' },
      },
      {
        note: 'a still has a count. Decrement.',
        cursors: { t: { j: 1 } },
        marks: { s: { '0-2': 'done' }, t: { 0: 'done', 1: 'active' } },
        vars: { counts: '{ r: 1, a: 0, t: 0 }' },
      },
      {
        note: 'r brings the last count to zero. Nothing ran out and nothing is left over.',
        cursors: { t: { j: 2 } },
        marks: { s: { '0-2': 'done' }, t: { '0-1': 'done', 2: 'hit' } },
        vars: { counts: '{ r: 0, a: 0, t: 0 }' },
      },
    ],
    result: 'return true',
  },

  /* ── 13. Group Anagrams ─────────────────────────────────────────── */
  13: {
    input: 'strs = ["eat", "tea", "tan"]',
    lanes: [{ id: 'strs', label: 'strs', cells: ['eat', 'tea', 'tan'], indices: true }],
    vars: ['key', 'groups'],
    steps: [
      {
        note: 'Sort the letters of "eat" to get its fingerprint, "aet". No group has that key yet, so start one.',
        cursors: { strs: { i: 0 } },
        marks: { strs: { 0: 'active' } },
        vars: { key: '"aet"', groups: '{ aet: [eat] }' },
      },
      {
        note: '"tea" sorts to the same "aet" — same letters, so same bucket.',
        cursors: { strs: { i: 1 } },
        marks: { strs: { 0: 'hit', 1: 'hit' } },
        vars: { key: '"aet"', groups: '{ aet: [eat, tea] }' },
      },
      {
        note: '"tan" sorts to "ant", a key nobody has used. It gets its own group.',
        cursors: { strs: { i: 2 } },
        marks: { strs: { '0-1': 'done', 2: 'active' } },
        vars: { key: '"ant"', groups: '{ aet: [eat, tea], ant: [tan] }' },
      },
    ],
    result: 'return [["eat", "tea"], ["tan"]]',
  },

  /* ── 14. Top K Frequent ─────────────────────────────────────────── */
  14: {
    input: 'nums = [1, 1, 1, 2, 2, 3], k = 2',
    lanes: [
      { id: 'nums', label: 'nums', cells: [1, 1, 1, 2, 2, 3] },
      { id: 'buckets', label: 'buckets', cells: ['', '', '', '', '', '', ''], indices: true },
    ],
    vars: ['count', 'result'],
    steps: [
      {
        note: 'First pass: tally how often each number appears.',
        marks: { nums: { '0-5': 'active' } },
        vars: { count: '{ 1: 3, 2: 2, 3: 1 }', result: '[]' },
      },
      {
        note: 'Now file each number into the bucket for its frequency. The bucket index *is* the count — which is what removes the need to sort.',
        cells: { buckets: ['', '3', '2', '1', '', '', ''] },
        marks: { buckets: { 1: 'active', 2: 'active', 3: 'active' } },
        vars: { count: '{ 1: 3, 2: 2, 3: 1 }', result: '[]' },
      },
      {
        note: 'Walk the buckets from the highest frequency down. Bucket 3 holds the number 1 — take it.',
        cells: { buckets: ['', '3', '2', '1', '', '', ''] },
        cursors: { buckets: { freq: 3 } },
        marks: { buckets: { 3: 'hit' } },
        vars: { count: '{ 1: 3, 2: 2, 3: 1 }', result: '[1]' },
      },
      {
        note: 'Bucket 2 holds 2. That is k items, so stop — the rest of the buckets are never looked at.',
        cells: { buckets: ['', '3', '2', '1', '', '', ''] },
        cursors: { buckets: { freq: 2 } },
        marks: { buckets: { 2: 'hit', 3: 'hit' } },
        vars: { count: '{ 1: 3, 2: 2, 3: 1 }', result: '[1, 2]' },
      },
    ],
    result: 'return [1, 2]',
  },

  /* ── 15. Product of Array Except Self ───────────────────────────── */
  15: {
    input: 'nums = [1, 2, 3, 4]',
    lanes: [
      { id: 'nums', label: 'nums', cells: [1, 2, 3, 4], indices: true },
      { id: 'res', label: 'result', cells: [1, 1, 1, 1] },
    ],
    vars: ['pass', 'prefix', 'suffix'],
    steps: [
      {
        note: 'Pass one goes left to right. Write the running product of everything *before* i — nothing is before index 0, so 1.',
        cursors: { nums: { i: 0 } },
        marks: { nums: { 0: 'active' }, res: { 0: 'active' } },
        cells: { res: [1, 1, 1, 1] },
        vars: { pass: 'prefix →', prefix: '1', suffix: '—' },
      },
      {
        note: 'Everything before index 1 is just 1.',
        cursors: { nums: { i: 1 } },
        marks: { nums: { 1: 'active' }, res: { 1: 'active' } },
        cells: { res: [1, 1, 1, 1] },
        vars: { pass: 'prefix →', prefix: '2', suffix: '—' },
      },
      {
        note: 'Before index 2 sits 1 × 2 = 2.',
        cursors: { nums: { i: 2 } },
        marks: { nums: { 2: 'active' }, res: { 2: 'active' } },
        cells: { res: [1, 1, 2, 1] },
        vars: { pass: 'prefix →', prefix: '6', suffix: '—' },
      },
      {
        note: 'Before index 3 sits 1 × 2 × 3 = 6. The left halves are done.',
        cursors: { nums: { i: 3 } },
        marks: { nums: { 3: 'active' }, res: { 3: 'active' } },
        cells: { res: [1, 1, 2, 6] },
        vars: { pass: 'prefix →', prefix: '24', suffix: '—' },
      },
      {
        note: 'Pass two comes back right to left, multiplying in everything *after* i. Nothing is after index 3.',
        cursors: { nums: { i: 3 } },
        marks: { nums: { 3: 'active' }, res: { 3: 'active' } },
        cells: { res: [1, 1, 2, 6] },
        vars: { pass: '← suffix', prefix: '—', suffix: '4' },
      },
      {
        note: 'After index 2 sits 4, so 2 × 4 = 8.',
        cursors: { nums: { i: 2 } },
        marks: { nums: { 2: 'active' }, res: { 2: 'active' } },
        cells: { res: [1, 1, 8, 6] },
        vars: { pass: '← suffix', prefix: '—', suffix: '12' },
      },
      {
        note: 'After index 1 sits 3 × 4 = 12.',
        cursors: { nums: { i: 1 } },
        marks: { nums: { 1: 'active' }, res: { 1: 'active' } },
        cells: { res: [1, 12, 8, 6] },
        vars: { pass: '← suffix', prefix: '—', suffix: '24' },
      },
      {
        note: 'After index 0 sits 2 × 3 × 4 = 24. Two passes, no division, no nested loop.',
        cursors: { nums: { i: 0 } },
        marks: { nums: { 0: 'active' }, res: { '0-3': 'hit' } },
        cells: { res: [24, 12, 8, 6] },
        vars: { pass: '← suffix', prefix: '—', suffix: '24' },
      },
    ],
    result: 'return [24, 12, 8, 6]',
  },

  /* ── 16. Longest Consecutive Sequence ───────────────────────────── */
  16: {
    input: 'nums = [100, 4, 200, 1, 3, 2]',
    lanes: [{ id: 'nums', label: 'set', cells: [100, 4, 200, 1, 3, 2] }],
    vars: ['is a start?', 'streak', 'longest'],
    steps: [
      {
        note: 'Is 99 in the set? No — so 100 begins a run. Is 101 there? No. The run is just itself.',
        cursors: { nums: { n: 0 } },
        marks: { nums: { 0: 'active' } },
        vars: { 'is a start?': 'yes', streak: '1', longest: '1' },
      },
      {
        note: 'Is 3 in the set? Yes — so 4 is in the *middle* of a run, not the start. Skip it entirely.',
        cursors: { nums: { n: 1 } },
        marks: { nums: { 1: 'bad', 4: 'window' } },
        vars: { 'is a start?': 'no — skip', streak: '—', longest: '1' },
      },
      {
        note: '199 is absent, so 200 starts a run of one.',
        cursors: { nums: { n: 2 } },
        marks: { nums: { 2: 'active' } },
        vars: { 'is a start?': 'yes', streak: '1', longest: '1' },
      },
      {
        note: '0 is absent, so 1 is a real start. Now walk up: 2 ✓, 3 ✓, 4 ✓, 5 ✗ — a run of four.',
        cursors: { nums: { n: 3 } },
        marks: { nums: { 1: 'hit', 3: 'hit', 4: 'hit', 5: 'hit' } },
        vars: { 'is a start?': 'yes', streak: '4', longest: '4' },
      },
      {
        note: '2 is in the set, so 3 is mid-run. Skip.',
        cursors: { nums: { n: 4 } },
        marks: { nums: { 4: 'bad' } },
        vars: { 'is a start?': 'no — skip', streak: '—', longest: '4' },
      },
      {
        note: '1 is in the set, so 2 is mid-run. Skip. Only starts ever walk, so each number is visited at most twice — that is the O(N).',
        cursors: { nums: { n: 5 } },
        marks: { nums: { 5: 'bad' } },
        vars: { 'is a start?': 'no — skip', streak: '—', longest: '4' },
      },
    ],
    result: 'return 4   // the run 1, 2, 3, 4',
  },

  /* ── 17. Encode and Decode Strings ──────────────────────────────── */
  17: {
    input: 'decode("2#hi3#abc")',
    lanes: [
      {
        id: 'enc',
        label: 'encoded',
        cells: ['2', '#', 'h', 'i', '3', '#', 'a', 'b', 'c'],
        indices: true,
      },
    ],
    vars: ['length', 'result'],
    steps: [
      {
        note: 'Read up to the first #. That is the length, 2 — a count, not a delimiter, so the payload can contain anything at all.',
        cursors: { enc: { i: 0 } },
        marks: { enc: { 0: 'active', 1: 'window' } },
        vars: { length: '2', result: '[]' },
      },
      {
        note: 'Take exactly 2 characters after the #. No scanning for a separator, so "#" inside a string is harmless.',
        cursors: { enc: { i: 2 } },
        marks: { enc: { 0: 'done', 1: 'done', '2-3': 'hit' } },
        vars: { length: '2', result: '["hi"]' },
      },
      {
        note: 'Jump straight to index 4 and read the next length, 3.',
        cursors: { enc: { i: 4 } },
        marks: { enc: { '0-3': 'done', 4: 'active', 5: 'window' } },
        vars: { length: '3', result: '["hi"]' },
      },
      {
        note: 'Take 3 characters. The cursor is now past the end, so decoding is finished.',
        cursors: { enc: { i: 6 } },
        marks: { enc: { '0-5': 'done', '6-8': 'hit' } },
        vars: { length: '3', result: '["hi", "abc"]' },
      },
    ],
    result: 'return ["hi", "abc"]',
  },

  /* ── 18. Best Time to Buy and Sell Stock ────────────────────────── */
  18: {
    input: 'prices = [7, 1, 5, 3, 6, 4]',
    lanes: [{ id: 'p', label: 'prices', cells: [7, 1, 5, 3, 6, 4], indices: true }],
    vars: ['cheapest so far', 'best profit'],
    steps: [
      {
        note: 'First day. It is the cheapest thing seen, so it becomes the buy candidate.',
        cursors: { p: { i: 0 } },
        marks: { p: { 0: 'active' } },
        vars: { 'cheapest so far': '7', 'best profit': '0' },
      },
      {
        note: '1 is cheaper than 7. Buy here instead — you can never do better by having bought earlier at a higher price.',
        cursors: { p: { i: 1 } },
        marks: { p: { 0: 'done', 1: 'active' } },
        vars: { 'cheapest so far': '1', 'best profit': '0' },
      },
      {
        note: 'Not cheaper, so treat it as a sell day: 5 − 1 = 4.',
        cursors: { p: { i: 2 } },
        marks: { p: { 1: 'window', 2: 'active' } },
        vars: { 'cheapest so far': '1', 'best profit': '4' },
      },
      {
        note: '3 − 1 = 2, worse than 4. Keep the 4.',
        cursors: { p: { i: 3 } },
        marks: { p: { 1: 'window', 3: 'active' } },
        vars: { 'cheapest so far': '1', 'best profit': '4' },
      },
      {
        note: '6 − 1 = 5. New best.',
        cursors: { p: { i: 4 } },
        marks: { p: { 1: 'hit', 4: 'hit' } },
        vars: { 'cheapest so far': '1', 'best profit': '5' },
      },
      {
        note: '4 − 1 = 3, worse. One pass, and the buy day is always behind the sell day by construction.',
        cursors: { p: { i: 5 } },
        marks: { p: { 1: 'hit', 4: 'hit', 5: 'active' } },
        vars: { 'cheapest so far': '1', 'best profit': '5' },
      },
    ],
    result: 'return 5   // buy at 1, sell at 6',
  },

  /* ── 19. Maximum Subarray (Kadane) ──────────────────────────────── */
  19: {
    input: 'nums = [-2, 1, -3, 4, -1, 2]',
    lanes: [{ id: 'nums', label: 'nums', cells: [-2, 1, -3, 4, -1, 2], indices: true }],
    vars: ['running sum', 'best'],
    steps: [
      {
        note: 'Start the running sum at 0 and add −2.',
        cursors: { nums: { i: 0 } },
        marks: { nums: { 0: 'active' } },
        vars: { 'running sum': '−2', best: '−2' },
      },
      {
        note: 'The running sum is negative, so drop it. A negative prefix can only ever hurt whatever comes next — that is the whole of Kadane.',
        cursors: { nums: { i: 1 } },
        marks: { nums: { 0: 'bad', 1: 'active' } },
        vars: { 'running sum': '1', best: '1' },
      },
      {
        note: '1 + (−3) = −2. Still the best is 1.',
        cursors: { nums: { i: 2 } },
        marks: { nums: { '1-2': 'window' } },
        vars: { 'running sum': '−2', best: '1' },
      },
      {
        note: 'Negative again — drop it and start fresh at 4.',
        cursors: { nums: { i: 3 } },
        marks: { nums: { '1-2': 'bad', 3: 'active' } },
        vars: { 'running sum': '4', best: '4' },
      },
      {
        note: '4 + (−1) = 3. Positive, so it is worth carrying forward even though it dipped.',
        cursors: { nums: { i: 4 } },
        marks: { nums: { '3-4': 'window' } },
        vars: { 'running sum': '3', best: '4' },
      },
      {
        note: '3 + 2 = 5. New best — the subarray [4, −1, 2].',
        cursors: { nums: { i: 5 } },
        marks: { nums: { '3-5': 'hit' } },
        vars: { 'running sum': '5', best: '5' },
      },
    ],
    result: 'return 5   // the subarray [4, −1, 2]',
  },
};
