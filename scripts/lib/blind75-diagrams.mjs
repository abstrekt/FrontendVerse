/**
 * The Blind 75 pattern diagrams.
 *
 * One entry per blueprint. Each `build()` returns `{ width, height, cells }`.
 *
 * Design rules every diagram here follows:
 *
 * - **Show the data, not a flowchart of the data.** "Walk the array once" is
 *   abstract; `[2, 7, 11, 15]` with a pointer under index 1 and the map
 *   filling up beside it is not. Every diagram traces one real, tiny input.
 * - **Naive beside the technique.** A pattern is defined by the cost it
 *   removes, so that cost stays on screen next to the fix.
 * - **One canvas width (820px) and a height that fits a reading column.** The
 *   previous diagrams were ~1600px wide and scaled down to 5px text in the
 *   article; at 820 the labels land close to their authored size.
 * - **One meaning per colour.** Red is the cost being removed, green the win,
 *   amber the invariant worth memorising, indigo the mechanism, blue an aside.
 */

import { C, box, text, panel, arrow, cells, pill, circle, rule } from './drawio-builder.mjs';

import { W, title, takeaway, legend, pointer } from './diagram-furniture.mjs';

/* ══════════════════════════════════════════════════════════════════
   1 — Arrays & Hashing
   ══════════════════════════════════════════════════════════════════ */

