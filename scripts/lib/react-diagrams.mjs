/**
 * The React concept blueprints.
 *
 * One entry per idea, not one per learning: ~35 diagrams serve 105 items
 * across `react-guide`, `advanced-react`, `react-learnings` and
 * `react-mcq-questions`, because the same picture answers "why did this
 * re-render" whether it is asked as a guide chapter, an interview note or a
 * multiple-choice question. The per-item detail lives in that item's
 * steppable trace (see `react-traces.mjs`); this file draws the mechanism
 * the trace is an instance of.
 *
 * Design rules, inherited from `blind75-diagrams.mjs`:
 *
 * - **Show the real thing.** Not "React re-renders children" as a flowchart
 *   box, but an actual tree with one node lit and its sibling dashed out.
 * - **The cost stays on screen next to the fix.** Every React optimisation
 *   is defined by the work it removes; a diagram of only the fix teaches
 *   nothing about when to reach for it.
 * - **One canvas width (820px).** Wider and the labels scale down to
 *   unreadable in the reading column.
 * - **One meaning per colour.** Red is the wasted work, green the win,
 *   amber the invariant worth memorising, indigo the mechanism, blue an
 *   aside or a deferred path.
 *
 * Colours come only from `C` in `drawio-builder.mjs` — anything else ships
 * as a fixed value and stops following the app's theme, which the build
 * reports as `⚠ unmapped`.
 */

import { C, box, text, panel, arrow, cells, pill, circle } from './drawio-builder.mjs';

import { W, title, takeaway, legend } from './diagram-furniture.mjs';

/* ── Local helpers ────────────────────────────────────────────────
   React diagrams keep drawing the same three things: a component tree,
   a card of code, and a labelled step. These keep each build() to the
   part that is actually about the idea. ── */

/**
 * A component tree drawn as an indented outline.
 *
 * `rows` is `[{ label, depth, tone, note }]`. An indented tree costs a
 * fraction of the width of a node-and-edge drawing and keeps every label
 * horizontal, which matters when the whole canvas is 820px and half of it
 * is already spent on the "before" case.
 */
function compTree(x, y, rows, opts = {}) {
  const rowH = opts.rowH ?? 34;
  const indent = opts.indent ?? 24;
  const w = opts.w ?? 190;
  const out = [];

  rows.forEach((row, i) => {
    const ry = y + i * rowH;
    const rx = x + row.depth * indent;

    // The elbow from the parent's rail into this row.
    if (row.depth > 0) {
      const railX = x + (row.depth - 1) * indent + 12;
      out.push(
        arrow(railX, ry - rowH + 26, railX, ry + 14, {
          color: C.line,
          width: 1,
          endArrow: 'none',
        }).xml
      );
      out.push(
        arrow(railX, ry + 14, rx, ry + 14, { color: C.line, width: 1, endArrow: 'none' }).xml
      );
    }

    out.push(
      box(rx, ry, w - row.depth * indent, 28, row.label, row.tone ?? 'sunken', {
        mono: true,
        size: 12,
        rx: 8,
        align: 'left',
        padLeft: 10,
        dashed: row.dashed,
      }).xml
    );

    if (row.note) {
      out.push(
        text(x + w + 8, ry, opts.noteW ?? 150, 28, row.note, {
          size: 10,
          color: row.noteColor ?? C.muted,
        }).xml
      );
    }
  });

  return { xml: out.join(''), height: rows.length * rowH };
}

/** Monospace metrics, matching draw.io's own rendering closely enough. */
const CODE_LINE = 1.3;
const CODE_CHAR = 0.6;

/**
 * The height a code card needs for `content` at `w` pixels wide.
 *
 * Width matters: a `case "success": return { data, loading: false };` is
 * past the wrap point of a half-canvas card, and counting `\n` alone
 * under-measures it by a whole line — which is exactly how the last line
 * of a snippet ends up outside its box.
 */
function codeHeight(content, w, size = 11) {
  const perLine = Math.max(1, Math.floor((w - 18) / (size * CODE_CHAR)));
  const lines = content
    .split('\n')
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / perLine)), 0);
  return Math.ceil(lines * size * CODE_LINE) + 14;
}

/**
 * Protects the whitespace that carries meaning in a snippet.
 *
 * A label is rendered as HTML, which collapses a run of spaces to one — so
 * every line of a code card came out flush left and the nesting, which is
 * half of what the snippet is showing, disappeared. Leading indentation and
 * any run used to align a trailing comment become non-breaking spaces;
 * single spaces between words stay breakable so the card can still wrap.
 */
function indent(content) {
  return content
    .split('\n')
    .map((line) =>
      line
        .replace(/^ +/, (run) => '\u00A0'.repeat(run.length))
        .replace(/ {2,}/g, (run) => '\u00A0'.repeat(run.length))
    )
    .join('\n');
}

/**
 * A card of source, monospaced and left-aligned.
 *
 * `h` is a minimum, not a size: a card never renders shorter than its own
 * content, because a clipped final line of code is invisible in the export
 * and reads as a syntax error to whoever is looking at the diagram.
 */
function codeCard(x, y, w, h, content, t = 'sunken', opts = {}) {
  const size = opts.size ?? 11;
  return box(x, y, w, Math.max(h, codeHeight(content, w, size)), indent(content), t, {
    mono: true,
    size,
    align: 'left',
    valign: 'top',
    padLeft: 10,
    padTop: 8,
    rx: 8,
    dashed: opts.dashed,
  }).xml;
}

/** A left-to-right pipeline of pills with arrows between them. */
function pipeline(x, y, steps, opts = {}) {
  const pw = opts.pw ?? 116;
  const ph = opts.ph ?? 30;
  const gap = opts.gap ?? 26;
  const out = [];

  steps.forEach((step, i) => {
    const sx = x + i * (pw + gap);
    const s = typeof step === 'object' ? step : { label: step };
    out.push(pill(sx, y, pw, ph, s.label, s.tone ?? 'accent', { size: opts.size ?? 11 }).xml);
    if (i < steps.length - 1) {
      out.push(
        arrow(sx + pw, y + ph / 2, sx + pw + gap, y + ph / 2, {
          color: C.line,
          width: 1.4,
        }).xml
      );
    }
  });

  return { xml: out.join(''), width: steps.length * pw + (steps.length - 1) * gap, centerX: (i) => x + i * (pw + gap) + pw / 2 };
}

/** The side-by-side header for a "cost / fix" pair. */
function versus(y, leftTitle, rightTitle, h, leftTone = 'bad', rightTone = 'ok') {
  const half = (W - 48 - 16) / 2;
  return {
    xml:
      panel(24, y, half, h, leftTitle, leftTone).xml +
      panel(24 + half + 16, y, half, h, rightTitle, rightTone).xml,
    half,
    leftX: 24,
    rightX: 24 + half + 16,
  };
}

/* ══════════════════════════════════════════════════════════════════
   Elements → Fiber → DOM
   ══════════════════════════════════════════════════════════════════ */

