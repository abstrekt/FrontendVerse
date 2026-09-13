/**
 * Diagrams for the Web Fundamentals section.
 *
 * Same DSL, palette and furniture as the other sets — `drawio-builder.mjs` for
 * the helpers, `diagram-furniture.mjs` for the 820px canvas, the heading pair
 * and the takeaway strip.
 *
 * These four are all *time* diagrams in disguise: what the browser is doing
 * while it waits, and what a change costs at each stage. A table can list
 * `async` and `defer`; only a timeline shows that one of them leaves a hole in
 * the middle of parsing.
 */

import { C, box, text, arrow, panel, rule, pill } from './drawio-builder.mjs';
import { W, title, takeaway, legend } from './diagram-furniture.mjs';

/* ── 1 · The render pipeline ──────────────────────────────────────── */

function renderPipeline() {
  const o = [];
  const H = 574;

  o.push(
    title(
      'From HTML to pixels',
      'Six stages, always in this order — and the property you change decides how many of them run again'
    )
  );

  o.push(
    text(24, 70, W - 48, 16, '1 · The pipeline', { size: 11.5, bold: true, color: C.fg }).xml
  );

  o.push(box(24, 96, 140, 44, 'HTML bytes', 'sunken', { size: 10 }).xml);
  o.push(arrow(166, 118, 192, 118, { color: C.line, width: 1.4 }).xml);
  o.push(box(196, 96, 140, 44, '**DOM**\ntree of nodes', 'accent', { size: 9.5 }).xml);

  o.push(box(24, 152, 140, 44, 'CSS bytes', 'sunken', { size: 10 }).xml);
  o.push(arrow(166, 174, 192, 174, { color: C.line, width: 1.4 }).xml);
  o.push(box(196, 152, 140, 44, '**CSSOM**\ntree of styles', 'info', { size: 9.5 }).xml);

  o.push(arrow(338, 118, 376, 132, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(338, 174, 376, 160, { color: C.line, width: 1.4 }).xml);

  o.push(box(380, 96, 150, 100, '**Render tree**\nonly what is visible\n\n`display:none` → absent\n`visibility:hidden` → present', 'accent', { size: 8.5 }).xml);
  o.push(arrow(532, 146, 558, 146, { color: C.line, width: 1.4 }).xml);
  o.push(box(562, 96, 112, 100, '**Layout**\ngeometry in\nreal pixels\n\n`%` → px', 'warn', { size: 9 }).xml);
  o.push(arrow(676, 146, 700, 146, { color: C.line, width: 1.4 }).xml);
  o.push(box(704, 96, 92, 100, '**Paint**\nfill in\npixels,\nper layer', 'warn', { size: 9 }).xml);

  o.push(arrow(750, 198, 750, 216, { color: C.line, width: 1.4 }).xml);
  o.push(box(380, 218, 416, 34, '**Composite** — assemble the layers, on the GPU where it can', 'ok', { size: 9.5 }).xml);

  /* 2 · What a change costs */

  o.push(rule(24, 268, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 278, W - 48, 16, '2 · What re-runs when you change one property', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const COST = [
    ['`width`, `top`, `font-size`\nadding a node', ['Layout', 'Paint', 'Composite'], 'bad'],
    ['`color`, `background`\n`box-shadow`', ['—', 'Paint', 'Composite'], 'warn'],
    ['`transform`, `opacity`', ['—', '—', 'Composite'], 'ok'],
  ];

  COST.forEach(([label, stages, t], i) => {
    const y = 306 + i * 44;
    o.push(text(24, y, 210, 38, label, { size: 9, color: C.fg }).xml);
    stages.forEach((s, j) => {
      const x = 248 + j * 186;
      const on = s !== '—';
      o.push(box(x, y, 174, 38, on ? s : 'skipped', on ? t : 'sunken', { size: 9, rx: 6 }).xml);
    });
  });

  o.push(
    text(24, 444, W - 48, 14, 'Sixty frames a second is 16.7 ms per frame. A layout pass over a large tree does not fit in it; a composite does.', {
      size: 9,
      align: 'center',
      italic: true,
    }).xml
  );

  o.push(
    box(24, 468, W - 48, 40, '**The preload scanner** races ahead while the parser is blocked and starts downloading anything it can see — but it only reads *markup*. A font named inside a stylesheet, or a chunk imported by JavaScript, is invisible to it.', 'info', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  o.push(
    takeaway(
      518,
      'CSS blocks the paint and a synchronous script blocks the parse — and a script that reads layout ends up blocked on the CSS too. Animate `transform` and `opacity` because they skip the two expensive stages entirely.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── 2 · Script loading ───────────────────────────────────────────── */

function scriptLoading() {
  const o = [];
  const H = 570;

  o.push(
    title(
      'Script loading — blocking, `async`, `defer`',
      'Same file, same size, three very different first paints'
    )
  );

  /* A shared time axis, 140 → 796 px = 0 → 800 ms. */
  const X0 = 150;
  const X1 = 796;
  const ms = (v) => X0 + (v / 800) * (X1 - X0);

  o.push(arrow(X0, 88, X1, 88, { color: C.line, width: 1, endArrow: 'none', dashed: true }).xml);
  for (const t of [0, 200, 400, 600, 800]) {
    o.push(text(ms(t) - 30, 68, 60, 14, `${t} ms`, { size: 9, align: 'center' }).xml);
  }

  const ROWS = [
    {
      y: 104,
      name: '`<script src>`',
      tone: C.bad,
      net: [[0, 300, 'download', 'info']],
      parse: [
        [0, 0, '', ''],
        [0, 300, 'parser STOPPED — blank screen', 'bad'],
        [300, 380, 'execute', 'warn'],
        [380, 700, 'parse the rest', 'sunken'],
      ],
      dcl: 700,
      note: 'The parser stops for the whole round trip *and* the execution. Every millisecond of that is nothing on screen.',
    },
    {
      y: 216,
      name: '`<script async>`',
      tone: C.warn,
      net: [[0, 300, 'download, in parallel', 'info']],
      parse: [
        [0, 300, 'parse HTML', 'sunken'],
        [300, 380, 'execute (interrupts)', 'warn'],
        [380, 620, 'parse the rest', 'sunken'],
      ],
      dcl: 620,
      note: 'Downloads in parallel, but runs the instant it lands — mid-document, and in whatever order the network returns.',
    },
    {
      y: 328,
      name: '`<script defer>`',
      tone: C.ok,
      net: [[0, 300, 'download, in parallel', 'info']],
      parse: [
        [0, 560, 'parse HTML — never interrupted', 'ok'],
        [560, 640, 'execute, in order', 'ok'],
      ],
      dcl: 640,
      note: 'Parallel download, uninterrupted parse, execution in order with the whole DOM available. The default for your own code.',
    },
  ];

  for (const r of ROWS) {
    o.push(text(24, r.y + 16, 120, 20, r.name, { size: 10, bold: true, color: r.tone }).xml);

    o.push(text(24, r.y + 40, 120, 16, 'network', { size: 8.5, align: 'right' }).xml);
    for (const [a, b, label, t] of r.net) {
      o.push(box(ms(a), r.y + 38, ms(b) - ms(a), 22, label, t, { size: 8.5, rx: 5 }).xml);
    }

    o.push(text(24, r.y + 66, 120, 16, 'main thread', { size: 8.5, align: 'right' }).xml);
    for (const [a, b, label, t] of r.parse) {
      if (b <= a) continue;
      o.push(box(ms(a), r.y + 64, ms(b) - ms(a), 24, label, t, { size: 8.5, rx: 5 }).xml);
    }

    o.push(arrow(ms(r.dcl), r.y + 92, ms(r.dcl), r.y + 66, { color: C.accent, width: 1.4 }).xml);
    o.push(text(ms(r.dcl) - 60, r.y + 92, 120, 14, 'DOMContentLoaded', { size: 8, align: 'center', color: C.accent }).xml);

    o.push(text(150, r.y + 6, 646, 14, r.note, { size: 8.5 }).xml);
  }

  o.push(
    takeaway(
      452,
      '`defer` for your own code — parallel download, in-document-order execution, DOM guaranteed. `async` only for a third party that touches nothing of yours. A plain `<script>` in the head is a blank screen for the length of a round trip.'
    )
  );

  o.push(
    text(24, 512, W - 48, 26, 'Inline scripts always block, attribute or not. `type="module"` is deferred by default — even inline — and fetched with CORS.', {
      size: 9,
      align: 'center',
      italic: true,
    }).xml
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── 3 · Font loading ─────────────────────────────────────────────── */

function fontLoading() {
  const o = [];
  const H = 596;

  o.push(
    title(
      'Web fonts — why they arrive late, and what the user sees meanwhile',
      'Two round trips before the request even starts, and then a choice between invisible text and moving text'
    )
  );

  /* 1 · Discovery chain */

  o.push(
    text(24, 70, W - 48, 16, '1 · The font is discovered two round trips late', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const CHAIN = ['`index.html`', '`app.css`', 'parse CSS,\nmatch `@font-face`', '`inter.woff2`'];
  CHAIN.forEach((c, i) => {
    const x = 24 + i * 198;
    o.push(box(x, 96, 178, 44, c, i === 3 ? 'warn' : 'sunken', { size: 9 }).xml);
    if (i < 3) {
      o.push(arrow(x + 180, 118, x + 196, 118, { color: C.line, width: 1.3 }).xml);
      o.push(text(x + 120, 142, 136, 14, i === 1 ? 'no network cost' : 'round trip', { size: 8, align: 'center' }).xml);
    }
  });

  o.push(arrow(100, 168, 700, 168, { color: C.ok, width: 1.6, dashed: true }).xml);
  o.push(
    text(100, 172, 600, 16, '`<link rel="preload" as="font" crossorigin>` — starts the request with the HTML, skipping the chain', {
      size: 9,
      align: 'center',
      color: C.ok,
    }).xml
  );

  /* 2 · Three outcomes */

  o.push(rule(24, 200, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 210, W - 48, 16, '2 · What the user sees while it loads', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const CASES = [
    {
      x: 24,
      tone: 'bad',
      name: 'FOIT — `font-display: block`',
      frames: [['0 ms', '', 'bad'], ['600 ms', '', 'bad'], ['900 ms', 'Headline', 'ok']],
      note: 'Nothing is readable for up to three seconds. The layout is right; the words are missing.',
    },
    {
      x: 284,
      tone: 'warn',
      name: 'FOUT — `swap`',
      frames: [['0 ms', 'Headline — fallback', 'warn'], ['600 ms', 'Headline — fallback', 'warn'], ['900 ms', 'Headline', 'ok']],
      note: 'Readable immediately, but the fallback has different metrics — so everything below it jumps on the swap.',
    },
    {
      x: 544,
      tone: 'ok',
      name: '`swap` + metric-matched fallback',
      frames: [['0 ms', 'Headline — matched', 'info'], ['600 ms', 'Headline — matched', 'info'], ['900 ms', 'Headline', 'ok']],
      note: 'Same box, different glyphs. Readable at once and nothing moves — `size-adjust` and `ascent-override` do this.',
    },
  ];

  for (const c of CASES) {
    o.push(panel(c.x, 234, 252, 186, c.name, c.tone).xml);
    c.frames.forEach(([t, label, tone], i) => {
      const y = 270 + i * 38;
      o.push(text(c.x + 12, y, 44, 30, t, { size: 8.5, align: 'right' }).xml);
      o.push(box(c.x + 62, y, 176, 30, label || '(invisible)', tone, { size: 9.5, bold: !!label }).xml);
    });
    o.push(text(c.x + 12, 384, 228, 32, c.note, { size: 8.5 }).xml);
  }

  /* 3 · font-display */

  o.push(rule(24, 436, W - 48, { dashed: true }).xml);
  const VALUES = [
    ['`block`', 'bad', '~3 s invisible'],
    ['`swap`', 'ok', 'fallback, swap forever'],
    ['`fallback`', 'warn', '100 ms, then give up'],
    ['`optional`', 'info', 'only if cached — zero shift'],
    ['`auto`', 'sunken', 'browser default = FOIT'],
  ];
  VALUES.forEach(([name, t, why], i) => {
    const x = 24 + i * 158;
    o.push(pill(x, 448, 150, 24, name, t === 'sunken' ? 'accent' : t, { size: 9.5, mono: true }).xml);
    o.push(text(x, 476, 150, 30, why, { size: 8.5, align: 'center' }).xml);
  });

  o.push(
    takeaway(
      518,
      'Self-host, subset, `woff2` only, `preload` with `crossorigin`, and `font-display: swap` behind a metric-matched fallback. That combination gives readable text on the first paint with no layout shift — which is the whole problem.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── 4 · The bundler pipeline ─────────────────────────────────────── */

function bundlerPipeline() {
  const o = [];
  const H = 604;

  o.push(
    title(
      'What a bundler actually does',
      'Four jobs. Naming the one your problem is in makes the problem much smaller'
    )
  );

  const STAGES = [
    {
      x: 24,
      tone: 'accent',
      n: '1 · Resolve',
      rows: ['`./utils` → `./utils.ts`', '`react` → `node_modules/…`', 'via `exports`, conditions'],
      note: '"Module not found" lives here.',
    },
    {
      x: 222,
      tone: 'info',
      n: '2 · Transform',
      rows: ['TS stripped, JSX compiled', 'CSS extracted, SVG inlined', 'syntax lowered to targets'],
      note: 'esbuild / SWC — where the speed came from.',
    },
    {
      x: 420,
      tone: 'warn',
      n: '3 · Graph',
      rows: ['follow every static import', 'mark each `import()`', 'as a split point'],
      note: 'Nothing else creates a chunk boundary.',
    },
    {
      x: 618,
      tone: 'ok',
      n: '4 · Emit',
      rows: ['cut into chunks, minify', 'hash the filenames', 'write the manifest'],
      note: 'Tree shaking happens here — production only.',
    },
  ];

  for (const s of STAGES) {
    o.push(panel(s.x, 82, 178, 162, s.n, s.tone).xml);
    s.rows.forEach((r, i) => {
      o.push(box(s.x + 12, 116 + i * 30, 154, 26, r, 'sunken', { size: 8, rx: 5 }).xml);
    });
    o.push(text(s.x + 12, 208, 154, 30, s.note, { size: 8, align: 'center' }).xml);
    if (s.x < 618) o.push(arrow(s.x + 182, 160, s.x + 196, 160, { color: C.line, width: 1.4 }).xml);
  }

  /* Graph → chunks */

  o.push(rule(24, 262, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 272, W - 48, 16, 'The graph, and the chunks it becomes', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(panel(24, 296, 340, 190, 'Module graph', 'accent').xml);
  o.push(box(140, 326, 108, 26, '`main.tsx`', 'accent', { size: 8.5, rx: 5 }).xml);
  const KIDS = [
    [44, '`App.tsx`', 'sunken'],
    [160, '`react`', 'info'],
    [258, '`utils.ts`', 'sunken'],
  ];
  for (const [x, label, t] of KIDS) {
    o.push(arrow(194, 354, x + 44, 374, { color: C.line, width: 1.1 }).xml);
    o.push(box(x, 376, 88, 26, label, t, { size: 8, rx: 5 }).xml);
  }
  o.push(arrow(88, 404, 88, 424, { color: C.warn, width: 1.2, dashed: true }).xml);
  o.push(box(40, 426, 176, 26, '`import("./Chart")`', 'warn', { size: 8, rx: 5, mono: true }).xml);
  o.push(text(40, 454, 300, 26, 'A dynamic import is a split point — everything under it becomes its own chunk.', { size: 8 }).xml);

  o.push(arrow(370, 390, 402, 390, { color: C.line, width: 1.6 }).xml);

  o.push(panel(416, 296, 380, 190, 'Emitted chunks — split by change frequency', 'ok').xml);
  const CHUNKS = [
    ['`react.4f1c.js`', 'framework — changes quarterly', 'ok'],
    ['`vendor.9b02.js`', 'other dependencies — monthly', 'ok'],
    ['`index.8f3a.js`', 'your app shell — daily', 'warn'],
    ['`Chart.2d77.js`', 'lazy route — only when opened', 'info'],
  ];
  CHUNKS.forEach(([name, why, t], i) => {
    const y = 328 + i * 34;
    o.push(box(430, y, 150, 26, name, t, { size: 8, mono: true, rx: 5 }).xml);
    o.push(text(590, y, 196, 26, why, { size: 8 }).xml);
  });

  o.push(
    text(416, 462, 380, 20, 'A deploy invalidates only the chunks that changed — that is the point of the split.', {
      size: 8.5,
      align: 'center',
      italic: true,
    }).xml
  );

  o.push(
    takeaway(
      500,
      'Dev and production are two different pipelines: the dev server skips bundling, minification and tree shaking entirely. That is why "works in dev, broken in the build" is nearly always a side effect that tree shaking removed.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── 5 · The accessibility tree ───────────────────────────────────── */

function a11yTree() {
  const o = [];
  const H = 578;

  o.push(
    title(
      'The DOM and the accessibility tree',
      'The second tree is what a screen reader reads — and a `div` contributes nothing to it'
    )
  );

  /* 1 · Two trees from one markup */

  o.push(
    text(24, 70, W - 48, 16, '1 · One document, two trees', { size: 11.5, bold: true, color: C.fg }).xml
  );

  o.push(panel(24, 94, 250, 210, 'Your markup', 'sunken').xml);
  const MARKUP = [
    '`<header>`',
    '  `<h1>Settings</h1>`',
    '`<main>`',
    '  `<button>Save</button>`',
    '  `<div onclick>Cancel</div>`',
    '  `<img src=… alt="">`',
  ];
  MARKUP.forEach((m, i) => {
    o.push(text(38, 128 + i * 26, 222, 22, m, { size: 8.5, mono: true, color: C.fg }).xml);
  });

  o.push(arrow(280, 180, 306, 160, { color: C.accent, width: 1.4 }).xml);
  o.push(arrow(280, 200, 306, 226, { color: C.ok, width: 1.4 }).xml);

  o.push(panel(310, 94, 236, 100, 'DOM', 'accent').xml);
  o.push(text(324, 126, 208, 60, 'Every element, in order.\nWhat CSS styles and what your\nJavaScript queries.', { size: 8.5 }).xml);

  o.push(panel(310, 204, 486, 100, 'Accessibility tree', 'ok').xml);
  const A11Y = [
    ['`banner`', 'header'],
    ['`heading` level 1 — "Settings"', 'h1'],
    ['`main`', 'main'],
    ['`button` — "Save"', 'button'],
    ['`generic` — no name, not focusable', 'div'],
    ['*(nothing — alt="" is decorative)*', 'img'],
  ];
  A11Y.forEach(([node, from], i) => {
    const y = 232 + (i % 3) * 22;
    const x = 324 + Math.floor(i / 3) * 240;
    o.push(text(x, y, 228, 20, node, { size: 8, color: i === 4 ? C.bad : C.fg }).xml);
  });

  /* 2 · What a node carries */

  o.push(rule(24, 318, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 328, W - 48, 16, '2 · What every node carries — and where each part comes from', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const PARTS = [
    ['Role', 'accent', 'the element itself, or `role="…"`'],
    ['Name', 'info', 'content · `<label>` · `aria-label` · `alt`'],
    ['State', 'warn', '`disabled` · `checked` · `aria-expanded`'],
    ['Value', 'ok', "the control's current value"],
  ];
  PARTS.forEach(([name, t, from], i) => {
    const x = 24 + i * 194;
    o.push(box(x, 352, 178, 26, name, t, { size: 10, rx: 8 }).xml);
    o.push(text(x, 380, 178, 34, from, { size: 8, align: 'center' }).xml);
  });

  /* 3 · button vs div */

  o.push(rule(24, 422, W - 48, { dashed: true }).xml);
  o.push(box(24, 434, 372, 74, '`<button>Save</button>`\n\nrole · focusable · Enter and Space · disabled state · focus ring · submits a form', 'ok', {
    size: 9,
    align: 'left',
    padLeft: 12,
  }).xml);
  o.push(box(424, 434, 372, 74, '`<div onclick>Save</div>`\n\nrole `generic` · not focusable · no keyboard · no state · invisible to a screen reader', 'bad', {
    size: 9,
    align: 'left',
    padLeft: 12,
  }).xml);

  o.push(
    takeaway(
      518,
      'The accessible name wins over the visible text: `<button aria-label="Submit form">Save</button>` cannot be activated by a voice-control user saying "click Save". Keep the two the same, and prefer the native element to any amount of ARIA.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── 6 · Layout systems ───────────────────────────────────────────── */

function layoutSystems() {
  const o = [];
  const H = 580;

  o.push(
    title(
      'Flow, flex and grid — the same six boxes, three systems',
      'The question that decides it: do the items in the other direction have to line up?'
    )
  );

  const CASES = [
    {
      x: 24,
      tone: 'sunken',
      name: 'Flow',
      draw: (bx, by) => {
        const out = [];
        [46, 30, 30, 38].forEach((h, i) => {
          out.push(box(bx, by + [0, 54, 88, 122][i], 224, h, ['heading', 'paragraph', 'paragraph', 'figure'][i], 'sunken', { size: 8.5, rx: 5 }).xml);
        });
        return out;
      },
      note: 'Blocks stack, inline content flows, margins collapse. Still the right answer for a document.',
    },
    {
      x: 284,
      tone: 'info',
      name: 'Flex — one axis',
      draw: (bx, by) => {
        const out = [];
        [70, 54, 92].forEach((w, i) => {
          const xs = [0, 78, 140];
          out.push(box(bx + xs[i], by, w, 34, `item ${i + 1}`, 'info', { size: 8, rx: 5 }).xml);
        });
        [92, 70, 54].forEach((w, i) => {
          const xs = [0, 100, 178];
          out.push(box(bx + xs[i], by + 44, w, 34, `item ${i + 4}`, 'info', { size: 8, rx: 5 }).xml);
        });
        out.push(text(bx, by + 88, 224, 30, 'Items size themselves, then the leftover space is distributed. Row two does **not** line up with row one.', { size: 8 }).xml);
        return out;
      },
      note: 'A toolbar, a chip list, a card footer — anything that is one row or one column.',
    },
    {
      x: 544,
      tone: 'ok',
      name: 'Grid — two axes',
      draw: (bx, by) => {
        const out = [];
        for (let r = 0; r < 2; r += 1) {
          for (let c = 0; c < 3; c += 1) {
            out.push(box(bx + c * 76, by + r * 44, 70, 34, `${r * 3 + c + 1}`, 'ok', { size: 8, rx: 5 }).xml);
          }
        }
        out.push(text(bx, by + 88, 224, 30, 'You declare the tracks; items land in them. Columns line up **across** rows, which is the whole point.', { size: 8 }).xml);
        return out;
      },
      note: 'A page shell, a form with aligned columns, a gallery. `repeat(auto-fill, minmax(220px, 1fr))`.',
    },
  ];

  for (const c of CASES) {
    o.push(panel(c.x, 82, 252, 262, c.name, c.tone).xml);
    o.push(c.draw(c.x + 14, 118).join(''));
    o.push(text(c.x + 14, 296, 224, 38, c.note, { size: 8.5 }).xml);
  }

  /* The decision */

  o.push(rule(24, 358, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 368, W - 48, 16, 'Choosing, and the two escapes people never find', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const RULES = [
    ['Other direction must align?', 'accent', 'yes → grid · no → flex'],
    ['`gap`', 'ok', 'in both. Margin hacks are over'],
    ['`min-width: 0`', 'warn', 'why flex text will not truncate'],
    ['`minmax(0, 1fr)`', 'warn', 'the grid version of the same fix'],
  ];
  RULES.forEach(([name, t, why], i) => {
    const x = 24 + i * 194;
    o.push(box(x, 392, 178, 26, name, t, { size: 9, rx: 8, mono: name.startsWith('`') }).xml);
    o.push(text(x, 420, 178, 30, why, { size: 8, align: 'center' }).xml);
  });

  o.push(
    box(24, 458, W - 48, 34, 'Modern defaults worth adopting now: **container queries** (a component responds to its own width), **logical properties** (`margin-inline`, `padding-block` — they flip in RTL), and `clamp()` instead of three breakpoints.', 'info', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  o.push(
    takeaway(
      502,
      'Nesting is the normal case, not a compromise: a grid page shell whose header is a flex row. Reach for grid when alignment crosses both axes, flex when it does not, and let flow keep doing what it already does well.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── 7 · Service worker ───────────────────────────────────────────── */

function serviceWorker() {
  const o = [];
  const H = 596;

  o.push(
    title(
      'The service worker — a proxy you write',
      'Its own thread, its own lifecycle, and every in-scope request passes through it'
    )
  );

  /* 1 · Where it sits */

  o.push(
    text(24, 70, W - 48, 16, '1 · The interception point', { size: 11.5, bold: true, color: C.fg }).xml
  );

  o.push(box(24, 96, 130, 50, 'Page\n`fetch()` / `<img>`', 'accent', { size: 9 }).xml);
  o.push(arrow(156, 121, 186, 121, { color: C.line, width: 1.4 }).xml);
  o.push(box(190, 96, 170, 50, '**Service worker**\n`fetch` event', 'warn', { size: 9.5 }).xml);

  o.push(arrow(362, 108, 400, 108, { color: C.ok, width: 1.4 }).xml);
  o.push(box(404, 92, 170, 26, 'Cache Storage → respond', 'ok', { size: 8.5, rx: 6 }).xml);
  o.push(arrow(362, 134, 400, 134, { color: C.info, width: 1.4 }).xml);
  o.push(box(404, 120, 170, 26, 'Network → respond, store', 'info', { size: 8.5, rx: 6 }).xml);
  o.push(arrow(576, 121, 606, 121, { color: C.line, width: 1.2, dashed: true }).xml);
  o.push(box(610, 96, 186, 50, 'HTTP cache, then the\nnetwork', 'sunken', { size: 8.5 }).xml);

  o.push(
    text(24, 154, W - 48, 14, 'The page never knows which of the two answered. That is the power, and the reason a bad strategy is invisible until users complain.', {
      size: 9,
      align: 'center',
      italic: true,
    }).xml
  );

  /* 2 · Lifecycle */

  o.push(rule(24, 178, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 188, W - 48, 16, '2 · The lifecycle — and the step that causes the bugs', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const STEPS = [
    ['**install**', 'accent', 'precache the shell'],
    ['**waiting**', 'bad', 'the old worker still controls open pages'],
    ['**activate**', 'warn', 'delete stale caches'],
    ['**fetch**', 'ok', 'every in-scope request, until replaced'],
  ];
  STEPS.forEach(([name, t, why], i) => {
    const x = 24 + i * 198;
    o.push(box(x, 212, 178, 30, name, t, { size: 10, rx: 8 }).xml);
    o.push(text(x, 244, 178, 30, why, { size: 8, align: 'center' }).xml);
    if (i < 3) o.push(arrow(x + 180, 227, x + 196, 227, { color: C.line, width: 1.3 }).xml);
  });

  o.push(
    box(24, 280, W - 48, 32, '**waiting** is where updates go wrong: a new worker sits idle until every tab using the old one is gone. `skipWaiting()` jumps the queue — and hands a running page a worker it was not built against. Prompt, then reload.', 'bad', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  /* 3 · Strategies */

  o.push(rule(24, 326, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 336, W - 48, 16, '3 · Strategy per request kind', { size: 11.5, bold: true, color: C.fg }).xml
  );

  const STRATS = [
    ['Cache-first', 'ok', 'hashed assets, fonts', 'Stale forever if the URL is not versioned'],
    ['Network-first', 'info', 'HTML, API `GET`s', 'Slow when the network is slow-but-alive'],
    ['Stale-while-revalidate', 'warn', 'avatars, feeds', 'The user sees the previous value once'],
    ['Network-only', 'bad', 'anything authenticated or mutating', 'Never cache a mutation'],
  ];
  STRATS.forEach(([name, t, use, risk], i) => {
    const y = 360 + i * 40;
    o.push(box(24, y, 200, 32, name, t, { size: 9, rx: 6 }).xml);
    o.push(text(236, y, 240, 32, use, { size: 8.5 }).xml);
    o.push(text(486, y, 310, 32, risk, { size: 8.5, color: C.muted }).xml);
  });

  o.push(
    takeaway(
      530,
      'Cache-first on the HTML is the one that ends careers: your deploy never reaches the user, and the fix is behind the same cached page — except unlike a CDN, this copy lives on their device and you cannot purge it.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

export const DIAGRAMS = {
  'render-pipeline': {
    title: 'From HTML to pixels — the render pipeline',
    build: renderPipeline,
  },
  'script-loading': {
    title: 'Script loading — blocking, async and defer',
    build: scriptLoading,
  },
  'font-loading': {
    title: 'Web font loading — FOIT, FOUT and the fix',
    build: fontLoading,
  },
  'bundler-pipeline': {
    title: 'What a bundler does — resolve, transform, graph, emit',
    build: bundlerPipeline,
  },
  'a11y-tree': {
    title: 'The DOM and the accessibility tree',
    build: a11yTree,
  },
  'layout-systems': {
    title: 'Flow, flex and grid — the same content, three systems',
    build: layoutSystems,
  },
  'service-worker': {
    title: 'The service worker — interception, lifecycle, strategies',
    build: serviceWorker,
  },
};