function arraysAndHashing() {
  const o = [];
  const H = 606;

  o.push(title('Two Sum — nums = [2, 7, 11, 15], target = 9', 'The same question asked two ways'));

  /* Brute force */
  o.push(panel(24, 70, 372, 210, 'Compare every pair', 'bad').xml);
  o.push(pill(318, 76, 62, 20, 'O(N²)', 'bad').xml);

  const bf = cells(56, 128, ['2', '7', '11', '15'], { cw: 44, ch: 38, indices: true });
  o.push(bf.xml);
  for (let j = 1; j < 4; j += 1) {
    o.push(
      arrow(bf.centerX(0), 124, bf.centerX(j), 124, {
        color: C.bad,
        width: 1.2,
        curved: true,
        points: [[(bf.centerX(0) + bf.centerX(j)) / 2, 108 - j * 7]],
      }).xml
    );
  }
  o.push(
    text(56, 186, 320, 16, '…then start again from index 1, then 2, then 3', {
      size: 11,
      italic: true,
      color: C.muted,
    }).xml
  );
  o.push(
    box(56, 210, 308, 52, '6 comparisons for 4 items.\n1,000 items → 499,500 comparisons.', 'bad', {
      align: 'left',
      padLeft: 12,
      size: 12,
    }).xml
  );

  /* Hash map */
  o.push(panel(424, 70, 372, 210, 'Remember what you have already seen', 'ok').xml);
  o.push(pill(724, 76, 62, 20, 'O(N)', 'ok').xml);

  const hm = cells(456, 128, ['2', '7', '11', '15'], { cw: 44, ch: 38, indices: true });
  o.push(hm.xml);
  o.push(
    arrow(hm.centerX(0) - 20, 120, hm.centerX(3) + 20, 120, {
      color: C.ok,
      width: 1.6,
      label: 'one pass, left to right',
      labelBg: C.surface,
    }).xml
  );
  o.push(
    text(456, 186, 320, 16, 'no inner loop — the map does the searching', {
      size: 11,
      italic: true,
      color: C.muted,
    }).xml
  );
  o.push(
    box(456, 210, 308, 52, 'Each item is read once.\n1,000 items → 1,000 lookups.', 'ok', {
      align: 'left',
      padLeft: 12,
      size: 12,
    }).xml
  );

  /* The trace */
  o.push(rule(24, 300, W - 48).xml);
  o.push(text(24, 312, 400, 20, 'The single pass, step by step', { size: 14, bold: true, color: C.fg }).xml);

  const ty = 344;
  const colW = 176;

  // i = 0
  o.push(box(24, ty, colW, 26, 'i = 0', 'plain', { size: 12, bold: true, rx: 8 }).xml);
  o.push(box(24, ty + 32, colW, 28, 'curr = 2', 'sunken', { mono: true, size: 12, rx: 8 }).xml);
  o.push(box(24, ty + 64, colW, 28, 'need = 9 − 2 = 7', 'accent', { mono: true, size: 12, rx: 8 }).xml);
  o.push(box(24, ty + 96, colW, 28, 'map has 7?  no', 'plain', { size: 11, rx: 8 }).xml);
  o.push(box(24, ty + 128, colW, 28, 'map.set(2, 0)', 'sunken', { mono: true, size: 11, rx: 8 }).xml);

  // i = 1
  o.push(box(224, ty, colW, 26, 'i = 1', 'ok', { size: 12, bold: true, rx: 8 }).xml);
  o.push(box(224, ty + 32, colW, 28, 'curr = 7', 'sunken', { mono: true, size: 12, rx: 8 }).xml);
  o.push(box(224, ty + 64, colW, 28, 'need = 9 − 7 = 2', 'accent', { mono: true, size: 12, rx: 8 }).xml);
  o.push(box(224, ty + 96, colW, 28, 'map has 2?  yes → 0', 'ok', { size: 11, rx: 8 }).xml);
  o.push(box(224, ty + 128, colW, 28, 'return [0, 1]', 'ok', { mono: true, size: 11, bold: true, rx: 8 }).xml);

  o.push(arrow(206, ty + 78, 220, ty + 78, { color: C.line, width: 1.4 }).xml);

  /* The map filling up */
  o.push(text(424, ty - 22, 372, 16, 'the map as it fills', { size: 11, italic: true, color: C.muted }).xml);
  o.push(box(424, ty, 372, 40, '{ }', 'sunken', { mono: true, size: 13 }).xml);
  o.push(text(424, ty + 42, 372, 14, 'start empty', { size: 10, color: C.muted, align: 'center' }).xml);
  o.push(box(424, ty + 60, 372, 40, '{ 2 → 0 }', 'sunken', { mono: true, size: 13 }).xml);
  o.push(
    text(424, ty + 102, 372, 14, 'value → the index it was found at', {
      size: 10,
      color: C.muted,
      align: 'center',
    }).xml
  );
  o.push(
    box(424, ty + 120, 372, 36, '7 needs 2 — and 2 is already in the map', 'ok', {
      size: 12,
      bold: true,
    }).xml
  );

  o.push(
    takeaway(
      H - 88,
      '**The trade:** one map buys O(1) lookup. Reach for it the moment the question is *“have I seen this before?”*, *“find the pair that makes X”*, or *“how often does each appear?”*'
    )
  );
  o.push(
    legend(24, H - 24, [
      ['bad', 'the cost removed'],
      ['ok', 'the pattern'],
      ['accent', 'the mechanism'],
      ['warn', 'memorise this'],
    ])
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   2 — Two Pointers & Sliding Window
   ══════════════════════════════════════════════════════════════════ */

function twoPointersSlidingWindow() {
  const o = [];
  const H = 700;

  o.push(title('Two Pointers & Sliding Window', 'Two ways to avoid the nested loop'));

  /* ── Converging pointers ── */
  o.push(panel(24, 70, W - 48, 246, 'Converging pointers — sorted input', 'accent').xml);
  o.push(pill(700, 76, 84, 20, 'sorted only', 'accent').xml);
  o.push(
    text(44, 104, 400, 16, 'arr = [1, 3, 4, 6, 8, 11]   ·   target = 10', {
      size: 12,
      mono: true,
      color: C.fg,
    }).xml
  );

  const cp = cells(44, 132, ['1', '3', '4', '6', '8', '11'], { cw: 52, ch: 40, indices: true });
  o.push(cp.xml);
  o.push(pointer(cp.centerX(0), 190, 'left', 'accent'));
  o.push(pointer(cp.centerX(5), 190, 'right', 'accent'));
  o.push(
    box(400, 132, 174, 40, '1 + 11 = 12', 'sunken', { mono: true, size: 13 }).xml
  );
  o.push(
    text(400, 176, 174, 16, 'too big → move right in', { size: 11, color: C.muted, align: 'center' }).xml
  );

  const rules = [
    ['sum < target', 'left++', 'need a bigger number', 'info'],
    ['sum > target', 'right--', 'need a smaller number', 'warn'],
    ['sum === target', 'done', 'the answer', 'ok'],
  ];
  rules.forEach(([cond, act, why, t], i) => {
    const y = 128 + i * 50;
    o.push(box(596, y, 100, 28, cond, t, { mono: true, size: 11, rx: 8 }).xml);
    o.push(arrow(700, y + 14, 712, y + 14, { color: C.line, width: 1.3 }).xml);
    o.push(box(716, y, 68, 28, act, t, { mono: true, size: 11, bold: true, rx: 8 }).xml);
    o.push(text(596, y + 28, 190, 16, why, { size: 10, color: C.muted }).xml);
  });

  o.push(
    box(44, 244, 530, 56,
      'Every move permanently rules out one end of the array. Six items are decided in five steps instead of fifteen pair checks.',
      'accent', { align: 'left', padLeft: 12, size: 12 }).xml
  );

  /* ── Sliding window ── */
  o.push(panel(24, 334, W - 48, 268, 'Sliding window — longest run with no repeat', 'ok').xml);
  o.push(pill(694, 340, 90, 20, 'any input', 'ok').xml);
  o.push(
    text(44, 368, 400, 16, 's = "a b c a b c b b"', { size: 12, mono: true, color: C.fg }).xml
  );

  const frames = [
    {
      y: 394,
      caption: 'Expand right while the window stays valid.',
      marks: [0, 1, 2],
      note: 'window "abc" — length 3',
      t: 'ok',
    },
    {
      y: 466,
      caption: 'right hits a repeat of "a" — the window is now invalid.',
      marks: [0, 1, 2, 3],
      bad: [0, 3],
      note: 'two "a"s inside the window',
      t: 'bad',
    },
    {
      y: 538,
      caption: 'Contract from the left until it is valid again.',
      marks: [1, 2, 3],
      note: 'window "bca" — still length 3',
      t: 'ok',
    },
  ];

  frames.forEach((f) => {
    const letters = ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'];
    const row = cells(
      44,
      f.y,
      letters.map((ch, i) => {
        const inWindow = f.marks.includes(i);
        const isBad = f.bad?.includes(i);
        if (isBad) return { text: ch, tone: 'bad', bold: true };
        if (inWindow) return { text: ch, tone: f.t === 'bad' ? 'warn' : 'ok', bold: true };
        return { text: ch, tone: 'sunken' };
      }),
      { cw: 38, ch: 34 }
    );
    o.push(row.xml);
    o.push(
      text(392, f.y - 2, 200, 18, f.note, {
        size: 11,
        mono: true,
        color: f.t === 'bad' ? C.bad : C.ok,
        bold: true,
      }).xml
    );
    o.push(text(392, f.y + 16, 392, 18, f.caption, { size: 11, color: C.muted }).xml);
  });

  o.push(
    takeaway(
      H - 84,
      '**The shape is always the same:** grow `right` to take more in, shrink `left` until the window is legal again, and record the best size at every legal moment.'
    )
  );
  o.push(
    legend(24, H - 22, [
      ['ok', 'valid window'],
      ['bad', 'what broke it'],
      ['accent', 'converging pointers'],
      ['warn', 'memorise this'],
    ])
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   3 — Linked Lists
   ══════════════════════════════════════════════════════════════════ */

function linkedLists() {
  const o = [];
  const H = 700;

  o.push(title('Linked Lists', 'Two moves that cover most list questions'));

  /* ── Reversal ── */
  o.push(panel(24, 70, W - 48, 300, 'In-place reversal — the three-pointer dance', 'accent').xml);

  const nodeAt = (x, y, v, t = 'plain') => box(x, y, 52, 38, v, t, { mono: true, size: 13, rx: 10 });

  const framesY = [116, 214];
  const frameDefs = [
    {
      y: 116,
      label: 'Before — `prev` trails, `curr` is where you are',
      arrows: [[1, 2], [2, 3]],
      highlight: null,
    },
    {
      y: 214,
      label: 'After one turn — `curr.next` now points backwards',
      arrows: [[2, 1], [2, 3]],
      highlight: 2,
    },
  ];

  frameDefs.forEach((f, fi) => {
    const xs = [44, 130, 216, 302];
    const vals = ['null', '1', '2', '3'];
    const ids = [];
    vals.forEach((v, i) => {
      const isPrev = i === 1;
      const isCurr = i === 2;
      const t = isCurr ? 'accent' : isPrev ? 'sunken' : 'plain';
      const cell = nodeAt(xs[i], f.y, v, v === 'null' ? 'ghost' : t);
      o.push(cell.xml);
      ids.push(cell.id);
    });

    // Pointer captions
    o.push(text(xs[1] - 8, f.y - 22, 68, 16, 'prev', { align: 'center', size: 11, bold: true, color: C.muted }).xml);
    o.push(text(xs[2] - 8, f.y - 22, 68, 16, 'curr', { align: 'center', size: 11, bold: true, color: C.accent }).xml);
    o.push(text(xs[3] - 8, f.y - 22, 68, 16, 'next', { align: 'center', size: 11, bold: true, color: C.ok }).xml);

    // Links
    if (fi === 0) {
      o.push(arrow(xs[1] + 52, f.y + 19, xs[2], f.y + 19, { color: C.line, width: 1.6 }).xml);
      o.push(arrow(xs[2] + 52, f.y + 19, xs[3], f.y + 19, { color: C.ok, width: 1.6 }).xml);
    } else {
      o.push(arrow(xs[2], f.y + 19, xs[1] + 52, f.y + 19, { color: C.accent, width: 2 }).xml);
      o.push(
        text(xs[1] + 10, f.y - 40, 120, 14, 'rewired backwards', {
          size: 10,
          color: C.accent,
          align: 'center',
          bold: true,
        }).xml
      );
      o.push(arrow(xs[2] + 52, f.y + 19, xs[3], f.y + 19, { color: C.ok, width: 1.6, dashed: true }).xml);
    }

    o.push(text(44, f.y + 50, 340, 16, f.label, { size: 11, color: C.muted }).xml);
  });

  const steps = [
    ['1', '`const next = curr.next`', 'Save the rest of the list first.', 'ok'],
    ['2', '`curr.next = prev`', 'Flip this one arrow.', 'accent'],
    ['3', '`prev = curr; curr = next`', 'Shuffle both pointers forward.', 'plain'],
  ];
  steps.forEach(([n, code, why, t], i) => {
    const y = 116 + i * 62;
    o.push(pill(430, y, 22, 22, n, t).xml);
    o.push(box(462, y - 4, 316, 30, code, t, { mono: true, size: 12, align: 'left', padLeft: 10, rx: 8 }).xml);
    o.push(text(462, y + 28, 316, 16, why, { size: 11, color: C.muted }).xml);
  });

  o.push(
    box(430, 306, 348, 46,
      '**Order matters.** Overwrite `curr.next` before saving it and the rest of the list is gone.',
      'bad', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(44, 306, 366, 46,
      'Three pointers, one arrow flipped per turn, no extra memory.',
      'accent', { align: 'left', padLeft: 12, size: 12 }).xml
  );

  /* ── Floyd ── */
  o.push(panel(24, 390, W - 48, 218, 'Fast & slow pointers — Floyd’s tortoise and hare', 'ok').xml);

  // A rho-shaped list: a tail that runs into a loop.
  const tailXs = [56, 116, 176];
  tailXs.forEach((x, i) => {
    o.push(circle(x, 452, 40, String(i + 1), 'plain', { size: 12 }).xml);
    if (i > 0) o.push(arrow(tailXs[i - 1] + 40, 472, x, 472, { color: C.line, width: 1.5 }).xml);
  });
  const loop = [
    [246, 452, '4'],
    [316, 424, '5'],
    [372, 472, '6'],
    [300, 512, '7'],
  ];
  loop.forEach(([x, y, v], i) => {
    o.push(circle(x, y, 40, v, i === 1 ? 'ok' : 'plain', { size: 12 }).xml);
  });
  o.push(arrow(216, 472, 246, 472, { color: C.line, width: 1.5 }).xml);
  o.push(arrow(282, 458, 316, 444, { color: C.line, width: 1.5 }).xml);
  o.push(arrow(352, 450, 386, 472, { color: C.line, width: 1.5 }).xml);
  o.push(arrow(372, 506, 340, 522, { color: C.line, width: 1.5 }).xml);
  o.push(arrow(300, 520, 266, 490, { color: C.line, width: 1.5 }).xml);

  o.push(text(56, 418, 180, 16, 'slow +1 · fast +2', { size: 11, bold: true, color: C.muted }).xml);
  o.push(
    text(246, 552, 180, 16, 'they must meet inside the loop', {
      size: 11,
      color: C.ok,
      bold: true,
    }).xml
  );

  const floyd = [
    ['Find the middle', 'When `fast` reaches the end, `slow` is standing on it.', 'accent'],
    ['Detect a cycle', 'If a loop exists, `fast` laps `slow` — they collide.', 'ok'],
    ['No cycle', '`fast` or `fast.next` hits `null` and you are done.', 'plain'],
  ];
  floyd.forEach(([head, why, t], i) => {
    const y = 424 + i * 56;
    o.push(box(444, y, 334, 30, head, t, { size: 12, bold: true, align: 'left', padLeft: 12, rx: 8 }).xml);
    o.push(text(444, y + 30, 334, 18, why, { size: 11, color: C.muted }).xml);
  });

  o.push(
    takeaway(
      H - 78,
      '**The sentinel trick:** when the head itself might be removed or replaced, start from `const dummy = { next: head }` and return `dummy.next`. It deletes most of the null-checking.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   4 — Trees & BST
   ══════════════════════════════════════════════════════════════════ */

function treesAndBst() {
  const o = [];
  const H = 690;

  o.push(title('Trees & Binary Search Trees', 'One shape, four ways to walk it'));

  /* ── The tree and its three depth-first orders ── */
  o.push(panel(24, 70, 396, 344, 'The same tree, three depth-first orders', 'accent').xml);

  const D = 40;
  const tree = {
    n8: [186, 104, '8'],
    n3: [112, 160, '3'],
    n10: [260, 160, '10'],
    n1: [62, 216, '1'],
    n6: [162, 216, '6'],
    n14: [310, 216, '14'],
  };
  for (const [, [x, y, v]] of Object.entries(tree)) {
    o.push(circle(x, y, D, v, 'plain', { size: 13 }).xml);
  }
  const link = (a, b) => {
    const [ax, ay] = tree[a];
    const [bx, by] = tree[b];
    const dir = bx > ax ? 1 : -1;
    o.push(
      arrow(ax + D / 2 + dir * 13, ay + D - 7, bx + D / 2 - dir * 13, by + 5, {
        color: C.line,
        width: 1.4,
        endArrow: 'none',
      }).xml
    );
  };
  link('n8', 'n3');
  link('n8', 'n10');
  link('n3', 'n1');
  link('n3', 'n6');
  link('n10', 'n14');

  const orders = [
    ['Pre-order', 'visit → left → right', '8 3 1 6 10 14', 'copy or serialise', 'accent'],
    ['In-order', 'left → visit → right', '1 3 6 8 10 14', 'sorted, on a BST', 'ok'],
    ['Post-order', 'left → right → visit', '1 6 3 14 10 8', 'bottom-up totals', 'info'],
  ];
  orders.forEach(([name, shape, seq, use, t], i) => {
    const y = 274 + i * 42;
    o.push(
      box(44, y, 356, 22, `${name} — ${shape}`, t, {
        size: 11,
        bold: true,
        align: 'left',
        padLeft: 10,
        rx: 7,
      }).xml
    );
    o.push(text(54, y + 22, 200, 16, seq, { size: 12, mono: true, bold: true, color: C.fg }).xml);
    o.push(text(230, y + 22, 162, 16, use, { size: 10, color: C.muted, align: 'right' }).xml);
  });

  /* ── Breadth-first ── */
  o.push(panel(436, 70, 360, 196, 'Breadth-first — one floor at a time', 'warn').xml);
  const levels = [['8'], ['3', '10'], ['1', '6', '14']];
  levels.forEach((lvl, i) => {
    const y = 106 + i * 34;
    o.push(text(452, y, 56, 26, `level ${i}`, { size: 10, color: C.muted, valign: 'middle' }).xml);
    lvl.forEach((v, j) => {
      o.push(box(510 + j * 44, y, 38, 26, v, 'warn', { mono: true, size: 12, rx: 7 }).xml);
    });
  });
  o.push(
    box(452, 214, 330, 34, 'snapshot `levelSize = queue.length` before each level', 'sunken', {
      size: 10,
      align: 'left',
      padLeft: 10,
      rx: 7,
    }).xml
  );

  /* ── The BST invariant ── */
  o.push(panel(436, 282, 360, 132, 'The BST rule — search is binary search', 'ok').xml);
  o.push(
    box(452, 312, 330, 28, 'left values  <  node  <  right values', 'ok', {
      size: 12,
      mono: true,
      bold: true,
      rx: 8,
    }).xml
  );
  [
    ['target < node', 'go left — the right half is gone'],
    ['target > node', 'go right — the left half is gone'],
    ['target = node', 'found'],
  ].forEach(([cond, act], i) => {
    const y = 348 + i * 21;
    o.push(text(452, y, 108, 18, cond, { size: 11, mono: true, color: C.fg }).xml);
    o.push(text(566, y, 216, 18, act, { size: 11, color: C.muted }).xml);
  });

  /* ── Trie ── */
  o.push(panel(24, 430, W - 48, 156, 'Prefix tree (Trie) — one node per letter', 'info').xml);

  o.push(box(52, 470, 54, 34, 'root', 'sunken', { size: 11, rx: 8 }).xml);
  const trie = [
    [146, 469, 'c', 'info'],
    [212, 469, 'a', 'info'],
    [278, 469, 't', 'ok'],
    [278, 525, 'r', 'info'],
    [344, 525, 's', 'ok'],
  ];
  trie.forEach(([x, y, v, t]) => o.push(circle(x, y, 36, v, t, { size: 13 }).xml));
  o.push(arrow(106, 487, 146, 487, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(182, 487, 212, 487, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(248, 487, 278, 487, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(240, 497, 278, 535, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(314, 543, 344, 543, { color: C.line, width: 1.4 }).xml);
  o.push(text(324, 470, 90, 34, '“cat”', { size: 12, color: C.ok, bold: true, valign: 'middle' }).xml);
  o.push(text(390, 526, 90, 34, '“cars”', { size: 12, color: C.ok, bold: true, valign: 'middle' }).xml);
  o.push(
    box(472, 468, 306, 76,
      'Words sharing a prefix share the path. A lookup costs O(length of the word) — the size of the dictionary never enters into it.',
      'info', { align: 'left', padLeft: 12, size: 12 }).xml
  );

  o.push(
    takeaway(
      H - 84,
      '**Why recursion feels free here:** every subtree is itself a tree. Solve it for one node and its two children and you have solved it for a million.'
    )
  );
  o.push(
    legend(24, H - 24, [
      ['accent', 'depth-first'],
      ['warn', 'breadth-first'],
      ['ok', 'BST / end of word'],
      ['info', 'trie'],
    ])
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   5 — Heap & Priority Queue
   ══════════════════════════════════════════════════════════════════ */

function heapPriorityQueue() {
  const o = [];
  const H = 600;

  o.push(title('Heap & Priority Queue', 'Triage, not a queue — the most urgent item is always on top'));

  /* ── Top-K ── */
  o.push(panel(24, 70, W - 48, 268, 'Top-K with a bounded min-heap — keep the 3 largest of a stream', 'accent').xml);
  o.push(pill(690, 76, 94, 20, 'O(N log K)', 'accent').xml);

  const stream = [5, 1, 9, 3, 8];
  const states = [
    { after: '5', heap: ['5'], evicted: null },
    { after: '1', heap: ['1', '5'], evicted: null },
    { after: '9', heap: ['1', '5', '9'], evicted: null },
    { after: '3', heap: ['3', '5', '9'], evicted: '1' },
    { after: '8', heap: ['5', '8', '9'], evicted: '3' },
  ];

  o.push(text(44, 106, 120, 18, 'stream', { size: 11, bold: true, color: C.muted }).xml);
  const sx = 128;
  stream.forEach((v, i) => {
    o.push(box(sx + i * 140, 102, 44, 30, String(v), 'sunken', { mono: true, size: 13, rx: 8 }).xml);
    if (i < stream.length - 1) {
      o.push(arrow(sx + i * 140 + 44, 117, sx + (i + 1) * 140, 117, { color: C.line, width: 1.3 }).xml);
    }
  });

  o.push(text(44, 176, 120, 18, 'heap (size ≤ 3)', { size: 11, bold: true, color: C.muted }).xml);
  states.forEach((s, i) => {
    const x = sx + i * 140;
    s.heap.forEach((v, j) => {
      o.push(
        box(x, 158 + j * 28, 44, 24, v, j === 0 ? 'accent' : 'sunken', {
          mono: true,
          size: 12,
          rx: 7,
        }).xml
      );
    });
    if (s.evicted) {
      o.push(
        box(x + 52, 158, 60, 24, `↑ ${s.evicted}`, 'bad', { mono: true, size: 11, rx: 7 }).xml
      );
      o.push(text(x + 52, 182, 76, 14, 'evicted', { size: 9, color: C.bad }).xml);
    }
  });
  o.push(text(44, 158, 76, 18, 'top →', { size: 10, color: C.accent, align: 'right' }).xml);

  o.push(
    box(44, 254, 360, 62,
      'The **smallest** is always on top, so the heap evicts exactly the item least likely to belong in the answer. Whatever survives is the top K.',
      'accent', { align: 'left', padLeft: 12, size: 12 }).xml
  );
  o.push(
    box(424, 254, 354, 62,
      'Sorting the whole stream is O(N log N) and throws away most of the work. Bounding the heap at K keeps each insert at log K.',
      'ok', { align: 'left', padLeft: 12, size: 12 }).xml
  );

  /* ── Dual heap median ── */
  o.push(panel(24, 358, W - 48, 168, 'Two heaps facing each other — the running median', 'ok').xml);

  o.push(box(56, 398, 250, 34, 'max-heap  ·  the smaller half', 'warn', { size: 12, bold: true, rx: 8 }).xml);
  const lowRow = cells(56, 440, ['1', '3', '5'], { cw: 56, ch: 34, tone: 'warn' });
  o.push(lowRow.xml);
  o.push(text(56, 478, 250, 16, 'largest of the small half on top →', { size: 10, color: C.muted }).xml);

  o.push(box(514, 398, 250, 34, 'min-heap  ·  the larger half', 'info', { size: 12, bold: true, rx: 8 }).xml);
  const highRow = cells(514, 440, ['8', '9', '12'], { cw: 56, ch: 34, tone: 'info' });
  o.push(highRow.xml);
  o.push(text(514, 478, 250, 16, '← smallest of the large half on top', { size: 10, color: C.muted, align: 'right' }).xml);

  o.push(box(336, 424, 148, 62, 'median\nlives here', 'ok', { size: 12, bold: true, rx: 10 }).xml);
  o.push(arrow(306, 455, 334, 455, { color: C.ok, width: 1.6 }).xml);
  o.push(arrow(514, 455, 486, 455, { color: C.ok, width: 1.6 }).xml);
  o.push(
    text(336, 490, 148, 16, 'sizes differ by ≤ 1', { size: 10, color: C.muted, align: 'center' }).xml
  );

  o.push(
    takeaway(
      H - 62,
      '**Reach for a heap when you need the extreme repeatedly, not the whole order.** Sorting answers a question you were not asked.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   6 — Dynamic Programming
   ══════════════════════════════════════════════════════════════════ */

function dynamicProgramming() {
  const o = [];
  const H = 648;

  o.push(title('Dynamic Programming', 'Never solve the same subproblem twice'));

  /* ── The recursion tree ── */
  o.push(panel(24, 70, 396, 296, 'fib(5) with no cache', 'bad').xml);
  o.push(pill(326, 76, 62, 20, 'O(2ⁿ)', 'bad').xml);

  const tnode = (x, y, v, t) => circle(x, y, 40, v, t, { size: 12 });
  const nodes = [
    [200, 108, '5', 'plain'],
    [130, 164, '4', 'plain'],
    [278, 164, '3', 'warn'],
    [80, 220, '3', 'warn'],
    [186, 220, '2', 'bad'],
    [246, 220, '2', 'bad'],
    [330, 220, '1', 'plain'],
    [44, 276, '2', 'bad'],
    [128, 276, '1', 'plain'],
  ];
  nodes.forEach(([x, y, v, t]) => o.push(tnode(x, y, v, t).xml));
  const links = [
    [200, 108, 130, 164],
    [200, 108, 278, 164],
    [130, 164, 80, 220],
    [130, 164, 186, 220],
    [278, 164, 246, 220],
    [278, 164, 330, 220],
    [80, 220, 44, 276],
    [80, 220, 128, 276],
  ];
  links.forEach(([ax, ay, bx, by]) => {
    o.push(
      arrow(ax + 20 + (bx > ax ? 10 : -10), ay + 36, bx + 20 + (bx > ax ? -10 : 10), by + 4, {
        color: C.line,
        width: 1.2,
        endArrow: 'none',
      }).xml
    );
  });

  o.push(text(44, 324, 356, 16, 'fib(3) computed twice · fib(2) three times', { size: 11, color: C.bad, bold: true }).xml);
  o.push(
    text(44, 342, 356, 16, 'fib(50) this way is ~1.2 billion calls', { size: 11, color: C.muted, italic: true }).xml
  );

  /* ── Tabulation ── */
  o.push(panel(436, 70, 360, 296, 'Fill a table once, left to right', 'ok').xml);
  o.push(pill(716, 76, 66, 20, 'O(n)', 'ok').xml);

  o.push(text(456, 108, 320, 16, 'dp[i] = dp[i − 1] + dp[i − 2]', { size: 12, mono: true, bold: true, color: C.fg }).xml);

  const dpRow = cells(456, 138, [
    { text: '0', tone: 'warn' },
    { text: '1', tone: 'warn' },
    { text: '1', tone: 'ok' },
    { text: '2', tone: 'ok' },
    { text: '3', tone: 'ok' },
    { text: '5', tone: 'ok', bold: true },
  ], { cw: 52, ch: 38, indices: true });
  o.push(dpRow.xml);
  o.push(
    text(456, 196, 320, 16, 'base cases fixed — then each cell only ever looks back', {
      size: 10,
      color: C.muted,
    }).xml
  );
  o.push(
    arrow(dpRow.centerX(5), 132, dpRow.centerX(3), 132, {
      color: C.ok,
      width: 1.4,
      curved: true,
      points: [[dpRow.centerX(4), 118]],
    }).xml
  );

  o.push(
    box(456, 222, 320, 54,
      'Because each cell only needs the last two, the whole array collapses to two variables — O(1) space.',
      'ok', { align: 'left', padLeft: 12, size: 12 }).xml
  );
  o.push(
    box(456, 288, 320, 62,
      '**Top-down** memoisation gets the same result: keep the recursion, add a cache, return early on a hit.',
      'accent', { align: 'left', padLeft: 12, size: 12 }).xml
  );

  /* ── The framework ── */
  o.push(panel(24, 384, W - 48, 178, 'The four questions, in this order', 'accent').xml);
  const framework = [
    ['1', 'State', 'What does `dp[i]` mean in one plain sentence?', '“fewest coins that make i”'],
    ['2', 'Base case', 'The smallest input you can answer outright.', '`dp[0] = 0`'],
    ['3', 'Recurrence', 'How `dp[i]` is built from earlier entries.', '`dp[i] = min(dp[i − c] + 1)`'],
    ['4', 'Order & space', 'Iterate so inputs exist before you need them.', 'keep 2 vars, not N'],
  ];
  framework.forEach(([n, name, q, eg], i) => {
    const y = 418 + i * 34;
    o.push(pill(44, y, 22, 22, n, 'accent').xml);
    o.push(text(76, y, 100, 22, name, { size: 12, bold: true, color: C.fg, valign: 'middle' }).xml);
    o.push(text(184, y, 330, 22, q, { size: 11, color: C.muted, valign: 'middle' }).xml);
    o.push(box(522, y, 256, 22, eg, 'sunken', { mono: true, size: 10, rx: 6 }).xml);
  });

  o.push(
    takeaway(
      H - 70,
      '**The tell:** a recursion that keeps asking the same question. If the tree repeats a node, cache it — exponential collapses to linear.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   7 — Intervals
   ══════════════════════════════════════════════════════════════════ */

function intervals() {
  const o = [];
  const H = 680;

  o.push(
    title('Intervals', 'Sort by start, and a meeting can only ever clash with the one before it')
  );

  /* ── The three cases, all on one shared time axis ──
     Drawing them against the same ruler is the point: "overlap" becomes
     something you can see rather than a word printed next to a box. */
  o.push(
    panel(24, 70, W - 48, 306, 'Two intervals, A starting first — only three things can happen', 'accent').xml
  );

  const AX = 170;
  const UNIT = 24;
  const at = (t) => AX + t * UNIT;
  const AXIS_TOP = 124;
  const AXIS_BOTTOM = 310;

  o.push(text(44, 104, 112, 14, 'time →', { size: 10, color: C.muted }).xml);
  for (let t = 0; t <= 12; t += 2) {
    o.push(
      arrow(at(t), AXIS_TOP, at(t), AXIS_BOTTOM, {
        color: C.line,
        width: 0.8,
        endArrow: 'none',
        dashed: true,
      }).xml
    );
    o.push(text(at(t) - 12, 104, 24, 14, String(t), { size: 9, color: C.muted, align: 'center' }).xml);
  }

  const cases = [
    { y: 132, name: 'Disjoint', a: [0, 4], b: [6, 11], cond: 'startB > endA', act: 'keep both', t: 'info' },
    { y: 192, name: 'Overlapping', a: [0, 6], b: [4, 11], cond: 'startB ≤ endA', act: 'merge into one', t: 'ok' },
    { y: 266, name: 'Contained', a: [0, 11], b: [3, 7], cond: 'endB ≤ endA', act: 'B is swallowed', t: 'warn' },
  ];

  cases.forEach((c) => {
    o.push(text(44, c.y, 118, 22, c.name, { size: 12, bold: true, color: C.fg, valign: 'middle' }).xml);
    o.push(
      box(at(c.a[0]), c.y, at(c.a[1]) - at(c.a[0]), 20, 'A', c.t, { mono: true, size: 11, bold: true, rx: 8 }).xml
    );
    o.push(
      box(at(c.b[0]), c.y + 24, at(c.b[1]) - at(c.b[0]), 20, 'B', 'sunken', { mono: true, size: 11, rx: 8 }).xml
    );
    o.push(text(at(12) + 18, c.y, 130, 20, c.cond, { size: 10, mono: true, color: C.fg, valign: 'middle' }).xml);
    o.push(text(at(12) + 18, c.y + 24, 150, 20, c.act, { size: 10, color: C.muted, valign: 'middle' }).xml);
  });

  // The shared slice, marked only on the middle case.
  o.push(
    box(at(4), 188, at(6) - at(4), 52, '', 'ghost', {
      stroke: C.ok,
      fill: 'none',
      dashed: true,
      strokeWidth: 1.4,
      rx: 6,
    }).xml
  );
  o.push(
    text(at(4) - 30, 242, 108, 14, 'the overlap', {
      size: 10,
      color: C.ok,
      bold: true,
      align: 'center',
    }).xml
  );

  o.push(
    box(44, 320, W - 88, 38,
      'Because A starts first, B can only begin **inside** A or **after** it. There is no third possibility — and that is the whole algorithm.',
      'accent', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* ── The sweep, on its own axis ── */
  o.push(panel(24, 394, W - 48, 210, 'The sweep — one pass, after sorting', 'ok').xml);

  const SX = 150;
  const SU = 30;
  const sat = (t) => SX + t * SU;

  o.push(text(44, 430, 96, 22, 'sorted input', { size: 11, bold: true, color: C.muted, valign: 'middle' }).xml);
  [[1, 3], [2, 6], [8, 10], [15, 18]].forEach(([a, b], i) => {
    // The first two overlap in time, so they are stacked to stay legible.
    const y = i === 1 ? 452 : 430;
    o.push(
      box(sat(a), y, sat(b) - sat(a), 20, `[${a},${b}]`, 'sunken', { mono: true, size: 10, rx: 7 }).xml
    );
  });

  o.push(text(44, 494, 96, 22, 'result', { size: 11, bold: true, color: C.muted, valign: 'middle' }).xml);
  [[1, 6], [8, 10], [15, 18]].forEach(([a, b]) => {
    o.push(
      box(sat(a), 494, sat(b) - sat(a), 20, `[${a},${b}]`, 'ok', {
        mono: true,
        size: 10,
        bold: true,
        rx: 7,
      }).xml
    );
  });
  o.push(arrow(sat(4), 474, sat(4), 490, { color: C.ok, width: 1.5 }).xml);
  o.push(text(sat(4) + 8, 474, 110, 16, 'merged', { size: 10, color: C.ok, bold: true }).xml);

  [
    ['1', 'Sort by start: `intervals.sort((a, b) => a[0] - b[0])`'],
    ['2', 'Seed the result with the first interval.'],
    ['3', 'For each next one: overlaps the last result? extend its end. Otherwise push it.'],
  ].forEach(([n, txt], i) => {
    const y = 526 + i * 24;
    o.push(pill(44, y, 20, 20, n, 'ok').xml);
    o.push(text(74, y, 700, 20, txt, { size: 11, color: C.muted, valign: 'middle' }).xml);
  });

  o.push(
    takeaway(
      H - 62,
      '**Sorting is the algorithm.** Unsorted, a new meeting could clash with anything — O(N²). Sorted, it can only clash with its immediate predecessor.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   8 — Graphs
   ══════════════════════════════════════════════════════════════════ */

function graphs() {
  const o = [];
  const H = 656;

  o.push(title('Graphs', 'A grid is a graph in disguise — every cell is a node with four neighbours'));

  /* ── Flood fill ── */
  o.push(panel(24, 70, 396, 300, 'Flood fill — counting islands', 'ok').xml);

  const grid = [
    ['1', '1', '0', '0'],
    ['1', '0', '0', '1'],
    ['0', '0', '1', '1'],
    ['0', '0', '0', '1'],
  ];
  const island = { 0: [0, 1], 1: [0], 2: [2, 3], 3: [3] };
  const islandOf = [
    [1, 1, 0, 0],
    [1, 0, 0, 2],
    [0, 0, 2, 2],
    [0, 0, 0, 2],
  ];
  void island;
  const gx = 48;
  const gy = 112;
  const cw = 46;
  grid.forEach((row, r) => {
    row.forEach((v, c) => {
      const id = islandOf[r][c];
      const t = id === 1 ? 'ok' : id === 2 ? 'info' : 'sunken';
      o.push(
        box(gx + c * (cw + 4), gy + r * (cw + 4), cw, cw, v, t, {
          mono: true,
          size: 14,
          bold: id > 0,
          rx: 8,
        }).xml
      );
    });
  });
  o.push(text(gx, gy + 4 * (cw + 4) + 6, 200, 16, '2 islands', { size: 12, bold: true, color: C.fg }).xml);

  const floodSteps = [
    ['1', 'Scan every cell.'],
    ['2', 'Hit unvisited land? `islands++`.'],
    ['3', 'Run `dfs` from it and sink everything connected.'],
    ['4', 'Sunken land is never counted twice.'],
  ];
  floodSteps.forEach(([n, txt], i) => {
    const y = 118 + i * 44;
    o.push(pill(258, y, 20, 20, n, 'ok').xml);
    o.push(text(288, y - 4, 120, 36, txt, { size: 11, color: C.muted }).xml);
  });
  o.push(
    box(48, 322, 356, 34, 'const DIRS = [[0,1],[1,0],[0,-1],[-1,0]]', 'sunken', {
      mono: true,
      size: 11,
      rx: 8,
    }).xml
  );

  /* ── BFS vs DFS ── */
  o.push(panel(436, 70, 360, 300, 'Which traversal, and why', 'accent').xml);

  o.push(box(456, 104, 320, 28, 'BFS — a queue', 'warn', { size: 12, bold: true, rx: 8, align: 'left', padLeft: 12 }).xml);
  // Concentric rings from a source.
  const ringCx = 520;
  const ringCy = 200;
  [[56, C.line], [38, C.warn], [20, C.warn]].forEach(([d, col], i) => {
    o.push(
      circle(ringCx - d / 2, ringCy - d / 2, d, i === 2 ? 'S' : '', 'ghost', {
        stroke: col,
        fill: 'none',
        dashed: i !== 2,
        size: 11,
        color: C.warn,
      }).xml
    );
  });
  o.push(text(456, 236, 128, 30, 'explores ring by ring', { size: 10, color: C.muted, align: 'center' }).xml);
  o.push(
    text(592, 148, 190, 60, 'Shortest path in an unweighted graph — the first time you reach a node is the shortest way there.', {
      size: 11,
      color: C.muted,
    }).xml
  );

  o.push(box(456, 268, 320, 28, 'DFS — recursion or a stack', 'accent', { size: 12, bold: true, rx: 8, align: 'left', padLeft: 12 }).xml);
  o.push(
    text(456, 300, 326, 56, 'Goes deep before wide. Connected components, cycle detection, flood fill — anything where reaching everything matters more than reaching it first.', {
      size: 11,
      color: C.muted,
    }).xml
  );

  /* ── Topological sort ── */
  o.push(panel(24, 388, W - 48, 182, 'Topological sort — resolving prerequisites', 'info').xml);

  const courses = [
    [60, 432, 'A', 0],
    [180, 432, 'B', 1],
    [300, 432, 'C', 1],
    [180, 502, 'D', 2],
  ];
  courses.forEach(([x, y, v, deg]) => {
    o.push(circle(x, y, 44, v, deg === 0 ? 'ok' : 'sunken', { size: 13 }).xml);
    o.push(
      text(x - 6, y + 46, 56, 14, `in-degree ${deg}`, { size: 9, color: C.muted, align: 'center' }).xml
    );
  });
  o.push(arrow(104, 454, 180, 454, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(224, 454, 300, 454, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(96, 466, 180, 510, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(300, 466, 224, 510, { color: C.line, width: 1.4 }).xml);

  const topo = [
    ['1', 'Count how many prerequisites each node has.'],
    ['2', 'Queue everything with **zero** — those can start now.'],
    ['3', 'Take one, decrement its neighbours, queue any that hit zero.'],
    ['4', 'Processed them all? No cycle. Stuck early? There is a cycle.'],
  ];
  topo.forEach(([n, txt], i) => {
    const y = 426 + i * 30;
    o.push(pill(390, y, 20, 20, n, 'info').xml);
    o.push(text(420, y, 360, 20, txt, { size: 11, color: C.muted, valign: 'middle' }).xml);
  });

  o.push(
    takeaway(
      H - 68,
      '**Mark visited the moment you enqueue, not when you dequeue.** Marking late lets the same node enter the queue several times and turns a linear traversal quadratic.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   9 — Matrix
   ══════════════════════════════════════════════════════════════════ */

function matrix() {
  const o = [];
  const H = 616;

  o.push(title('Matrix Manipulation', 'Two set-pieces worth knowing cold'));

  /* ── Rotate ── */
  o.push(panel(24, 70, W - 48, 262, 'Rotate 90° clockwise — transpose, then reverse each row', 'accent').xml);

  const drawGrid = (x, y, rows, toneFor) => {
    const size = 44;
    rows.forEach((row, r) => {
      row.forEach((v, c) => {
        o.push(
          box(x + c * (size + 4), y + r * (size + 4), size, size, String(v), toneFor(r, c, v), {
            mono: true,
            size: 14,
            rx: 8,
          }).xml
        );
      });
    });
    return { w: rows[0].length * (size + 4) - 4, h: rows.length * (size + 4) - 4 };
  };

  const start = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];
  const transposed = [
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
  ];
  const rotated = [
    [7, 4, 1],
    [8, 5, 2],
    [9, 6, 3],
  ];

  o.push(text(56, 108, 150, 16, 'original', { size: 11, bold: true, color: C.muted }).xml);
  drawGrid(56, 130, start, (r, c) => (r === c ? 'warn' : 'sunken'));

  o.push(text(268, 108, 200, 16, 'transpose — swap across the diagonal', { size: 11, bold: true, color: C.muted }).xml);
  drawGrid(268, 130, transposed, (r, c) => (r === c ? 'warn' : 'accent'));

  o.push(text(552, 108, 200, 16, 'reverse each row', { size: 11, bold: true, color: C.muted }).xml);
  drawGrid(552, 130, rotated, () => 'ok');

  o.push(arrow(216, 200, 262, 200, { color: C.line, width: 1.6, label: 'step 1', labelBg: C.surface }).xml);
  o.push(arrow(428, 200, 546, 200, { color: C.line, width: 1.6, label: 'step 2', labelBg: C.surface }).xml);

  o.push(
    box(56, 278, 342, 40, 'matrix[r][c] ⟷ matrix[c][r]  ·  in place, no copy', 'accent', {
      mono: true,
      size: 11,
      rx: 8,
    }).xml
  );
  o.push(
    box(418, 278, 346, 40, 'the diagonal never moves — that is why it works', 'warn', {
      size: 11,
      rx: 8,
    }).xml
  );

  /* ── Spiral ── */
  o.push(panel(24, 350, W - 48, 206, 'Spiral order — four walls closing in', 'info').xml);

  const spiral = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ];
  const ring = (r, c) => (r === 0 || r === 2 || c === 0 || c === 3 ? 'info' : 'sunken');
  drawGrid(56, 384, spiral, ring);

  o.push(
    text(56, 528, 240, 14, 'outer ring first, then tighten the walls', {
      size: 10,
      color: C.muted,
    }).xml
  );

  const walls = [
    ['walk right along `top`', 'then `top++`'],
    ['walk down along `right`', 'then `right--`'],
    ['walk left along `bottom`', 'then `bottom--`'],
    ['walk up along `left`', 'then `left++`'],
  ];
  walls.forEach(([move, after], i) => {
    const y = 388 + i * 32;
    o.push(box(300, y, 230, 24, move, 'info', { size: 11, align: 'left', padLeft: 10, rx: 7 }).xml);
    o.push(text(542, y, 220, 24, after, { size: 11, mono: true, color: C.muted, valign: 'middle' }).xml);
  });

  o.push(
    takeaway(
      H - 52,
      '**Stop when the walls cross.** `while (top <= bottom && left <= right)` — forgetting the second check re-walks the middle row of an odd-sized grid.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   10 — Bit Manipulation
   ══════════════════════════════════════════════════════════════════ */

function bitManipulation() {
  const o = [];
  const H = 648;

  o.push(title('Bit Manipulation', 'Three tricks that turn a loop into a single instruction'));

  const bits = (x, y, pattern, t, opts = {}) => {
    const row = cells(x, y, pattern.split('').map((b) => ({
      text: b,
      tone: b === '1' ? t : 'sunken',
      bold: b === '1',
    })), { cw: 30, ch: 30, gap: 3, size: 12 });
    o.push(row.xml);
    if (opts.label) {
      o.push(text(x - 96, y, 88, 30, opts.label, { size: 11, mono: true, color: C.fg, align: 'right', valign: 'middle' }).xml);
    }
    if (opts.note) {
      o.push(text(x + row.width + 12, y, 220, 30, opts.note, { size: 11, color: C.muted, valign: 'middle' }).xml);
    }
    return row;
  };

  /* ── XOR ── */
  o.push(panel(24, 70, W - 48, 212, 'XOR cancels pairs — finding the one unmatched number', 'accent').xml);
  o.push(pill(700, 76, 84, 20, 'O(1) space', 'accent').xml);

  o.push(text(140, 106, 300, 16, 'nums = [4, 1, 2, 1, 2]   →   answer 4', { size: 12, mono: true, color: C.fg }).xml);

  bits(140, 132, '0100', 'accent', { label: '4', note: 'the loner' });
  bits(140, 168, '0001', 'sunken', { label: '1 ^ 1', note: 'cancels to 0000' });
  bits(140, 204, '0010', 'sunken', { label: '2 ^ 2', note: 'cancels to 0000' });
  o.push(arrow(140, 240, 280, 240, { color: C.line, width: 1.2, endArrow: 'none' }).xml);
  bits(140, 248, '0100', 'ok', { label: 'result', note: '4 survives' });

  o.push(
    box(448, 132, 336, 60,
      '`x ^ x = 0`  and  `x ^ 0 = x`.\nXOR is order-independent, so every duplicate annihilates itself no matter where it sits.',
      'accent', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(448, 204, 336, 64,
      'That means one integer of memory replaces a whole hash map — and one pass replaces a sort.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* ── Kernighan ── */
  o.push(panel(24, 302, W - 48, 196, 'n & (n − 1) clears the lowest 1 — counting set bits', 'ok').xml);

  const steps = [
    ['n = 12', '1100', 'count 0'],
    ['n = 8', '1000', 'count 1'],
    ['n = 0', '0000', 'count 2 — done'],
  ];
  steps.forEach(([labelText, pattern, note], i) => {
    const y = 340 + i * 46;
    bits(160, y, pattern, i === 2 ? 'ok' : 'warn', { label: labelText, note });
    if (i < 2) {
      o.push(arrow(172, y + 32, 172, y + 44, { color: C.ok, width: 1.4 }).xml);
      o.push(
        text(184, y + 30, 140, 16, 'n &= n − 1', {
          size: 10,
          mono: true,
          color: C.ok,
          valign: 'middle',
        }).xml
      );
    }
  });

  o.push(
    box(448, 340, 336, 60,
      'Subtracting 1 flips the lowest `1` and fills the zeros below it. ANDing puts every one of those bits back to `0`.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(448, 412, 336, 60,
      'The loop runs once per **set bit**, not once per the 32 bits in the word.',
      'accent', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* ── Cheatsheet ── */
  o.push(panel(24, 512, W - 48, 74, 'Worth memorising', 'info').xml);
  const cheats = [
    ['`n & 1`', 'odd?'],
    ['`n >> 1`', 'halve'],
    ['`n & (1 << k)`', 'is bit k set?'],
    ['`n & -n`', 'lowest set bit'],
  ];
  cheats.forEach(([code, meaning], i) => {
    const x = 44 + i * 188;
    o.push(box(x, 546, 104, 24, code, 'info', { mono: true, size: 11, rx: 7 }).xml);
    o.push(text(x, 570, 168, 14, meaning, { size: 10, color: C.muted }).xml);
  });

  o.push(
    takeaway(
      H - 46,
      '**JavaScript caveat:** every bitwise operator truncates to 32 signed bits, and `>>` keeps the sign. Use `>>>` when you want the unsigned result.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════ */

export const DIAGRAMS = {
  arrays_and_hashing: {
    title: 'Arrays & Hashing — trade memory for instant lookup',
    build: arraysAndHashing,
  },
  two_pointers_sliding_window: {
    title: 'Two Pointers & Sliding Window — two ways to drop the nested loop',
    build: twoPointersSlidingWindow,
  },
  linked_lists: {
    title: 'Linked Lists — pointer rewiring and fast/slow traversal',
    build: linkedLists,
  },
  trees_and_bst: {
    title: 'Trees & BST — traversal orders and the search invariant',
    build: treesAndBst,
  },
  heap_priority_queue: {
    title: 'Heap & Priority Queue — bounded top-K and the dual-heap median',
    build: heapPriorityQueue,
  },
  dynamic_programming: {
    title: 'Dynamic Programming — from a repeating recursion tree to a table',
    build: dynamicProgramming,
  },
  intervals: {
    title: 'Intervals — sort by start, then sweep the timeline',
    build: intervals,
  },
  graphs: {
    title: 'Graphs — flood fill, BFS vs DFS, and topological order',
    build: graphs,
  },
  matrix: {
    title: 'Matrix — rotation by transpose and spiral traversal',
    build: matrix,
  },
  bit_manipulation: {
    title: 'Bit Manipulation — XOR cancellation and clearing the lowest bit',
    build: bitManipulation,
  },
};