function threeTrees() {
  const o = [];
  const H = 576;

  o.push(
    title(
      'Elements → Fiber → DOM: the three trees',
      'Three representations of one UI, each with a different job'
    )
  );

  const colW = 242;
  const xs = [24, 24 + colW + 15, 24 + (colW + 15) * 2];

  /* 1 — Elements */
  o.push(panel(xs[0], 70, colW, 250, '1 · Element tree', 'info').xml);
  o.push(
    codeCard(
      xs[0] + 14,
      104,
      colW - 28,
      92,
      '{\n  type: List,\n  props: { items },\n  key: null\n}',
      'sunken'
    )
  );
  o.push(
    box(
      xs[0] + 14,
      206,
      colW - 28,
      100,
      '**Plain objects.** Thrown away and rebuilt on *every* render — creating them is cheap.\n\nThis is what JSX compiles to.',
      'info',
      { align: 'left', padLeft: 10, size: 11 }
    ).xml
  );

  /* 2 — Fiber */
  o.push(panel(xs[1], 70, colW, 250, '2 · Fiber tree', 'accent').xml);
  o.push(
    codeCard(
      xs[1] + 14,
      104,
      colW - 28,
      92,
      '{\n  stateNode, memoizedState,\n  child, sibling, return,\n  alternate, flags\n}',
      'sunken'
    )
  );
  o.push(
    box(
      xs[1] + 14,
      206,
      colW - 28,
      100,
      '**Persistent.** Survives renders and holds your state, your hooks and the work still to do.\n\nA linked list, not a call stack — so React can pause.',
      'accent',
      { align: 'left', padLeft: 10, size: 11 }
    ).xml
  );

  /* 3 — DOM */
  o.push(panel(xs[2], 70, colW, 250, '3 · Host tree (DOM)', 'ok').xml);
  o.push(
    codeCard(xs[2] + 14, 104, colW - 28, 92, '<ul>\n  <li>Ada</li>\n  <li>Grace</li>\n</ul>', 'sunken')
  );
  o.push(
    box(
      xs[2] + 14,
      206,
      colW - 28,
      100,
      '**Real nodes.** The only tree the browser paints, and the expensive one to touch.\n\nMutated only in the commit phase.',
      'ok',
      { align: 'left', padLeft: 10, size: 11 }
    ).xml
  );

  o.push(
    arrow(xs[0] + colW, 150, xs[1], 150, { color: C.accent, width: 1.6, label: 'reconcile' }).xml
  );
  o.push(arrow(xs[1] + colW, 150, xs[2], 150, { color: C.ok, width: 1.6, label: 'commit' }).xml);

  /* Why the middle tree exists */
  o.push(panel(24, 336, W - 48, 156, 'Why the middle tree exists', 'warn').xml);

  o.push(
    box(
      44,
      372,
      352,
      54,
      '**Without fibers** (the old stack reconciler) rendering was one recursive call. Once it started it ran to the end — a 3,000-row list froze the tab.',
      'bad',
      { align: 'left', padLeft: 12, size: 11 }
    ).xml
  );
  o.push(
    box(
      424,
      372,
      354,
      54,
      '**With fibers** the work is a list of units React owns. It can do some, yield to a click, and resume — or throw the half-done tree away.',
      'ok',
      { align: 'left', padLeft: 12, size: 11 }
    ).xml
  );

  o.push(
    text(
      44,
      436,
      734,
      40,
      'Two fiber trees exist at once: **current** (on screen) and **work-in-progress** (being built). `alternate` links each node to its twin, and committing is a pointer swap — which is why a render that is thrown away costs nothing on screen.',
      { size: 11, color: C.fg }
    ).xml
  );

  o.push(takeaway(504, 'State lives on the fiber, not in your component. That is why a component function can run twice and still see one state.'));

  o.push(legend(24, H - 22, [['info', 'element'], ['accent', 'fiber'], ['ok', 'DOM'], ['bad', 'the old cost']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Render → Commit → Effects
   ══════════════════════════════════════════════════════════════════ */

function renderCommitEffects() {
  const o = [];
  const H = 560;

  o.push(
    title('Render → Commit → Paint → Effects', 'Where your code runs, and what the user can see when it does')
  );

  /* The pipeline */
  const p = pipeline(38, 84, [
    { label: 'render', tone: 'accent' },
    { label: 'commit DOM', tone: 'accent' },
    { label: 'useLayoutEffect', tone: 'warn' },
    { label: 'paint', tone: 'ok' },
    { label: 'useEffect', tone: 'info' },
  ], { pw: 128, gap: 26 });
  o.push(p.xml);

  /* What each phase may do */
  const notes = [
    ['Your component function body runs.\nMust be **pure** — no DOM reads, no\nmutations, no fetches.', 'accent'],
    ['React mutates the real DOM.\nRefs are attached here.\nNothing is on screen yet.', 'accent'],
    ['Runs **before paint**. Measure and\nre-set layout here and the user\nnever sees the first position.', 'warn'],
    ['The browser draws.\nEverything above this line is\nblocking it.', 'ok'],
    ['Runs **after paint**. Fetches,\nsubscriptions, logging — anything\nthe user need not wait for.', 'info'],
  ];
  notes.forEach(([content, tone], i) => {
    o.push(box(38 + i * 154, 132, 138, 92, content, tone, { align: 'left', padLeft: 9, size: 10 }).xml);
  });

  /* The blocking line */
  o.push(
    arrow(38, 244, W - 38, 244, {
      color: C.bad,
      width: 1.4,
      dashed: true,
      endArrow: 'none',
    }).xml
  );
  o.push(
    text(38, 248, 400, 16, 'everything left of "paint" blocks the pixels', {
      size: 10,
      italic: true,
      color: C.bad,
    }).xml
  );

  /* The flicker case */
  const v = versus(278, 'useEffect — the user sees the wrong frame', 'useLayoutEffect — the user never does', 172);
  o.push(v.xml);

  o.push(
    box(v.leftX + 16, 314, v.half - 32, 40, 'render → commit → **paint (wrong position)** → effect → paint again', 'bad', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );
  o.push(
    box(v.leftX + 16, 362, v.half - 32, 66, 'A tooltip mounted at 0,0 and then moved in `useEffect` is painted at 0,0 first. One frame of visible jump.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  o.push(
    box(v.rightX + 16, 314, v.half - 32, 40, 'render → commit → **layout effect (move it)** → paint once', 'ok', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );
  o.push(
    box(v.rightX + 16, 362, v.half - 32, 66, 'Correct position in the first painted frame — paid for by blocking the browser, so use it only when a measurement decides the layout.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  o.push(takeaway(456, 'Rendering is not painting. A component can render ten times and the user never sees a frame — the cost you can see is the commit.'));

  o.push(legend(24, H - 22, [['accent', 'React work'], ['warn', 'blocks paint'], ['ok', 'painted'], ['info', 'after paint']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Effect dependencies & cleanup
   ══════════════════════════════════════════════════════════════════ */

function effectDepsCleanup() {
  const o = [];
  const H = 616;

  o.push(title('useEffect: dependencies and cleanup', 'The cleanup runs before the next effect, not only on unmount'));

  /* The three dep shapes */
  o.push(panel(24, 70, W - 48, 148, 'The dependency array picks one of three behaviours', 'accent').xml);

  const shapes = [
    ['`useEffect(fn)`', 'no array', 'Runs after **every** render.\nUsually a bug.', 'bad'],
    ['`useEffect(fn, [])`', 'empty array', 'Runs **once** after mount.\nCleanup runs on unmount.', 'ok'],
    ['`useEffect(fn, [a, b])`', 'watched values', 'Re-runs when `a` or `b` change\nby `Object.is`.', 'accent'],
  ];
  shapes.forEach(([sig, sub, body, tone], i) => {
    const x = 44 + i * 248;
    o.push(box(x, 106, 228, 28, sig, tone, { mono: true, size: 11, rx: 8 }).xml);
    o.push(text(x, 136, 228, 14, sub, { size: 10, color: C.muted }).xml);
    o.push(box(x, 152, 228, 52, body, 'sunken', { align: 'left', padLeft: 10, size: 11 }).xml);
  });

  /* Cleanup ordering */
  o.push(panel(24, 234, W - 48, 246, 'Cleanup order over a value change — `[roomId]` goes "general" → "music"', 'warn').xml);

  const lanes = [
    ['mount', ['connect("general")'], 'ok'],
    ['roomId → "music"', ['disconnect("general")', 'connect("music")'], 'warn'],
    ['unmount', ['disconnect("music")'], 'bad'],
  ];

  let ly = 274;
  lanes.forEach(([when, calls, tone]) => {
    o.push(text(44, ly, 150, 28, when, { size: 11, bold: true, color: C.fg }).xml);
    calls.forEach((call, j) => {
      o.push(box(200 + j * 238, ly, 226, 28, call, tone, { mono: true, size: 11, rx: 8 }).xml);
      if (j > 0) {
        o.push(arrow(200 + j * 238 - 12, ly + 14, 200 + j * 238, ly + 14, { color: C.line, width: 1.2 }).xml);
      }
    });
    ly += 44;
  });

  o.push(
    box(44, ly + 4, W - 88, 62,
      '**The old cleanup runs first.** That is what makes an effect safe to re-run: subscribe/unsubscribe, connect/disconnect and add/removeEventListener always pair up, so a changed dependency can never leave two live subscriptions behind.',
      'warn', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* The reference trap */
  o.push(panel(24, 492, W - 48, 66, 'The trap: a dependency that is a new value every render', 'bad').xml);
  o.push(
    box(44, 520, 354, 30, '`useEffect(fn, [{ id }])` — new object, runs every time', 'bad', {
      mono: true,
      size: 11,
      rx: 8,
    }).xml
  );
  o.push(
    box(424, 520, 354, 30, '`useEffect(fn, [id])` — a primitive, compares by value', 'ok', {
      mono: true,
      size: 11,
      rx: 8,
    }).xml
  );

  o.push(legend(24, H - 22, [['ok', 'setup'], ['warn', 'teardown then setup'], ['bad', 'the bug']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Reconciliation & keys
   ══════════════════════════════════════════════════════════════════ */

function reconciliationKeys() {
  const o = [];
  const H = 612;

  o.push(title('Reconciliation: diff by position, then by type', 'And what `key` changes about it'));

  /* The rule */
  o.push(panel(24, 70, W - 48, 100, 'The heuristic — O(n), not a real tree diff', 'accent').xml);
  const rules = [
    ['same position, same type', 'keep the fiber, keep the state, update props', 'ok'],
    ['same position, different type', 'unmount the whole subtree, mount a new one', 'bad'],
    ['different `key`', 'treated as a different element — state is discarded', 'warn'],
  ];
  rules.forEach(([lhs, rhs, tone], i) => {
    o.push(box(44, 104 + i * 22, 236, 20, lhs, tone, { size: 10, rx: 6 }).xml);
    o.push(text(292, 104 + i * 22, 486, 20, rhs, { size: 11, color: C.fg }).xml);
  });

  /* Index keys on a prepend */
  o.push(panel(24, 186, W - 48, 250, 'Removing the first row of a list keyed by index', 'bad').xml);

  o.push(text(44, 220, 120, 18, 'before', { size: 11, bold: true, color: C.muted }).xml);
  const before = cells(160, 214, [
    { text: 'Ada' },
    { text: 'Grace' },
    { text: 'Linus' },
  ], { cw: 118, ch: 32 });
  o.push(before.xml);
  ['key=0', 'key=1', 'key=2'].forEach((k, i) => {
    o.push(text(before.left(i), 248, 118, 14, k, { align: 'center', size: 10, mono: true, color: C.muted }).xml);
  });
  o.push(text(160, 266, 360, 16, 'each row owns an uncontrolled <input> with text in it', { size: 10, italic: true, color: C.muted }).xml);

  o.push(arrow(410, 288, 410, 308, { color: C.bad, width: 1.6, label: 'remove "Ada"' }).xml);

  o.push(text(44, 322, 120, 18, 'after', { size: 11, bold: true, color: C.muted }).xml);
  const after = cells(160, 316, [
    { text: 'Grace', tone: 'bad' },
    { text: 'Linus', tone: 'bad' },
  ], { cw: 118, ch: 32 });
  o.push(after.xml);
  ['key=0', 'key=1'].forEach((k, i) => {
    o.push(text(after.left(i), 350, 118, 14, k, { align: 'center', size: 10, mono: true, color: C.bad }).xml);
  });

  o.push(
    box(410, 316, 368, 74,
      'Position 0 still says `key=0` and still says `<Row>`, so React **reuses** the fiber: it changes the label prop and keeps everything else. Ada\'s typed text is now sitting in Grace\'s row.',
      'bad', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    text(160, 398, 600, 16, 'The DOM is not "wrong" — it is exactly what you asked for. The key said these are the same row.', {
      size: 10,
      italic: true,
      color: C.muted,
    }).xml
  );

  /* The fix + the other use of key */
  const v = versus(452, 'A stable id fixes it', '`key` as a deliberate state reset', 96);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 486, v.half - 32, 52, 'items.map(i =>\n  <Row key={i.id} … />)', 'ok'));
  o.push(codeCard(v.rightX + 16, 486, v.half - 32, 52, '<Form key={userId} />\n// switch user → fresh form state', 'accent'));

  o.push(takeaway(H - 76, 'A key is an identity claim, not a loop counter. Index keys are safe only for a list that never reorders, filters or grows from the front.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   One-way data flow
   ══════════════════════════════════════════════════════════════════ */

function oneWayDataflow() {
  const o = [];
  const H = 470;

  o.push(title('One-way data flow', 'Data falls down the tree; events climb back up as calls'));

  o.push(panel(24, 70, W - 48, 258, 'State lives at the lowest common owner of everyone who needs it', 'accent').xml);

  const tree = compTree(70, 108, [
    { label: '<App>', depth: 0, tone: 'accent', note: 'owns  filter' },
    { label: '<Toolbar>', depth: 1, tone: 'sunken', note: 'reads  filter' },
    { label: '<SearchBox>', depth: 2, tone: 'warn', note: 'calls  onChange' },
    { label: '<Results>', depth: 1, tone: 'sunken', note: 'reads  filter' },
  ], { w: 200, noteW: 130 });
  o.push(tree.xml);

  /* Down */
  o.push(
    arrow(420, 126, 420, 210, {
      color: C.accent,
      width: 2,
      label: 'props  ↓',
      labelBg: C.surface,
    }).xml
  );
  o.push(
    box(444, 120, 330, 46, '**Down: props.** A child receives a value it cannot change. Reading it is all it can do.', 'accent', {
      align: 'left',
      padLeft: 12,
      size: 11,
    }).xml
  );

  /* Up */
  o.push(
    arrow(420, 296, 420, 224, {
      color: C.warn,
      width: 2,
      label: 'events  ↑',
      labelBg: C.surface,
    }).xml
  );
  o.push(
    box(444, 252, 330, 60, '**Up: callbacks.** The child does not set state; it reports an event. The owner decides what that means.', 'warn', {
      align: 'left',
      padLeft: 12,
      size: 11,
    }).xml
  );

  o.push(
    box(70, 262, 330, 50, 'Move state *up* only as far as the lowest node that contains every reader. Higher than that and you re-render half the app for nothing.', 'sunken', {
      align: 'left',
      padLeft: 12,
      size: 11,
    }).xml
  );

  o.push(takeaway(346, 'Because data only ever flows one way, "who could have changed this?" has exactly one answer: the component that owns the state.'));

  // `legend` only has swatches for the five accent tones, so "reader" —
  // which is drawn in the neutral sunken tone — is named in the note above
  // rather than given a white dot nobody can see.
  o.push(legend(24, H - 22, [['accent', 'owns the state'], ['warn', 'reports an event']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   What actually triggers a re-render
   ══════════════════════════════════════════════════════════════════ */

function rerenderTriggers() {
  const o = [];
  const H = 596;

  o.push(title('What actually triggers a re-render', 'Three causes — and "my props changed" is not one of them'));

  /* The three causes */
  o.push(panel(24, 70, W - 48, 118, 'The complete list', 'accent').xml);
  const causes = [
    ['1 · its own state changed', '`setState` with a value `Object.is` says is different'],
    ['2 · its parent re-rendered', 'and did not bail out — this is the one that surprises people'],
    ['3 · a context it reads changed', 'the provider\'s `value` is a new reference'],
  ];
  causes.forEach(([lhs, rhs], i) => {
    o.push(box(44, 104 + i * 26, 246, 24, lhs, 'accent', { size: 11, rx: 7 }).xml);
    o.push(text(302, 104 + i * 26, 476, 24, rhs, { size: 11, color: C.fg }).xml);
  });

  /* The myth */
  const v = versus(204, 'The myth: "props changed, so it re-rendered"', 'What actually happens', 212);
  o.push(v.xml);

  o.push(
    box(v.leftX + 16, 240, v.half - 32, 46, 'A component with **no props at all** still re-renders when its parent does. Props are not the trigger.', 'bad', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );
  const mythTree = compTree(v.leftX + 16, 296, [
    { label: '<Page>', depth: 0, tone: 'accent', note: 'setState' },
    { label: '<Sidebar/>', depth: 1, tone: 'bad', note: 'no props — re-renders' },
    { label: '<Logo/>', depth: 2, tone: 'bad', note: 're-renders' },
  ], { w: 150, noteW: 152, rowH: 32 });
  o.push(mythTree.xml);

  o.push(
    box(v.rightX + 16, 240, v.half - 32, 46, 'React re-renders the **whole subtree** below the state that changed, then diffs the result. Props only matter to `memo`.', 'ok', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );
  const realTree = compTree(v.rightX + 16, 296, [
    { label: '<Page>', depth: 0, tone: 'accent', note: 'setState' },
    { label: 'memo(<Sidebar/>)', depth: 1, tone: 'ok', note: 'props equal → bail out' },
    { label: '<Logo/>', depth: 2, tone: 'ok', note: 'never reached' },
  ], { w: 150, noteW: 152, rowH: 32 });
  o.push(realTree.xml);

  /* What does NOT trigger */
  o.push(panel(24, 432, W - 48, 96, 'What does *not* cause a re-render', 'info').xml);
  const nots = [
    'mutating a ref (`ref.current = x`)',
    'mutating state in place (`arr.push(x)`)',
    'setting state to the same value',
    'changing a plain module variable',
  ];
  nots.forEach((n, i) => {
    o.push(box(44 + (i % 2) * 378, 466 + Math.floor(i / 2) * 30, 362, 26, n, 'info', {
      size: 11,
      align: 'left',
      padLeft: 10,
      rx: 7,
    }).xml
    );
  });

  o.push(legend(24, H - 22, [['accent', 'the trigger'], ['bad', 'wasted render'], ['ok', 'bailed out'], ['info', 'no effect']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Hook slots
   ══════════════════════════════════════════════════════════════════ */

function hookSlots() {
  const o = [];
  const H = 566;

  o.push(title('Hooks are positional slots', 'Why the rules of hooks are not a style guide'));

  o.push(panel(24, 70, W - 48, 172, 'React stores hook state in call order on the fiber, not by name', 'accent').xml);

  o.push(codeCard(44, 106, 300, 104, 'function Profile() {\n  const [name, setName] = useState("");\n  const [age,  setAge ] = useState(0);\n  useEffect(fn, [name]);\n}', 'sunken'));

  const slots = [
    ['0', 'useState', '""'],
    ['1', 'useState', '0'],
    ['2', 'useEffect', '[name]'],
  ];
  o.push(text(368, 106, 410, 16, 'fiber.memoizedState  —  a linked list', { size: 10, color: C.muted, mono: true }).xml);
  slots.forEach(([i, hook, value], n) => {
    const y = 126 + n * 30;
    o.push(box(368, y, 40, 26, i, 'accent', { mono: true, size: 11, rx: 7 }).xml);
    o.push(box(414, y, 150, 26, hook, 'sunken', { mono: true, size: 11, rx: 7 }).xml);
    o.push(box(570, y, 208, 26, value, 'sunken', { mono: true, size: 11, rx: 7, align: 'left', padLeft: 10 }).xml);
    if (n > 0) {
      o.push(arrow(388, y - 4, 388, y, { color: C.line, width: 1.2 }).xml);
    }
  });
  o.push(text(368, 216, 410, 16, 'There is no name here — only position.', { size: 10, italic: true, color: C.muted }).xml);

  /* The break */
  const v = versus(258, 'A conditional hook shifts every slot after it', 'Move the condition inside', 200);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 292, v.half - 32, 62, 'if (show) {\n  const [a] = useState(1);   // slot 0 …or not\n}\nconst [b] = useState(2);     // slot 0 or 1?', 'bad'));
  o.push(
    box(v.leftX + 16, 386, v.half - 32, 64,
      'Render 1 with `show` true: `b` is slot 1. Render 2 with `show` false: `b` reads **slot 0** — `a`\'s value. React sees the count change and throws "rendered fewer hooks than expected".',
      'bad', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(codeCard(v.rightX + 16, 292, v.half - 32, 62, 'const [a] = useState(1);     // always slot 0\nconst [b] = useState(2);     // always slot 1\nuseEffect(() => {\n  if (show) { … }            // branch in here\n}, [show]);'));
  o.push(
    box(v.rightX + 16, 386, v.half - 32, 64,
      'The call order is now identical on every render. The branch still happens — it just happens **inside** the hook, where the slot count cannot see it.',
      'ok', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(takeaway(470, 'The rule is "same hooks, same order, every render". Loops, conditions, early returns and nested functions all break it; a custom hook does not, because it is inlined into the same call order.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Stale closures
   ══════════════════════════════════════════════════════════════════ */

function staleClosure() {
  const o = [];
  const H = 580;

  o.push(title('The stale closure', 'Every render is a separate function call with its own frozen variables'));

  o.push(panel(24, 70, W - 48, 196, 'One component, three renders, three different `count` variables', 'accent').xml);

  const renders = [
    ['render 1', '0', 'sunken'],
    ['render 2', '1', 'sunken'],
    ['render 3', '2', 'accent'],
  ];
  renders.forEach(([label, value, tone], i) => {
    const x = 44 + i * 248;
    o.push(box(x, 104, 228, 24, label, tone, { size: 11, rx: 7, bold: true }).xml);
    o.push(codeCard(x, 134, 228, 62, `function Counter() {\n  const count = ${value};\n  …\n}`, 'sunken'));
    o.push(box(x, 204, 228, 26, `the closure captured  count = ${value}`, tone === 'accent' ? 'accent' : 'sunken', {
      size: 10,
      rx: 7,
    }).xml);
  });
  o.push(text(44, 236, 734, 18, 'Nothing "updates" count. Each render creates a brand-new variable, and any function defined in that render sees only that one, forever.', {
    size: 11,
    color: C.fg,
  }).xml);

  /* The bug */
  const v = versus(282, 'An interval set up once, capturing render 1', 'The two escapes', 212);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 316, v.half - 32, 74, 'useEffect(() => {\n  const id = setInterval(() => {\n    setCount(count + 1);   // count is always 0\n  }, 1000);\n  return () => clearInterval(id);\n}, []);                    // ← set up once', 'bad'));
  o.push(
    box(v.leftX + 16, 424, v.half - 32, 62,
      'The empty array means the effect runs in render 1 and never again, so the callback keeps render 1\'s `count = 0`. It sets 1, then 1, then 1 forever.',
      'bad', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(codeCard(v.rightX + 16, 316, v.half - 32, 74, '// 1 · updater — never reads the closure\nsetCount(c => c + 1);\n\n// 2 · a ref — one mutable box, shared\n//     by every render\ncountRef.current += 1;'));
  o.push(
    box(v.rightX + 16, 424, v.half - 32, 62,
      'The updater form asks React for the latest value instead of remembering one. A ref works too, but it is invisible to rendering — use it only when the value is not displayed.',
      'ok', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(takeaway(508, 'A stale closure is never a React bug — it is JavaScript working correctly. The dependency array is the list of captured values you promise are still current.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Batching & the update queue
   ══════════════════════════════════════════════════════════════════ */

function batchingUpdates() {
  const o = [];
  const H = 552;

  o.push(title('Batching and the update queue', '`setState` schedules; it does not assign'));

  const v = versus(70, 'Three calls with the value form', 'Three calls with the updater form', 224);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 104, v.half - 32, 58, '// count is 0 in this render\nsetCount(count + 1);\nsetCount(count + 1);\nsetCount(count + 1);', 'bad'));

  const q1 = ['set 1', 'set 1', 'set 1'];
  q1.forEach((q, i) => {
    o.push(box(v.leftX + 16 + i * 120, 172, 108, 28, q, 'bad', { mono: true, size: 11, rx: 8 }).xml);
  });
  o.push(text(v.leftX + 16, 204, 340, 16, 'queue — every entry read the same frozen count', { size: 10, italic: true, color: C.muted }).xml);
  o.push(box(v.leftX + 16, 224, v.half - 32, 30, 'one re-render  ·  count = 1', 'bad', { size: 12, bold: true, rx: 8 }).xml);
  o.push(
    box(v.leftX + 16, 262, v.half - 32, 24, 'Three calls, one render, and two of them did nothing.', 'sunken', { size: 11 }).xml
  );

  o.push(codeCard(v.rightX + 16, 104, v.half - 32, 58, '// ask for the latest, do not capture\nsetCount(c => c + 1);\nsetCount(c => c + 1);\nsetCount(c => c + 1);', 'ok'));

  const q2 = ['0 → 1', '1 → 2', '2 → 3'];
  q2.forEach((q, i) => {
    o.push(box(v.rightX + 16 + i * 120, 172, 108, 28, q, 'ok', { mono: true, size: 11, rx: 8 }).xml);
    if (i > 0) {
      o.push(arrow(v.rightX + 16 + i * 120 - 12, 186, v.rightX + 16 + i * 120, 186, { color: C.ok, width: 1.2 }).xml);
    }
  });
  o.push(text(v.rightX + 16, 204, 340, 16, 'queue — each function receives the previous result', { size: 10, italic: true, color: C.muted }).xml);
  o.push(box(v.rightX + 16, 224, v.half - 32, 30, 'one re-render  ·  count = 3', 'ok', { size: 12, bold: true, rx: 8 }).xml);
  o.push(
    box(v.rightX + 16, 262, v.half - 32, 24, 'Still one render — batching is not the problem, capturing was.', 'sunken', { size: 11 }).xml
  );

  /* Where batching applies */
  o.push(panel(24, 312, W - 48, 152, 'React 18 batches everywhere — that changed', 'accent').xml);

  o.push(box(44, 348, 362, 44, '**React 17 and earlier:** only inside React event handlers. A `setTimeout` or a `.then()` re-rendered once *per* call.', 'bad', {
    align: 'left',
    padLeft: 12,
    size: 11,
  }).xml);
  o.push(box(416, 348, 362, 44, '**React 18 (automatic batching):** timers, promises and native handlers batch too. Fewer renders, same result.', 'ok', {
    align: 'left',
    padLeft: 12,
    size: 11,
  }).xml);

  o.push(box(44, 402, W - 88, 44, '`flushSync(() => setX(1))` opts one update out and re-renders synchronously — for the rare case where you must read the DOM before the next line runs. It costs you the batch.', 'warn', {
    align: 'left',
    padLeft: 12,
    size: 11,
  }).xml);

  o.push(takeaway(476, 'State is not a variable you assign — it is a request. Between the call and the next render, `count` is still the old number.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   memo, useMemo, useCallback — the reference trap
   ══════════════════════════════════════════════════════════════════ */

function memoReferenceTrap() {
  const o = [];
  const H = 670;

  o.push(title('React.memo and the reference trap', 'Memoisation compares by identity, and every render makes new objects'));

  /* The comparison */
  o.push(panel(24, 70, W - 48, 128, '`memo` runs a shallow `Object.is` over every prop', 'accent').xml);

  const props = [
    ['title="Inbox"', 'string', 'equal every render', 'ok'],
    ['count={3}', 'number', 'equal every render', 'ok'],
    ['style={{ top: 0 }}', 'new object', '**never** equal', 'bad'],
    ['onSelect={() => …}', 'new function', '**never** equal', 'bad'],
  ];
  props.forEach(([prop, kind, verdict, tone], i) => {
    const y = 106 + i * 22;
    o.push(box(44, y, 246, 20, prop, tone, { mono: true, size: 10, rx: 6 }).xml);
    o.push(text(300, y, 120, 20, kind, { size: 10, color: C.muted }).xml);
    o.push(text(420, y, 358, 20, verdict, { size: 10, color: tone === 'ok' ? C.ok : C.bad }).xml);
  });

  /* Broken vs fixed */
  const v = versus(214, 'memo defeated by one prop', 'memo actually working', 238);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 248, v.half - 32, 76, 'function Page() {\n  const [q, setQ] = useState("");\n  return <List\n    items={items.filter(f)}   // new array\n    onPick={x => open(x)} />;  // new fn\n}', 'bad'));
  o.push(
    box(v.leftX + 16, 356, v.half - 32, 92,
      'Typing one character re-renders `Page`, which builds a new array and a new function, so `memo(List)` compares two objects that are never `Object.is` equal and re-renders anyway.\n\n**You pay for the comparison and get nothing.**',
      'bad', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(codeCard(v.rightX + 16, 248, v.half - 32, 76, 'const shown = useMemo(\n  () => items.filter(f), [items]);\nconst onPick = useCallback(\n  x => open(x), []);\nreturn <List items={shown} onPick={onPick} />;'));
  o.push(
    box(v.rightX + 16, 356, v.half - 32, 92,
      'Both props keep the *same reference* until `items` changes, so the shallow compare succeeds and `List` — plus its whole subtree — is skipped.\n\n**All three have to agree, or none of them help.**',
      'ok', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  /* When it costs more than it saves */
  o.push(panel(24, 466, W - 48, 130, 'When memoising is the slower option', 'warn').xml);

  const costs = [
    ['the comparison is not free', '`memo` walks every prop on every render; for a component that renders three spans, that is the expensive half'],
    ['useMemo caches forever-cheap work', '`useMemo(() => a + b, [a, b])` costs a dependency compare and an array allocation to avoid an addition'],
    ['memory is held until unmount', 'every cached value keeps its inputs alive — a memoised list of 10,000 rows keeps two copies'],
  ];
  costs.forEach(([lhs, rhs], i) => {
    const y = 500 + i * 30;
    o.push(box(44, y, 234, 26, lhs, 'warn', { size: 10, rx: 7 }).xml);
    o.push(text(290, y, 488, 26, rhs, { size: 10, color: C.fg }).xml);
  });

  o.push(takeaway(610, 'Reach for memo when a heavy subtree re-renders with unchanged props — measure first. Composition (passing children through) usually beats all three of these and costs nothing.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Composition beats memoisation
   ══════════════════════════════════════════════════════════════════ */

function compositionOverMemo() {
  const o = [];
  const H = 620;

  o.push(title('Children as props: composition instead of memo', 'An element created in the parent above cannot be re-created by state below'));

  const v = versus(70, 'State wrapped around the tree', 'State pushed into its own component', 250);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 104, v.half - 32, 78, 'function App() {\n  const [open, setOpen] = useState(false);\n  return (\n    <div>\n      <Modal open={open} />\n      <VerySlowChart />   {/* re-renders */}\n    </div>);\n}', 'bad'));

  const badTree = compTree(v.leftX + 16, 194, [
    { label: 'App', depth: 0, tone: 'accent', note: 'setOpen' },
    { label: 'Modal', depth: 1, tone: 'bad' },
    { label: 'VerySlowChart', depth: 1, tone: 'bad', note: 're-renders' },
  ], { w: 170, noteW: 120, rowH: 30 });
  o.push(badTree.xml);
  o.push(text(v.leftX + 16, 288, v.half - 32, 28, 'Every toggle re-runs App, so a fresh <VerySlowChart/> element is created and the chart re-renders.', { size: 10, color: C.bad }).xml);

  o.push(codeCard(v.rightX + 16, 104, v.half - 32, 78, 'function App() {\n  return (\n    <ModalHost>            {/* owns open */}\n      <VerySlowChart />    {/* made HERE */}\n    </ModalHost>);\n}'));

  const okTree = compTree(v.rightX + 16, 194, [
    { label: 'App', depth: 0, tone: 'sunken', note: 'no state' },
    { label: 'ModalHost', depth: 1, tone: 'accent', note: 'setOpen' },
    { label: '{children}', depth: 2, tone: 'ok', note: 'same element' },
  ], { w: 170, noteW: 120, rowH: 30 });
  o.push(okTree.xml);
  o.push(text(v.rightX + 16, 288, v.half - 32, 28, 'ModalHost re-renders, but `children` is the identical element object App made — React bails out.', { size: 10, color: C.ok }).xml);

  /* Why it works */
  o.push(panel(24, 336, W - 48, 106, 'Why it works — no memo, no dependency array', 'ok').xml);
  o.push(
    box(44, 370, W - 88, 56,
      'An element is a plain object. `ModalHost` re-rendering does not re-run `App`, so `props.children` is **the same object reference** as last time. React compares it, sees no change, and skips that subtree — the exact bail-out `memo` buys you, for free and with nothing to keep in sync.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* The pattern family */
  o.push(panel(24, 458, W - 48, 106, 'The same move, four names', 'accent').xml);
  const family = [
    ['children', '<Panel>{slow}</Panel>'],
    ['elements as props', '<Layout left={<Nav/>} />'],
    ['render props', '<Fetch>{d => <Row d={d}/>}</Fetch>'],
    ['HOC', 'withAuth(Page)'],
  ];
  family.forEach(([name, code], i) => {
    const x = 44 + i * 186;
    o.push(box(x, 492, 174, 24, name, 'accent', { size: 11, rx: 7 }).xml);
    o.push(box(x, 520, 174, 30, code, 'sunken', { mono: true, size: 9, rx: 7 }).xml);
  });

  o.push(takeaway(H - 58, 'Before reaching for memo, ask where the element is created. Moving state down or content up fixes most re-render problems with no API at all.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Context propagation
   ══════════════════════════════════════════════════════════════════ */

function contextPropagation() {
  const o = [];
  const H = 640;

  o.push(title('Context and re-renders', 'Every consumer re-renders when `value` is a new reference — memo cannot stop it'));

  /* The mechanism */
  o.push(panel(24, 70, W - 48, 208, 'A consumer subscribes to the provider, not to its parent', 'accent').xml);

  const tree = compTree(48, 108, [
    { label: 'ThemeProvider', depth: 0, tone: 'accent', note: 'value changed' },
    { label: 'Layout', depth: 1, tone: 'sunken', note: 'not a consumer' },
    { label: 'memo(Sidebar)', depth: 2, tone: 'ok', note: 'bails out' },
    { label: 'Avatar  useContext', depth: 3, tone: 'bad', note: 're-renders anyway' },
  ], { w: 220, noteW: 150, rowH: 34 });
  o.push(tree.xml);

  o.push(
    box(444, 112, 334, 72,
      '`memo(Sidebar)` bails out, and React still walks *past* it to reach `Avatar`. A consumer is subscribed directly — nothing in between can shield it.',
      'bad', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(444, 192, 334, 72,
      'That is the point of context: it skips the props chain. The cost is that it also skips every optimisation living on that chain.',
      'info', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* The classic bug */
  const v = versus(294, 'A new value object on every render', 'A stable value', 148);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 328, v.half - 32, 62, 'function App() {\n  const [user, setUser] = useState(null);\n  return <Ctx.Provider value={{ user, setUser }}>\n    …\n  </Ctx.Provider>;\n}', 'bad'));
  o.push(text(v.leftX + 16, 396, v.half - 32, 32, 'The object literal is new on every App render, so every consumer in the app re-renders — even when `user` never changed.', { size: 10, color: C.bad }).xml);

  o.push(codeCard(v.rightX + 16, 328, v.half - 32, 62, 'const value = useMemo(\n  () => ({ user, setUser }),\n  [user]);\nreturn <Ctx.Provider value={value}>…</Ctx.Provider>;'));
  o.push(text(v.rightX + 16, 396, v.half - 32, 32, 'Same reference until `user` actually changes. This is the minimum — do it every time you build a provider value inline.', { size: 10, color: C.ok }).xml);

  /* Splitting */
  o.push(panel(24, 462, W - 48, 112, 'The real fix for a busy context: split it', 'ok').xml);
  o.push(
    box(44, 496, 362, 64,
      '**One context, two concerns.** `{ user, theme }` means a theme toggle re-renders every component that only reads `user`.',
      'bad', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(416, 496, 362, 64,
      '**Two contexts.** `UserContext` and `ThemeContext` — a consumer re-renders only for the one it actually reads. Splitting state from setters is the same trick.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  o.push(legend(24, H - 22, [['accent', 'provider'], ['ok', 'bailed out'], ['bad', 'forced to re-render']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Where state should live — the ladder
   ══════════════════════════════════════════════════════════════════ */

function stateLadder() {
  const o = [];
  const H = 600;

  o.push(title('Where should this state live?', 'Climb one rung only when the rung below actually fails'));

  const rungs = [
    ['1 · local `useState`', 'one component needs it', 'A toggle, an input, a hovered row. Most state stops here.', 'ok'],
    ['2 · lifted to a parent', 'two siblings need it', 'Move it to their lowest common owner and pass it down. Still no library.', 'ok'],
    ['3 · `useReducer`', 'several fields change together', 'When transitions matter more than values — a wizard, a form with validation.', 'accent'],
    ['4 · context', 'passed through 3+ levels, changes rarely', 'Theme, locale, the signed-in user. Split it and memoise the value.', 'accent'],
    ['5 · a store (Redux / Zustand)', 'many writers, needs devtools or middleware', 'Cross-cutting client state with real complexity. Selectors keep renders narrow.', 'warn'],
    ['6 · a server cache (React Query)', 'the data belongs to a server', 'Not state at all — a cache. Gets you refetch, dedupe and staleness for free.', 'info'],
  ];

  let y = 76;
  rungs.forEach(([name, when, why, tone]) => {
    o.push(box(24, y, 252, 46, name, tone, { align: 'left', padLeft: 12, size: 12, bold: true }).xml);
    o.push(box(286, y, 200, 46, when, 'sunken', { align: 'left', padLeft: 10, size: 10 }).xml);
    o.push(text(500, y, 296, 46, why, { size: 10, color: C.fg }).xml);
    y += 54;
  });

  o.push(
    arrow(14, 80, 14, y - 12, {
      color: C.line,
      width: 1.4,
      dashed: true,
      endArrow: 'blockThin',
    }).xml
  );

  o.push(panel(24, y + 6, W - 48, 96, 'The two questions that answer it', 'accent').xml);
  o.push(
    box(44, y + 40, 362, 46, '**Who reads it?** Put it at the lowest node that contains all of them — no higher.', 'accent', {
      align: 'left',
      padLeft: 12,
      size: 11,
    }).xml
  );
  o.push(
    box(416, y + 40, 362, 46, '**Who owns the truth?** If the answer is "a server", it is a cache with a staleness policy, not state.', 'info', {
      align: 'left',
      padLeft: 12,
      size: 11,
    }).xml
  );

  o.push(takeaway(y + 114, 'Most "we need state management" problems are a prop drilled four levels or a fetch pretending to be state. Reach for rung 5 last, not first.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Server state vs client state
   ══════════════════════════════════════════════════════════════════ */

function serverVsClientState() {
  const o = [];
  const H = 520;

  o.push(title('Server state is a cache, not state', 'The moment you fetch it, someone else owns the truth'));

  const v = versus(70, 'Client state — you own it', 'Server state — you borrowed it', 224);
  o.push(v.xml);

  const clientRows = [
    'is this modal open',
    'which tab is selected',
    'what is typed in the form',
    'light or dark theme',
  ];
  clientRows.forEach((r, i) => {
    o.push(box(v.leftX + 16, 104 + i * 30, v.half - 32, 26, r, 'ok', { size: 11, align: 'left', padLeft: 10, rx: 7 }).xml);
  });
  o.push(
    box(v.leftX + 16, 228, v.half - 32, 58, 'Synchronous, always correct, and nobody else can change it. `useState` is the whole answer.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  const serverRows = [
    'the list of orders',
    'the current user profile',
    'search results',
    'anything from an endpoint',
  ];
  serverRows.forEach((r, i) => {
    o.push(box(v.rightX + 16, 104 + i * 30, v.half - 32, 26, r, 'info', { size: 11, align: 'left', padLeft: 10, rx: 7 }).xml);
  });
  o.push(
    box(v.rightX + 16, 228, v.half - 32, 58, 'Asynchronous, possibly stale the instant it arrives, and shared with every other tab and user.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  /* What you rebuild by hand */
  o.push(panel(24, 314, W - 48, 140, 'What `useState` + `useEffect` makes you write yourself', 'warn').xml);
  const chores = [
    'loading / error flags',
    'cancel on unmount',
    'dedupe concurrent calls',
    'refetch on focus',
    'retry with backoff',
    'cache across components',
    'invalidate after a write',
    'keep previous data',
  ];
  chores.forEach((c, i) => {
    o.push(box(44 + (i % 4) * 186, 350 + Math.floor(i / 4) * 32, 174, 28, c, 'warn', {
      size: 10,
      rx: 7,
    }).xml);
  });
  o.push(
    text(44, 416, W - 88, 30, 'A server-cache library (React Query, SWR, RTK Query) is these eight things. That is the whole pitch — not "a nicer fetch".', {
      size: 11,
      color: C.fg,
    }).xml
  );

  o.push(takeaway(H - 58, 'Never copy fetched data into useState "so we can edit it". Keep the cache as the source and hold only the edits locally.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   useReducer vs useState
   ══════════════════════════════════════════════════════════════════ */

function reducerVsState() {
  const o = [];
  const H = 540;

  o.push(title('useReducer vs useState', 'Move from "set this field" to "this happened"'));

  const v = versus(70, 'Four useState calls', 'One reducer', 246);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 104, v.half - 32, 84, 'const [data, setData]       = useState(null);\nconst [loading, setLoading] = useState(false);\nconst [error, setError]     = useState(null);\nconst [page, setPage]       = useState(1);'));
  o.push(
    box(v.leftX + 16, 196, v.half - 32, 46, 'Every call site must remember to update **all four** consistently. Forget one and you get `loading: true` with data already on screen.', 'bad', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );
  o.push(box(v.leftX + 16, 250, v.half - 32, 56, '16 combinations exist.\n**4 of them are legal.**', 'bad', { size: 12, bold: true, rx: 8 }).xml);

  o.push(codeCard(v.rightX + 16, 104, v.half - 32, 84, 'function reducer(s, action) {\n  switch (action.type) {\n    case "fetch":   return { …s, loading: true };\n    case "success": return { data: action.d, loading: false };\n    case "failure": return { error: action.e, loading: false };\n  }\n}'));
  o.push(
    box(v.rightX + 16, 196, v.half - 32, 46, 'Each transition is written once, in one place. An illegal combination is not reachable because no action produces it.', 'ok', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );
  o.push(box(v.rightX + 16, 250, v.half - 32, 56, 'The reducer is a pure function.\n**Testable without React.**', 'ok', { size: 12, bold: true, rx: 8 }).xml);

  /* When */
  o.push(panel(24, 336, W - 48, 122, 'Reach for a reducer when…', 'accent').xml);
  const when = [
    'the next state depends on the previous one in a non-obvious way',
    'several fields have to move together to stay consistent',
    'the same update is dispatched from many places',
    'you want to hand a stable `dispatch` down instead of five callbacks',
  ];
  when.forEach((r, i) => {
    o.push(box(44, 370 + i * 22, W - 88, 20, r, 'accent', { size: 10, align: 'left', padLeft: 10, rx: 6 }).xml);
  });

  o.push(takeaway(H - 68, '`dispatch` is stable for the life of the component, so passing it through context never invalidates a memo — unlike a fresh setter closure.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Redux data flow
   ══════════════════════════════════════════════════════════════════ */

function reduxFlow() {
  const o = [];
  const H = 590;

  o.push(title('Redux in one picture', 'One store, one direction, every change is an object you can log'));

  o.push(panel(24, 70, W - 48, 226, 'The loop', 'accent').xml);

  const ring = [
    { label: 'UI event', tone: 'info' },
    { label: 'dispatch(action)', tone: 'accent' },
    { label: 'reducer', tone: 'accent' },
    { label: 'new state', tone: 'ok' },
    { label: 'selector', tone: 'ok' },
  ];
  const p = pipeline(46, 116, ring, { pw: 132, gap: 22 });
  o.push(p.xml);

  // Close the loop back to the UI. The label rides the horizontal run —
  // on the riser above `UI event` it would be centred at x=112 and half of
  // it would hang off the canvas.
  o.push(
    arrow(p.centerX(4), 146, p.centerX(4), 178, { color: C.ok, width: 1.4, endArrow: 'none' }).xml
  );
  o.push(
    arrow(p.centerX(4), 178, p.centerX(0), 178, {
      color: C.ok,
      width: 1.4,
      endArrow: 'none',
      label: 're-render only the subscribed components',
    }).xml
  );
  o.push(arrow(p.centerX(0), 178, p.centerX(0), 146, { color: C.ok, width: 1.4 }).xml);

  const explain = [
    ['action', '`{ type: "cart/add", payload: id }` — a plain object describing *what happened*, never *what to set*.'],
    ['reducer', '`(state, action) => newState`. Pure: no fetches, no `Date.now()`, no mutation. Same inputs, same output.'],
    ['store', 'One object tree for the whole app. The only way in is `dispatch`.'],
    ['selector', '`useSelector(s => s.cart.total)` subscribes to a *slice*. Change something else and this component does not re-render.'],
  ];
  let ey = 200;
  explain.forEach(([name, body]) => {
    o.push(box(46, ey, 116, 20, name, 'accent', { size: 10, rx: 6 }).xml);
    o.push(text(174, ey, 604, 20, body, { size: 10, color: C.fg }).xml);
    ey += 22;
  });

  /* RTK */
  o.push(panel(24, 312, W - 48, 178, 'Redux Toolkit — what it removes', 'ok').xml);

  o.push(
    box(44, 346, 352, 128,
      '**By hand you wrote:**\n\n· action type string constants\n· an action creator per type\n· a switch with manual spreading\n· `combineReducers` wiring\n· thunk + devtools setup\n· deep-copy discipline everywhere',
      'bad', { align: 'left', valign: 'top', padLeft: 12, padTop: 8, size: 11 }).xml
  );
  o.push(
    codeCard(416, 346, 362, 128,
      'const cart = createSlice({\n  name: "cart",\n  initialState: { items: [] },\n  reducers: {\n    // Immer — safe to "mutate"\n    add: (s, a) => { s.items.push(a.payload) }\n  }\n});',
      'ok')
  );

  o.push(takeaway(H - 78, 'The value is not the store — it is that every change is a serialisable object, so you can log it, replay it, and time-travel through it. Pay that cost only when you need it.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Concurrent rendering
   ══════════════════════════════════════════════════════════════════ */

function concurrentLanes() {
  const o = [];
  const H = 620;

  o.push(title('Concurrent React: urgent vs. interruptible', 'Two updates from one event, and React picks the order'));

  /* Blocking */
  o.push(panel(24, 70, W - 48, 156, 'Without a transition — one keystroke, one long blocking render', 'bad').xml);

  o.push(box(44, 106, 120, 30, 'keypress', 'info', { size: 11, rx: 8 }).xml);
  o.push(arrow(164, 121, 196, 121, { color: C.line, width: 1.4 }).xml);
  o.push(box(196, 106, 582, 30, 'render input + filter 10,000 rows      ⟵ 240 ms, uninterruptible', 'bad', {
    size: 11,
    rx: 8,
    align: 'left',
    padLeft: 12,
  }).xml);
  o.push(arrow(487, 146, 487, 168, { color: C.bad, width: 1.4 }).xml);
  o.push(box(196, 168, 582, 30, 'paint — the typed character finally appears', 'bad', { size: 11, rx: 8 }).xml);
  o.push(text(44, 168, 146, 30, 'the field feels\nstuck', { size: 10, color: C.bad, align: 'right' }).xml);

  /* Non-blocking */
  o.push(panel(24, 242, W - 48, 210, 'With `startTransition` — the same work, re-ordered', 'ok').xml);

  o.push(box(44, 278, 120, 30, 'keypress', 'info', { size: 11, rx: 8 }).xml);
  o.push(arrow(164, 293, 196, 293, { color: C.line, width: 1.4 }).xml);
  o.push(box(196, 278, 268, 30, 'urgent: render the input', 'ok', { size: 11, rx: 8 }).xml);
  o.push(arrow(464, 293, 496, 293, { color: C.ok, width: 1.4 }).xml);
  o.push(box(496, 278, 282, 30, 'paint — 4 ms, character is on screen', 'ok', { size: 11, rx: 8 }).xml);

  o.push(box(196, 320, 582, 30, 'transition: filter 10,000 rows — in slices, yielding between them', 'accent', {
    size: 11,
    rx: 8,
    align: 'left',
    padLeft: 12,
  }).xml);
  o.push(
    text(44, 320, 146, 30, 'interruptible', { size: 10, color: C.accent, align: 'right', bold: true }).xml
  );

  o.push(box(196, 358, 582, 30, 'next keypress arrives → the half-built list is **thrown away** and restarted', 'warn', {
    size: 11,
    rx: 8,
    align: 'left',
    padLeft: 12,
  }).xml);
  o.push(
    text(44, 392, 734, 44, 'Nothing half-finished is ever shown. React keeps the last committed list on screen while the new one is built off-screen — which is why `isPending` exists, and why the old results stay visible instead of flashing to a spinner.', {
      size: 11,
      color: C.fg,
    }).xml
  );

  /* The two APIs */
  const v = versus(468, 'useTransition — you own the setter', 'useDeferredValue — you were handed a value', 92);
  o.push(v.xml);
  o.push(codeCard(v.leftX + 16, 502, v.half - 32, 54, 'const [isPending, start] = useTransition();\nstart(() => setQuery(next));\n// isPending → show a subtle spinner'));
  o.push(codeCard(v.rightX + 16, 502, v.half - 32, 54, 'const slow = useDeferredValue(query);\n// slow lags query by one render\n// no setter needed — good for props'));

  o.push(takeaway(H - 58, 'A transition does not make the work faster. It makes it interruptible, so the urgent update never has to wait behind it.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Suspense & lazy
   ══════════════════════════════════════════════════════════════════ */

function suspenseLazy() {
  const o = [];
  const H = 570;

  o.push(title('Suspense and lazy', 'A boundary catches "not ready yet" the way one catches an error'));

  o.push(panel(24, 70, W - 48, 214, 'The nearest boundary above the suspending component wins', 'accent').xml);

  const tree = compTree(48, 108, [
    { label: 'App', depth: 0, tone: 'sunken' },
    { label: '<Suspense fallback={<Skeleton/>}>', depth: 1, tone: 'accent', note: 'catches it' },
    { label: 'Dashboard', depth: 2, tone: 'sunken' },
    { label: 'lazy(Chart)', depth: 3, tone: 'warn', note: 'suspends' },
  ], { w: 300, noteW: 120, rowH: 34 });
  o.push(tree.xml);

  o.push(
    box(500, 112, 278, 74,
      'While the chunk is loading, React shows `<Skeleton/>` **in place of the whole boundary** — not in place of `Chart` alone.',
      'accent', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(500, 194, 278, 74,
      'So the boundary goes where the loading state makes visual sense. One boundary around the page means the whole page blinks.',
      'warn', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* What suspends */
  o.push(panel(24, 300, W - 48, 132, 'What actually suspends', 'ok').xml);
  const susp = [
    ['`React.lazy(() => import("./Chart"))`', 'the chunk request', 'ok'],
    ['`use(promise)` — React 19', 'any promise read during render', 'ok'],
    ['a framework data hook (RSC, Router)', 'built on the same mechanism', 'ok'],
    ['`useEffect(() => fetch(…))`', '**does not suspend** — the effect runs after render', 'bad'],
  ];
  susp.forEach(([lhs, rhs, tone], i) => {
    const y = 334 + i * 24;
    o.push(box(44, y, 306, 22, lhs, tone, { mono: true, size: 10, rx: 6 }).xml);
    o.push(text(362, y, 416, 22, rhs, { size: 10, color: tone === 'bad' ? C.bad : C.fg }).xml);
  });

  /* Code split payoff */
  o.push(panel(24, 448, W - 48, 74, 'What lazy buys', 'info').xml);
  o.push(box(44, 478, 362, 32, 'one bundle · 820 KB · everything up front', 'bad', { size: 11, rx: 8 }).xml);
  o.push(arrow(410, 494, 438, 494, { color: C.line, width: 1.4 }).xml);
  o.push(box(444, 478, 334, 32, 'shell 180 KB + chart 640 KB on demand', 'ok', { size: 11, rx: 8 }).xml);

  o.push(takeaway(H - 40, 'Split on routes first — a user who never opens the dashboard should never download the charting library.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   CSR · SSR · SSG · ISR
   ══════════════════════════════════════════════════════════════════ */

function renderingStrategiesReact() {
  const o = [];
  const H = 610;

  o.push(title('CSR · SSR · SSG · ISR', 'Who builds the HTML, and when'));

  const rows = [
    ['CSR', 'the browser, after JS loads', 'blank → spinner → content', 'dashboards behind a login', 'info'],
    ['SSR', 'the server, per request', 'content in the first byte', 'personalised, always-fresh pages', 'accent'],
    ['SSG', 'the build, once', 'instant from a CDN', 'docs, marketing, blogs', 'ok'],
    ['ISR', 'the build, then re-made in the background', 'instant, occasionally one visit stale', 'big catalogues that change slowly', 'warn'],
  ];

  o.push(panel(24, 70, W - 48, 186, 'Four answers to "when does the HTML exist?"', 'accent').xml);
  o.push(text(44, 100, 80, 16, 'strategy', { size: 10, bold: true, color: C.muted }).xml);
  o.push(text(132, 100, 214, 16, 'HTML is built by', { size: 10, bold: true, color: C.muted }).xml);
  o.push(text(354, 100, 214, 16, 'what the user sees first', { size: 10, bold: true, color: C.muted }).xml);
  o.push(text(576, 100, 202, 16, 'use it for', { size: 10, bold: true, color: C.muted }).xml);

  rows.forEach(([name, who, first, use, tone], i) => {
    const y = 122 + i * 32;
    o.push(box(44, y, 80, 28, name, tone, { size: 11, bold: true, rx: 7 }).xml);
    o.push(text(132, y, 214, 28, who, { size: 10, color: C.fg }).xml);
    o.push(text(354, y, 214, 28, first, { size: 10, color: C.fg }).xml);
    o.push(text(576, y, 202, 28, use, { size: 10, color: C.muted }).xml);
  });

  /* Hydration */
  o.push(panel(24, 272, W - 48, 208, 'Hydration — the part everyone forgets', 'warn').xml);

  const p = pipeline(44, 308, [
    { label: 'HTML arrives', tone: 'ok' },
    { label: 'paint — visible', tone: 'ok' },
    { label: 'JS downloads', tone: 'warn' },
    { label: 'hydrate', tone: 'warn' },
    { label: 'interactive', tone: 'accent' },
  ], { pw: 128, gap: 20 });
  o.push(p.xml);

  o.push(
    arrow(p.centerX(1), 348, p.centerX(4), 348, {
      color: C.bad,
      width: 1.4,
      startArrow: 'blockThin',
      endArrow: 'blockThin',
      label: 'looks ready, ignores every click',
      labelBg: C.surface,
    }).xml
  );

  o.push(
    box(44, 374, 362, 86,
      '**SSR is not free.** The server renders, sends HTML, then React re-renders the whole tree in the browser to attach event handlers. Until that finishes, the page is a picture.',
      'warn', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(416, 374, 362, 86,
      '**A hydration mismatch** — `Date.now()`, `window`, a random id — makes React discard the server HTML for that subtree and re-render it. You paid for SSR and got CSR.',
      'bad', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  o.push(takeaway(500, 'Pick by who owns the content and how fresh it must be. "SSR is faster" is wrong — SSR moves work, and hydration adds some back.'));

  o.push(legend(24, H - 22, [['ok', 'no JS needed'], ['warn', 'waiting on JS'], ['accent', 'interactive'], ['bad', 'the trap']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   React Server Components
   ══════════════════════════════════════════════════════════════════ */

function rscBoundary() {
  const o = [];
  const H = 592;

  o.push(title('Server Components and the boundary', '`"use client"` is not a location — it is the edge of the bundle'));

  o.push(panel(24, 70, W - 48, 224, 'One tree, two runtimes', 'accent').xml);

  const tree = compTree(48, 108, [
    { label: 'Page          server', depth: 0, tone: 'ok', note: 'async, reads the DB' },
    { label: 'ProductList   server', depth: 1, tone: 'ok', note: 'never shipped' },
    { label: '"use client"', depth: 2, tone: 'warn', note: 'the boundary' },
    { label: 'AddToCart     client', depth: 3, tone: 'accent', note: 'in the bundle' },
    { label: 'Price         server', depth: 4, tone: 'ok', note: 'passed as children' },
  ], { w: 260, noteW: 140, rowH: 34 });
  o.push(tree.xml);

  o.push(
    box(468, 112, 310, 80,
      'A server component runs **only** on the server. It can `await` a query directly, and its code is never sent to the browser — a 300 KB markdown parser costs the user nothing.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(468, 200, 310, 80,
      'Everything below `"use client"` is bundled. Note the last row: a server component can still appear *under* a client one, if it is passed through as `children`.',
      'accent', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* Rules */
  o.push(panel(24, 310, W - 48, 128, 'What crosses the boundary', 'warn').xml);
  const rules = [
    ['props must be serialisable', 'strings, numbers, arrays, plain objects, and elements — **not** functions or class instances', 'warn'],
    ['no hooks on the server', 'no `useState`, no `useEffect`, no event handlers — there is no interaction to handle', 'warn'],
    ['server actions go the other way', '`"use server"` lets a client component call a server function directly, as a form action', 'ok'],
  ];
  rules.forEach(([lhs, rhs, tone], i) => {
    const y = 344 + i * 30;
    o.push(box(44, y, 226, 26, lhs, tone, { size: 10, rx: 7 }).xml);
    o.push(text(282, y, 496, 26, rhs, { size: 10, color: C.fg }).xml);
  });

  /* use() */
  o.push(panel(24, 454, W - 48, 80, '`use()` — read a promise or a context during render', 'info').xml);
  o.push(codeCard(44, 484, 362, 36, 'const user = use(userPromise);\n// suspends until it resolves', 'info'));
  o.push(
    box(416, 484, 362, 36, 'Unlike every other hook, `use()` may be called conditionally.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  o.push(legend(24, H - 22, [['ok', 'server only'], ['warn', 'the boundary'], ['accent', 'shipped to the browser']]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Virtualisation
   ══════════════════════════════════════════════════════════════════ */

function virtualization() {
  const o = [];
  const H = 520;

  o.push(title('Virtualising a big list', 'Render the window, not the list'));

  const v = versus(70, '10,000 rows in the DOM', '~12 rows in the DOM', 250);
  o.push(v.xml);

  /* Naive */
  for (let i = 0; i < 9; i += 1) {
    o.push(box(v.leftX + 30, 106 + i * 18, v.half - 80, 14, '', 'bad', { rx: 4 }).xml);
  }
  o.push(text(v.leftX + 30, 270, v.half - 60, 16, '…9,991 more, all mounted', { size: 10, color: C.bad }).xml);
  o.push(
    box(v.leftX + 16, 292, v.half - 32, 28, '10,000 nodes · ~340 ms to mount · 90 MB', 'bad', { size: 11, rx: 8 }).xml
  );

  /* Windowed */
  o.push(box(v.rightX + 30, 106, v.half - 80, 14, '', 'sunken', { rx: 4, dashed: true }).xml);
  o.push(text(v.rightX + 30, 104, v.half - 60, 16, 'spacer — height of the rows above', { size: 9, color: C.muted }).xml);
  for (let i = 0; i < 5; i += 1) {
    o.push(box(v.rightX + 30, 132 + i * 18, v.half - 80, 14, '', 'ok', { rx: 4 }).xml);
  }
  o.push(box(v.rightX + 30, 228, v.half - 80, 14, '', 'sunken', { rx: 4, dashed: true }).xml);
  o.push(text(v.rightX + 30, 246, v.half - 60, 16, 'spacer — height of the rows below', { size: 9, color: C.muted }).xml);
  o.push(
    box(v.rightX + 16, 292, v.half - 32, 28, '12 nodes · ~4 ms · constant memory', 'ok', { size: 11, rx: 8 }).xml
  );

  o.push(
    arrow(v.rightX + v.half - 40, 132, v.rightX + v.half - 40, 222, {
      color: C.accent,
      width: 2,
      startArrow: 'blockThin',
      endArrow: 'blockThin',
      label: 'viewport',
      labelBg: C.surface,
    }).xml
  );

  /* How */
  o.push(panel(24, 336, W - 48, 122, 'The mechanism, and what it costs you', 'accent').xml);
  o.push(
    box(44, 370, 362, 74,
      '**How.** Track `scrollTop`, divide by row height to get the first visible index, render that slice, and hold the scrollbar at the right length with two spacer divs.',
      'accent', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(416, 370, 362, 74,
      '**The cost.** Ctrl-F finds nothing off-screen, and variable row heights need measurement. Reach for `@tanstack/virtual` rather than writing it.',
      'warn', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  o.push(takeaway(H - 58, 'Virtualise when the list is unbounded. For 200 rows, pagination or a plain list is simpler and the user cannot tell.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Refs
   ══════════════════════════════════════════════════════════════════ */

function refsEscapeHatch() {
  const o = [];
  const H = 640;

  o.push(title('Refs: the box React does not watch', 'A value that survives renders without causing one'));

  const v = versus(70, 'state — React watches it', 'ref — React ignores it', 132);
  o.push(v.xml);

  o.push(box(v.leftX + 16, 104, v.half - 32, 26, 'setCount(1)  →  re-render  →  new value on screen', 'accent', { size: 11, rx: 8 }).xml);
  o.push(
    box(v.leftX + 16, 138, v.half - 32, 52, 'Changing it is how you ask for a new frame. Reading it during render is always safe.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  o.push(box(v.rightX + 16, 104, v.half - 32, 26, 'ref.current = 1  →  nothing happens', 'info', { size: 11, rx: 8 }).xml);
  o.push(
    box(v.rightX + 16, 138, v.half - 32, 52, 'One mutable box shared by every render. Reading or writing it **during** render is not safe — do it in effects and handlers.', 'sunken', {
      align: 'left',
      padLeft: 10,
      size: 11,
    }).xml
  );

  /* What refs are for */
  o.push(panel(24, 218, W - 48, 158, 'The four honest uses', 'accent').xml);
  const uses = [
    ['a DOM node', '`inputRef.current.focus()`, measuring, scrolling into view'],
    ['a timer or subscription id', 'the thing cleanup has to cancel — it must survive renders and must not cause one'],
    ['the latest value for a callback', 'the escape from a stale closure inside a debounce or an interval'],
    ['previous props / render count', 'written in an effect, read next render — never during this one'],
  ];
  uses.forEach(([lhs, rhs], i) => {
    const y = 252 + i * 30;
    o.push(box(44, y, 226, 26, lhs, 'accent', { size: 10, rx: 7 }).xml);
    o.push(text(282, y, 496, 26, rhs, { size: 10, color: C.fg }).xml);
  });

  /* Imperative handle */
  o.push(panel(24, 392, W - 48, 176, 'Exposing an imperative API without exposing the DOM', 'ok').xml);

  o.push(codeCard(44, 426, 362, 86, 'const Input = forwardRef((props, ref) => {\n  const dom = useRef(null);\n  useImperativeHandle(ref, () => ({\n    focus: () => dom.current.focus(),\n    clear: () => { dom.current.value = ""; }\n  }), []);\n  return <input ref={dom} {…props} />;\n});', 'ok'));
  o.push(
    box(416, 426, 362, 86,
      'The parent gets exactly `focus` and `clear` — not the node, so it cannot reach in and restyle it.\n\nUse it for focus, scroll, select and media controls. If you are reaching for it to push *data* down, the data should have been a prop.',
      'sunken', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  o.push(takeaway(582, 'If a value is shown on screen, it is state. A ref is for things the user sees the effect of, never the value of.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Portals
   ══════════════════════════════════════════════════════════════════ */

function portalsStacking() {
  const o = [];
  const H = 560;

  o.push(title('Portals: two trees, deliberately out of step', 'The DOM moves; the React tree does not'));

  o.push(panel(24, 70, W - 48, 250, 'Where the node lands vs. where the component lives', 'accent').xml);

  o.push(text(48, 104, 180, 16, 'React tree', { size: 11, bold: true, color: C.accent }).xml);
  const rt = compTree(48, 124, [
    { label: 'App', depth: 0, tone: 'sunken' },
    { label: 'Card', depth: 1, tone: 'sunken' },
    { label: 'Tooltip', depth: 2, tone: 'accent' },
  ], { w: 170, rowH: 32, noteW: 0 });
  o.push(rt.xml);
  o.push(text(48, 226, 220, 44, 'Context, state and **events still flow through Card** — the Tooltip is its child as far as React is concerned.', { size: 10, color: C.fg }).xml);

  o.push(arrow(280, 172, 340, 172, { color: C.warn, width: 2, label: 'createPortal' }).xml);

  o.push(text(366, 104, 180, 16, 'DOM tree', { size: 11, bold: true, color: C.ok }).xml);
  const dt = compTree(366, 124, [
    { label: 'body', depth: 0, tone: 'sunken' },
    { label: 'div#root', depth: 1, tone: 'sunken' },
    { label: 'div.card', depth: 2, tone: 'sunken', note: 'overflow: hidden' },
    { label: 'div#portal', depth: 1, tone: 'ok', note: 'the tooltip lands here' },
  ], { w: 190, rowH: 32, noteW: 150 });
  o.push(dt.xml);

  /* Why */
  const v = versus(336, 'The problems it solves', 'The one that surprises people', 138);
  o.push(v.xml);

  const solved = [
    '`overflow: hidden` on an ancestor clipping a dropdown',
    'a `z-index` war with a positioned ancestor',
    '`transform` on a parent creating a new containing block',
  ];
  solved.forEach((r, i) => {
    o.push(box(v.leftX + 16, 370 + i * 28, v.half - 32, 24, r, 'ok', { size: 10, align: 'left', padLeft: 10, rx: 6 }).xml);
  });

  o.push(
    box(v.rightX + 16, 370, v.half - 32, 82,
      '**Events still bubble through the React tree, not the DOM tree.** A click inside a portal fires the `onClick` on `Card` — which is usually what you want, and is a genuine shock when your "click outside to close" handler lives on `Card`.',
      'warn', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  o.push(takeaway(H - 58, 'A portal changes where the pixels are, not who owns the component. That split is the whole feature.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Error boundaries
   ══════════════════════════════════════════════════════════════════ */

function errorBoundaries() {
  const o = [];
  const H = 592;

  o.push(title('Error boundaries', 'A try/catch for rendering — and only for rendering'));

  o.push(panel(24, 70, W - 48, 214, 'The error climbs to the nearest boundary above it', 'accent').xml);

  const tree = compTree(48, 108, [
    { label: 'App', depth: 0, tone: 'sunken' },
    { label: '<ErrorBoundary>', depth: 1, tone: 'accent', note: 'catches · shows fallback' },
    { label: 'Dashboard', depth: 2, tone: 'sunken', note: 'unmounted with it' },
    { label: 'Chart', depth: 3, tone: 'bad', note: 'throws' },
  ], { w: 250, noteW: 160, rowH: 34 });
  o.push(tree.xml);

  o.push(arrow(300, 210, 300, 150, { color: C.bad, width: 2, label: 'throws upward' }).xml);

  o.push(
    box(490, 112, 288, 78,
      'The **whole subtree under the boundary** is unmounted and replaced by the fallback — so a page-level boundary turns one broken chart into a blank page.',
      'warn', { align: 'left', padLeft: 12, size: 11 }).xml
  );
  o.push(
    box(490, 198, 288, 72,
      'Put a boundary around each independently-failing region: a widget, a route, a panel. Then one failure costs one widget.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  /* Caught vs not */
  const v = versus(300, 'Not caught by a boundary', 'Caught', 220);
  o.push(v.xml);

  const notCaught = [
    ['event handlers', 'use a plain `try/catch` — the render already finished'],
    ['`setTimeout` / promises', 'async work escapes the render; catch it yourself'],
    ['server-side rendering', 'no boundary runs; handle it in the framework'],
    ['the boundary\'s own render', 'nothing above it means the whole app unmounts'],
  ];
  notCaught.forEach(([lhs, rhs], i) => {
    const y = 334 + i * 32;
    o.push(box(v.leftX + 16, y, 146, 28, lhs, 'bad', { size: 10, rx: 7 }).xml);
    o.push(text(v.leftX + 172, y, 208, 28, rhs, { size: 9, color: C.muted }).xml);
  });

  o.push(codeCard(v.rightX + 16, 334, v.half - 32, 74, 'class Boundary extends React.Component {\n  static getDerivedStateFromError(e) {\n    return { failed: true };   // show fallback\n  }\n  componentDidCatch(e, info) {\n    report(e, info.componentStack);\n  }\n}'));
  o.push(
    text(v.rightX + 16, 470, v.half - 32, 40, 'Still class-only — there is no hook equivalent. Use `react-error-boundary` rather than writing it again.', {
      size: 10,
      color: C.muted,
    }).xml
  );

  o.push(takeaway(534, 'A boundary needs a way out: a Retry button that resets its state, or the user is stuck on the fallback until a reload.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Request waterfalls
   ══════════════════════════════════════════════════════════════════ */

function fetchWaterfalls() {
  const o = [];
  const H = 580;

  o.push(title('Request waterfalls', 'Three requests that could have been one round trip'));

  /* Serial */
  o.push(panel(24, 70, W - 48, 158, 'Each component fetches in its own effect — nested', 'bad').xml);

  const bars = [
    ['User', 0, 200],
    ['Issues', 200, 180],
    ['Comments', 380, 190],
  ];
  bars.forEach(([name, start, dur], i) => {
    const y = 110 + i * 34;
    o.push(text(44, y, 92, 26, name, { size: 11, color: C.fg, align: 'right' }).xml);
    o.push(box(148 + start, y, dur, 26, `${dur} ms`, 'bad', { size: 10, rx: 6 }).xml);
    if (i > 0) {
      o.push(arrow(148 + start, y - 8, 148 + start, y, { color: C.bad, width: 1.2 }).xml);
    }
  });
  o.push(
    text(148, 214, 600, 16, 'Each fetch needs the previous response before it can start. 570 ms, and the network was idle for most of it.', {
      size: 10,
      italic: true,
      color: C.bad,
    }).xml
  );

  /* Parallel */
  o.push(panel(24, 244, W - 48, 158, 'Hoisted — start everything that has no dependency at once', 'ok').xml);

  const par = [['User', 200], ['Issues', 180], ['Comments', 190]];
  par.forEach(([name, dur], i) => {
    const y = 284 + i * 34;
    o.push(text(44, y, 92, 26, name, { size: 11, color: C.fg, align: 'right' }).xml);
    o.push(box(148, y, dur, 26, `${dur} ms`, 'ok', { size: 10, rx: 6 }).xml);
  });
  o.push(
    arrow(148, 386, 348, 386, {
      color: C.ok,
      width: 1.4,
      startArrow: 'blockThin',
      endArrow: 'blockThin',
      label: '200 ms total',
      labelBg: C.surface,
    }).xml
  );

  /* Causes and fixes */
  o.push(panel(24, 418, W - 48, 100, 'Where waterfalls come from', 'warn').xml);
  const causes = [
    ['a fetch inside a child\'s effect', 'the child cannot mount until the parent has data — hoist or prefetch'],
    ['`await` in sequence', '`Promise.all` when neither depends on the other'],
    ['`lazy()` above a fetch', 'the chunk downloads, *then* the request starts — preload on hover or route intent'],
  ];
  causes.forEach(([lhs, rhs], i) => {
    const y = 450 + i * 24;
    o.push(box(44, y, 246, 22, lhs, 'warn', { size: 10, rx: 6 }).xml);
    o.push(text(302, y, 476, 22, rhs, { size: 10, color: C.fg }).xml);
  });

  o.push(takeaway(H - 58, 'Open the network panel and look at the shape. A staircase is a waterfall; a block starting at the same x is not.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Race conditions
   ══════════════════════════════════════════════════════════════════ */

function raceConditions() {
  const o = [];
  const H = 588;

  o.push(title('Race conditions in data fetching', 'The slow answer to the old question arrives last'));

  o.push(panel(24, 70, W - 48, 196, 'Typing "re" then "react" — two requests in flight', 'bad').xml);

  o.push(text(44, 108, 92, 26, 'fetch("re")', { size: 11, color: C.fg, align: 'right', mono: true }).xml);
  o.push(box(148, 108, 480, 26, 'slow — 600 ms', 'bad', { size: 10, rx: 6 }).xml);

  o.push(text(44, 146, 92, 26, 'fetch("react")', { size: 11, color: C.fg, align: 'right', mono: true }).xml);
  o.push(box(238, 146, 200, 26, 'fast — 150 ms', 'accent', { size: 10, rx: 6 }).xml);

  o.push(arrow(438, 172, 438, 196, { color: C.accent, width: 1.4 }).xml);
  o.push(box(340, 196, 196, 24, 'setResults(react results)', 'accent', { size: 10, rx: 6, mono: true }).xml);

  o.push(arrow(628, 134, 628, 226, { color: C.bad, width: 1.4 }).xml);
  o.push(box(560, 226, 218, 24, 'setResults(re results)  ← overwrites', 'bad', { size: 10, rx: 6, mono: true }).xml);

  o.push(
    text(44, 232, 500, 28, 'The box now shows results for "re" while the field says "react". Nothing errored.', {
      size: 11,
      color: C.bad,
    }).xml
  );

  /* Fixes */
  const v = versus(286, 'Ignore the stale response', 'Abort it', 230);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 320, v.half - 32, 88, 'useEffect(() => {\n  let current = true;\n  fetch(url).then(r => r.json()).then(d => {\n    if (current) setResults(d);   // last one wins\n  });\n  return () => { current = false; };\n}, [url]);'));
  o.push(
    text(v.leftX + 16, 474, v.half - 32, 34, 'The cleanup for the old effect runs before the new one, so the flag is already false by the time the slow response lands.', {
      size: 10,
      color: C.muted,
    }).xml
  );

  o.push(codeCard(v.rightX + 16, 320, v.half - 32, 88, 'useEffect(() => {\n  const ac = new AbortController();\n  fetch(url, { signal: ac.signal })\n    .then(r => r.json())\n    .then(setResults)\n    .catch(e => { if (e.name !== "AbortError") throw e; });\n  return () => ac.abort();\n}, [url]);'));
  o.push(
    text(v.rightX + 16, 474, v.half - 32, 34, 'Also frees the connection — better for a real search box, but you must swallow the AbortError.', {
      size: 10,
      color: C.muted,
    }).xml
  );

  o.push(takeaway(530, 'Any effect that sets state from an async result needs one of these. A query library does it for you, which is most of why they exist.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   StrictMode
   ══════════════════════════════════════════════════════════════════ */

function strictmodeDoubleInvoke() {
  const o = [];
  const H = 520;

  o.push(title('StrictMode\'s double invoke', 'A development-only rehearsal for a bug you would ship'));

  o.push(panel(24, 70, W - 48, 152, 'What runs twice in development', 'accent').xml);

  const doubled = [
    'the component function body',
    'useState / useMemo initialisers',
    'the reducer',
    'effect setup → cleanup → setup',
  ];
  doubled.forEach((d, i) => {
    o.push(box(44 + (i % 2) * 378, 106 + Math.floor(i / 2) * 32, 362, 28, d, 'accent', {
      size: 11,
      align: 'left',
      padLeft: 10,
      rx: 7,
    }).xml);
  });
  o.push(
    text(44, 176, W - 88, 34, 'Never in production, and never for event handlers. React is checking one claim: that your render is pure and your effect cleans up after itself.', {
      size: 11,
      color: C.fg,
    }).xml
  );

  /* What it catches */
  const v = versus(238, 'What it exposes', 'What it is not', 176);
  o.push(v.xml);

  const catches = [
    ['a missing cleanup', 'two sockets, two intervals, two listeners'],
    ['an impure render', 'pushing to an outer array, mutating a prop'],
    ['a non-idempotent effect', '"add one item" runs twice'],
  ];
  catches.forEach(([lhs, rhs], i) => {
    const y = 276 + i * 44;
    o.push(box(v.leftX + 16, y, v.half - 32, 24, lhs, 'bad', { size: 10, rx: 6 }).xml);
    o.push(text(v.leftX + 16, y + 24, v.half - 32, 18, rhs, { size: 9, color: C.muted }).xml);
  });

  o.push(
    box(v.rightX + 16, 276, v.half - 32, 56,
      '**Not a bug to work around.** A `hasRun` ref that suppresses the second call hides the problem instead of fixing it — and the problem is real in production too, on every remount.',
      'bad', { align: 'left', padLeft: 10, size: 11 }).xml
  );
  o.push(
    box(v.rightX + 16, 340, v.half - 32, 56,
      '**Not a performance signal.** The doubled render is development-only and tells you nothing about production timing.',
      'info', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(takeaway(H - 58, 'If double-invoking breaks it, a user navigating away and back breaks it too. StrictMode just makes that happen on the first render instead of in a bug report.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Custom hooks
   ══════════════════════════════════════════════════════════════════ */

function customHookBoundary() {
  const o = [];
  const H = 530;

  o.push(title('Custom hooks share logic, never state', 'Two components calling the same hook get two separate stores'));

  o.push(panel(24, 70, W - 48, 202, 'One hook, two independent copies', 'accent').xml);

  o.push(codeCard(44, 106, 300, 92, 'function useCounter(start) {\n  const [n, setN] = useState(start);\n  return [n, () => setN(c => c + 1)];\n}'));

  o.push(box(372, 106, 190, 28, 'ComponentA', 'accent', { size: 11, rx: 8 }).xml);
  o.push(box(588, 106, 190, 28, 'ComponentB', 'accent', { size: 11, rx: 8 }).xml);
  o.push(arrow(194, 202, 467, 142, { color: C.line, width: 1.3, style: 'orthogonalEdgeStyle' }).xml);
  o.push(arrow(194, 202, 683, 142, { color: C.line, width: 1.3, style: 'orthogonalEdgeStyle' }).xml);
  o.push(box(372, 146, 190, 28, 'its own slot · n = 3', 'ok', { size: 11, rx: 8, mono: true }).xml);
  o.push(box(588, 146, 190, 28, 'its own slot · n = 0', 'ok', { size: 11, rx: 8, mono: true }).xml);
  o.push(
    text(372, 186, 406, 34, 'The hook is inlined into each caller\'s own slot list. Sharing the *value* needs context or a store — a hook alone never does it.', {
      size: 10,
      color: C.fg,
    }).xml
  );

  /* Hook vs helper */
  const v = versus(292, 'A plain function is enough', 'It has to be a hook', 150);
  o.push(v.xml);

  const plain = ['formatting a date', 'sorting an array', 'validating an email', 'any pure input → output'];
  plain.forEach((r, i) => {
    o.push(box(v.leftX + 16, 326 + i * 26, v.half - 32, 22, r, 'info', { size: 10, align: 'left', padLeft: 10, rx: 6 }).xml);
  });

  const hooky = ['it calls useState or useRef', 'it subscribes in useEffect', 'it reads context', 'it must re-render on change'];
  hooky.forEach((r, i) => {
    o.push(box(v.rightX + 16, 326 + i * 26, v.half - 32, 22, r, 'accent', { size: 10, align: 'left', padLeft: 10, rx: 6 }).xml);
  });

  o.push(takeaway(H - 58, 'Name it `useX` only if it calls a hook. A `useFormatPrice` that touches nothing React-shaped is a helper wearing a costume, and the linter will hold it to rules it does not need.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Controlled vs uncontrolled
   ══════════════════════════════════════════════════════════════════ */

function controlledUncontrolled() {
  const o = [];
  const H = 500;

  o.push(title('Controlled vs uncontrolled inputs', 'Who holds the current value — React, or the DOM'));

  const v = versus(70, 'Controlled — React holds it', 'Uncontrolled — the DOM holds it', 250);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 104, v.half - 32, 40, '<input value={v}\n  onChange={e => setV(e.target.value)} />'));

  const loop = pipeline(v.leftX + 16, 156, [
    { label: 'keypress', tone: 'info' },
    { label: 'setState', tone: 'accent' },
    { label: 're-render', tone: 'accent' },
  ], { pw: 96, gap: 18 });
  o.push(loop.xml);
  o.push(text(v.leftX + 16, 192, v.half - 32, 16, 'every keystroke is a render', { size: 9, color: C.muted }).xml);

  o.push(
    box(v.leftX + 16, 212, v.half - 32, 100,
      '**Buys you:** validate or transform as they type, disable Submit live, force uppercase, drive the field from elsewhere.\n\n**Costs you:** a render per character. Rarely matters — until the form is large or each render is expensive.',
      'ok', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(codeCard(v.rightX + 16, 104, v.half - 32, 40, '<input defaultValue={v} ref={r} />\n// read r.current.value on submit'));

  const loop2 = pipeline(v.rightX + 16, 156, [
    { label: 'keypress', tone: 'info' },
    { label: 'DOM updates', tone: 'ok' },
  ], { pw: 96, gap: 18 });
  o.push(loop2.xml);
  o.push(text(v.rightX + 16, 192, v.half - 32, 16, 'React is not involved until submit', { size: 9, color: C.muted }).xml);

  o.push(
    box(v.rightX + 16, 212, v.half - 32, 100,
      '**Buys you:** zero renders while typing, and less code for a plain form.\n\n**Costs you:** the value is only readable on demand, so live validation and cross-field rules get awkward.',
      'info', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  /* The warning */
  o.push(panel(24, 336, W - 48, 92, 'The warning everyone hits', 'warn').xml);
  o.push(codeCard(44, 368, 362, 44, 'const [v, setV] = useState();   // undefined!\n<input value={v} onChange={…} />', 'bad'));
  o.push(
    box(416, 368, 362, 44, '`value={undefined}` starts uncontrolled and becomes controlled on the first keystroke. Initialise to `""`.', 'warn', {
      align: 'left',
      padLeft: 12,
      size: 11,
    }).xml
  );

  o.push(takeaway(442, 'Default to controlled — it is the one that composes. Reach for uncontrolled when the render cost is measured, or a file input leaves you no choice.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Accessibility
   ══════════════════════════════════════════════════════════════════ */

function a11yTree() {
  const o = [];
  const H = 570;

  o.push(title('The accessibility tree', 'What a screen reader gets is not what you wrote'));

  o.push(panel(24, 70, W - 48, 198, 'Same pixels, different tree', 'accent').xml);

  o.push(text(48, 104, 340, 16, 'a div dressed as a button', { size: 11, bold: true, color: C.bad }).xml);
  o.push(codeCard(48, 124, 340, 48, '<div className="btn" onClick={save}>\n  Save\n</div>', 'bad'));
  o.push(box(48, 182, 340, 68, 'role: **generic**  ·  name: "Save"\n\nNot focusable · not in the tab order · Enter and Space do nothing · announced as plain text', 'bad', {
    align: 'left',
    padLeft: 10,
    size: 10,
  }).xml);

  o.push(text(432, 104, 346, 16, 'a button', { size: 11, bold: true, color: C.ok }).xml);
  o.push(codeCard(432, 124, 346, 48, '<button onClick={save}>\n  Save\n</button>', 'ok'));
  o.push(box(432, 182, 346, 68, 'role: **button**  ·  name: "Save"\n\nFocusable · in the tab order · Enter and Space fire it · announced as "Save, button"', 'ok', {
    align: 'left',
    padLeft: 10,
    size: 10,
  }).xml);

  /* The React-specific list */
  o.push(panel(24, 288, W - 48, 190, 'The parts React makes you think about', 'warn').xml);
  const items = [
    ['label every control', '`<label htmlFor>` or `aria-label`. `useId()` gives you an id that is stable across server and client.'],
    ['announce what changed', 'a route change or an async result needs `role="status"` / `aria-live` — the DOM moved, the reader did not.'],
    ['manage focus', 'on open, move focus into the dialog and trap it; on close, return it to the trigger.'],
    ['keep the tab order', 'a portal is elsewhere in the DOM, so its tab position is elsewhere too — trap or re-order deliberately.'],
    ['respect the OS', '`prefers-reduced-motion` and `prefers-color-scheme` are user settings, not preferences to override.'],
  ];
  items.forEach(([lhs, rhs], i) => {
    const y = 322 + i * 30;
    o.push(box(44, y, 180, 26, lhs, 'warn', { size: 10, rx: 7 }).xml);
    o.push(text(236, y, 542, 26, rhs, { size: 10, color: C.fg }).xml);
  });

  o.push(takeaway(H - 58, 'The first rule of ARIA is not to use it: a native element already has the role, the focus behaviour and the keyboard handling you would otherwise rebuild.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Testing
   ══════════════════════════════════════════════════════════════════ */

function testingPyramid() {
  const o = [];
  const H = 500;

  o.push(title('Test behaviour, not implementation', 'Query the way a user looks, act the way a user acts'));

  const v = versus(70, 'Coupled to the implementation', 'Coupled to the behaviour', 196);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 104, v.half - 32, 76, 'expect(wrapper.state("open")).toBe(true);\nexpect(wrapper.find("Modal")).toHaveLength(1);\nwrapper.instance().handleClick();\nexpect(useStore).toHaveBeenCalled();', 'bad'));
  o.push(
    box(v.leftX + 16, 192, v.half - 32, 62,
      'Renaming `open` to `isOpen` breaks every one of these, and none of them would have caught the button being invisible. **Refactors go red; bugs go green.**',
      'bad', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  o.push(codeCard(v.rightX + 16, 104, v.half - 32, 76, 'await user.click(screen.getByRole("button",\n  { name: /save/i }));\nexpect(await screen.findByRole("alert"))\n  .toHaveTextContent("Saved");'));
  o.push(
    box(v.rightX + 16, 192, v.half - 32, 62,
      'Survives any refactor that keeps the behaviour, and fails when the button loses its accessible name — which is a real bug for a real user.',
      'ok', { align: 'left', padLeft: 10, size: 11 }).xml
  );

  /* Query order */
  o.push(panel(24, 282, W - 48, 132, 'Query priority — the earlier one is the better test', 'accent').xml);
  const queries = [
    ['getByRole', 'how assistive tech sees it — the default choice', 'ok'],
    ['getByLabelText', 'form fields, exactly as a user finds them', 'ok'],
    ['getByText', 'non-interactive content', 'accent'],
    ['getByTestId', 'the escape hatch — invisible to users, so it proves nothing about them', 'warn'],
  ];
  queries.forEach(([name, why, tone], i) => {
    const y = 314 + i * 24;
    o.push(box(44, y, 160, 22, name, tone, { mono: true, size: 10, rx: 6 }).xml);
    o.push(text(216, y, 562, 22, why, { size: 10, color: C.fg }).xml);
  });

  o.push(takeaway(H - 58, 'A good test is one you never have to open during a refactor, and that goes red the moment a user would notice.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Micro-frontends
   ══════════════════════════════════════════════════════════════════ */

function microfrontendTopology() {
  const o = [];
  const H = 540;

  o.push(title('Micro-frontend topology', 'Independent deploys, bought with runtime coupling'));

  o.push(panel(24, 70, W - 48, 208, 'A shell composing three independently-deployed remotes', 'accent').xml);

  o.push(box(310, 106, 200, 34, 'Shell  ·  host app', 'accent', { size: 12, bold: true, rx: 8 }).xml);
  o.push(text(310, 142, 200, 16, 'routing · auth · shared shell', { size: 9, color: C.muted, align: 'center' }).xml);

  const remotes = [
    ['Search  ·  team A', 'React 18'],
    ['Cart  ·  team B', 'React 19'],
    ['Account  ·  team C', 'Vue 3'],
  ];
  remotes.forEach(([name, stack], i) => {
    const x = 48 + i * 248;
    o.push(box(x, 196, 228, 34, name, 'ok', { size: 11, rx: 8 }).xml);
    o.push(text(x, 232, 228, 16, `own repo · own deploy · ${stack}`, { size: 9, color: C.muted, align: 'center' }).xml);
    o.push(arrow(410, 166, x + 114, 194, { color: C.line, width: 1.3, style: 'orthogonalEdgeStyle' }).xml);
  });
  o.push(text(430, 162, 200, 16, 'loaded at runtime', { size: 9, color: C.muted }).xml);

  /* Trade */
  const v = versus(296, 'What you buy', 'What you pay', 150);
  o.push(v.xml);

  const buy = ['a team ships without a release train', 'a legacy corner can stay on the old stack', 'one team\'s broken build is one team\'s'];
  buy.forEach((r, i) => {
    o.push(box(v.leftX + 16, 330 + i * 30, v.half - 32, 26, r, 'ok', { size: 10, align: 'left', padLeft: 10, rx: 6 }).xml);
  });

  const pay = ['two Reacts on one page unless shared', 'versioning a shared contract at runtime', 'debugging spans repos you cannot see'];
  pay.forEach((r, i) => {
    o.push(box(v.rightX + 16, 330 + i * 30, v.half - 32, 26, r, 'bad', { size: 10, align: 'left', padLeft: 10, rx: 6 }).xml);
  });

  o.push(takeaway(H - 58, 'This is an organisational fix with a technical bill. Below roughly four teams, a monorepo with clear module boundaries gets you the same isolation for far less.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   useId
   ══════════════════════════════════════════════════════════════════ */

function useIdSsr() {
  const o = [];
  const H = 470;

  o.push(title('useId: ids that survive hydration', 'A counter is not stable across two runtimes'));

  const v = versus(70, 'A module counter', '`useId()`', 200);
  o.push(v.xml);

  o.push(codeCard(v.leftX + 16, 104, v.half - 32, 40, 'let n = 0;\nconst id = `field-${n++}`;'));

  o.push(box(v.leftX + 16, 156, v.half - 32, 26, 'server renders  →  id="field-0"', 'info', { size: 10, rx: 7, mono: true }).xml);
  o.push(box(v.leftX + 16, 188, v.half - 32, 26, 'client hydrates →  id="field-3"', 'bad', { size: 10, rx: 7, mono: true }).xml);
  o.push(
    box(v.leftX + 16, 220, v.half - 32, 48, 'The counter starts fresh in the browser and the components mount in a different order. React reports a hydration mismatch and the `htmlFor` link is broken.', 'bad', {
      align: 'left',
      padLeft: 10,
      size: 10,
    }).xml
  );

  o.push(codeCard(v.rightX + 16, 104, v.half - 32, 40, 'const id = useId();\n<label htmlFor={id}> … <input id={id} />'));

  o.push(box(v.rightX + 16, 156, v.half - 32, 26, 'server renders  →  id=":r0:"', 'ok', { size: 10, rx: 7, mono: true }).xml);
  o.push(box(v.rightX + 16, 188, v.half - 32, 26, 'client hydrates →  id=":r0:"', 'ok', { size: 10, rx: 7, mono: true }).xml);
  o.push(
    box(v.rightX + 16, 220, v.half - 32, 48, 'The id is derived from the component\'s position in the tree, which is identical on both sides. Same input, same output.', 'ok', {
      align: 'left',
      padLeft: 10,
      size: 10,
    }).xml
  );

  o.push(panel(24, 286, W - 48, 96, 'What it is not for', 'warn').xml);
  o.push(box(44, 318, 362, 46, '**Not a list key.** It is per-component, not per-item — every row would get the same id.', 'bad', {
    align: 'left',
    padLeft: 12,
    size: 11,
  }).xml);
  o.push(box(416, 318, 362, 46, '**Not a database id.** It is an opaque DOM string, and the format is React\'s to change.', 'bad', {
    align: 'left',
    padLeft: 12,
    size: 11,
  }).xml);

  o.push(takeaway(H - 58, 'One call can serve a whole form: `${id}-email`, `${id}-password`. That is the intended use, not one `useId` per field.'));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   Component anatomy
   ══════════════════════════════════════════════════════════════════ */

function componentAnatomy() {
  const o = [];
  const H = 606;

  o.push(title('Anatomy of a component you build in an interview', 'The four decisions, in the order the interviewer scores them'));

  const steps = [
    ['1 · the API', 'What does the parent pass, and what does it get back? Write the call site *first* — `<Collapsible items={…} defaultOpen={0} />` decides everything below it.', 'accent'],
    ['2 · the state shape', 'The smallest thing that cannot be derived. One `openId`, not an `isOpen` per row — two sources of truth is the bug they are looking for.', 'accent'],
    ['3 · controlled or not', 'Accept `value` + `onChange` **and** fall back to internal state, so it works both ways. This is the senior answer.', 'ok'],
    ['4 · the keyboard and the roles', 'A row that only responds to a click is not finished. `<button>`, `aria-expanded`, Enter and Space.', 'warn'],
  ];

  let y = 76;
  steps.forEach(([name, body, tone]) => {
    o.push(box(24, y, 186, 62, name, tone, { align: 'left', padLeft: 12, size: 12, bold: true }).xml);
    o.push(box(220, y, W - 244, 62, body, 'sunken', { align: 'left', padLeft: 12, size: 11 }).xml);
    y += 70;
  });

  o.push(panel(24, y + 6, W - 48, 164, 'The derived-state trap, which is the same trap every time', 'bad').xml);

  o.push(codeCard(44, y + 40, 362, 76, '// two sources of truth\nconst [items, setItems] = useState(props.items);\nconst [count, setCount] = useState(props.items.length);\n// props.items changes → both are now stale', 'bad'));
  o.push(
    box(416, y + 40, 362, 92,
      '**Derive, do not copy.** `const count = items.length` cannot go stale.\n\nIf a prop really must seed state, `key` it from outside so React remounts the component instead of you syncing it in an effect.',
      'ok', { align: 'left', padLeft: 12, size: 11 }).xml
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   The map
   ══════════════════════════════════════════════════════════════════ */

function guideMap() {
  const o = [];
  const H = 600;

  o.push(title('The React guide, as a map', 'What depends on what — read across, not down'));

  const tiers = [
    ['The model', ['elements → fiber → DOM', 'render → commit → effects', 'reconciliation & keys', 'one-way data flow'], 'accent'],
    ['The tools', ['useState & closures', 'hook slots & the rules', 'useEffect & cleanup', 'useRef', 'useReducer'], 'info'],
    ['Performance', ['what triggers a render', 'memo & references', 'composition', 'context', 'virtualise & split'], 'warn'],
    ['Patterns', ['HOC · render props', 'compound components', 'controlled inputs', 'portals · boundaries'], 'ok'],
    ['At the edges', ['CSR · SSR · SSG · ISR', 'server components', 'concurrent features', 'testing · a11y · scale'], 'bad'],
  ];

  let y = 78;
  tiers.forEach(([name, items, tone]) => {
    o.push(box(24, y, 150, 82, name, tone, { size: 13, bold: true, rx: 10 }).xml);
    items.forEach((item, i) => {
      const cols = 3;
      const cw = (W - 48 - 160) / cols - 8;
      const x = 184 + (i % cols) * (cw + 8);
      const iy = y + Math.floor(i / cols) * 40;
      o.push(box(x, iy, cw, 34, item, 'sunken', { size: 10, rx: 8 }).xml);
    });
    y += 98;
  });

  o.push(
    text(24, y + 4, W - 48, 34, 'Everything in *Performance* is a consequence of *The model* — if "what triggers a render" is not obvious yet, that is the row to go back to, not a memo to add.', {
      size: 11,
      color: C.fg,
      align: 'center',
    }).xml
  );

  return { width: W, height: H, cells: o.join('') };
}

export const DIAGRAMS = {
  three_trees: { title: 'Elements, Fiber and the DOM', build: threeTrees },
  render_commit_effects: { title: 'Render, commit, paint, effects', build: renderCommitEffects },
  effect_deps_cleanup: { title: 'Effect dependencies and cleanup', build: effectDepsCleanup },
  reconciliation_keys: { title: 'Reconciliation and keys', build: reconciliationKeys },
  one_way_dataflow: { title: 'One-way data flow', build: oneWayDataflow },
  rerender_triggers: { title: 'What triggers a re-render', build: rerenderTriggers },
  hook_slots: { title: 'Hooks are positional slots', build: hookSlots },
  stale_closure: { title: 'The stale closure', build: staleClosure },
  batching_updates: { title: 'Batching and the update queue', build: batchingUpdates },
  memo_reference_trap: { title: 'memo and the reference trap', build: memoReferenceTrap },
  composition_over_memo: { title: 'Composition instead of memo', build: compositionOverMemo },
  context_propagation: { title: 'Context and re-renders', build: contextPropagation },
  state_ladder: { title: 'Where state should live', build: stateLadder },
  server_vs_client_state: { title: 'Server state is a cache', build: serverVsClientState },
  reducer_vs_state: { title: 'useReducer vs useState', build: reducerVsState },
  redux_flow: { title: 'Redux in one picture', build: reduxFlow },
  concurrent_lanes: { title: 'Concurrent React', build: concurrentLanes },
  suspense_lazy: { title: 'Suspense and lazy', build: suspenseLazy },
  rendering_strategies_react: { title: 'CSR, SSR, SSG and ISR', build: renderingStrategiesReact },
  rsc_boundary: { title: 'Server Components and the boundary', build: rscBoundary },
  virtualization: { title: 'Virtualising a big list', build: virtualization },
  refs_escape_hatch: { title: 'Refs, the escape hatch', build: refsEscapeHatch },
  portals_stacking: { title: 'Portals', build: portalsStacking },
  error_boundaries: { title: 'Error boundaries', build: errorBoundaries },
  fetch_waterfalls: { title: 'Request waterfalls', build: fetchWaterfalls },
  race_conditions: { title: 'Race conditions in data fetching', build: raceConditions },
  strictmode_double_invoke: { title: "StrictMode's double invoke", build: strictmodeDoubleInvoke },
  custom_hook_boundary: { title: 'Custom hooks share logic, not state', build: customHookBoundary },
  controlled_uncontrolled: { title: 'Controlled vs uncontrolled inputs', build: controlledUncontrolled },
  a11y_tree: { title: 'The accessibility tree', build: a11yTree },
  testing_pyramid: { title: 'Test behaviour, not implementation', build: testingPyramid },
  microfrontend_topology: { title: 'Micro-frontend topology', build: microfrontendTopology },
  useid_ssr: { title: 'useId and hydration', build: useIdSsr },
  component_anatomy: { title: 'Anatomy of a component', build: componentAnatomy },
  guide_map: { title: 'The React guide as a map', build: guideMap },
};
