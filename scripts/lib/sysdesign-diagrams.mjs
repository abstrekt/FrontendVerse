/**
 * The frontend system design diagrams.
 *
 * One entry per `DIAGRAMS` key. Each `build()` returns `{ width, height, cells }`.
 *
 * Same design rules as the Blind 75 set (`blind75-diagrams.mjs`), restated
 * because they are what keeps these from turning into box-and-arrow wallpaper:
 *
 * - **Show the mechanism, not a flowchart of the mechanism.** "SSR is faster to
 *   first paint" is a claim; four timelines with the paint marker in a
 *   different place on each is the evidence. Draw the thing that moves.
 * - **The cost stays on screen next to the fix.** An architecture is chosen for
 *   what it removes, so the naive version keeps its half of the canvas.
 * - **One canvas width (820px)**, sized to the article's reading column.
 * - **One meaning per colour.** Red is the cost being paid, green the win,
 *   amber the rule worth memorising, indigo the mechanism, blue an aside.
 *
 * Colours come from `C` only — `svg-postprocess.mjs` rewrites those exact hexes
 * to `--dg-*` custom properties so the diagram follows the app's theme toggle.
 * A stray hex shows up as `⚠ unmapped` at build time and fails the build.
 */

import { C, box, text, panel, arrow, cells, pill, rule } from './drawio-builder.mjs';
import { W, title, takeaway, legend } from './diagram-furniture.mjs';

/* ── Shared furniture ─────────────────────────────────────────────── */

const TONE_STROKE = { accent: C.accent, ok: C.ok, bad: C.bad, warn: C.warn, info: C.info };

/** Milliseconds → pixels on the shared timeline scale. */
const MS = 0.2;

/**
 * A horizontal run of time segments laid end to end.
 *
 * `segs` is `[{ ms, label, tone, hatch }]`. A segment narrower than its label
 * gets the label above the bar instead of inside it — a 90 ms CDN response is
 * 18px wide and there is no font size at which "CDN HTML" fits in it.
 */
function track(x, y, segs, opts = {}) {
  const h = opts.h ?? 26;
  const size = opts.size ?? 10;
  const out = [];
  let cx = x;
  for (const seg of segs) {
    const w = Math.round(seg.ms * MS);
    const fits = w >= (seg.label ?? '').length * size * 0.52;
    out.push(
      box(cx, y, w, h, fits ? (seg.label ?? '') : '', seg.tone ?? 'sunken', {
        size,
        rx: 6,
        dashed: seg.hatch,
        mono: seg.mono,
      }).xml
    );
    if (!fits && seg.label) {
      out.push(
        text(cx - 30, y - 15, w + 60, 14, seg.label, {
          align: 'center',
          size: 9,
          color: TONE_STROKE[seg.tone] ?? C.muted,
        }).xml
      );
    }
    cx += w + (opts.gap ?? 2);
  }
  return { xml: out.join(''), end: cx - (opts.gap ?? 2) };
}

/**
 * A milestone caret under a timeline — FCP, TTI, the moment it goes wrong.
 *
 * `tier` drops the label a line. CSR reaches first paint and interactive ~40px
 * apart, and two 90px-wide centred labels at the same height overprint.
 */
function milestone(x, y, labelText, t = 'ok', tier = 0) {
  const colour = TONE_STROKE[t];
  const drop = tier * 13;
  return [
    arrow(x, y + 16 + drop, x, y + 2, { color: colour, width: 1.6, endArrow: 'blockThin' }).xml,
    text(x - 45, y + 15 + drop, 90, 14, labelText, {
      align: 'center',
      size: 9,
      bold: true,
      color: colour,
    }).xml,
  ].join('');
}

/** The label block at the head of a comparison row. */
function rowLabel(x, y, name, sub) {
  return [
    text(x, y, 128, 16, name, { size: 12, bold: true, color: C.fg }).xml,
    text(x, y + 15, 128, 26, sub, { size: 9.5, color: C.muted }).xml,
  ].join('');
}

/** A tick scale under the last timeline row so the bars mean something. */
function timeAxis(x, y, maxMs, step = 500) {
  const out = [rule(x, y, maxMs * MS, { color: C.line, dashed: true }).xml];
  for (let ms = 0; ms <= maxMs; ms += step) {
    const tx = x + ms * MS;
    out.push(arrow(tx, y, tx, y + 4, { color: C.line, width: 1, endArrow: 'none' }).xml);
    out.push(
      text(tx - 30, y + 4, 60, 13, ms === 0 ? '0' : `${ms / 1000}s`, {
        align: 'center',
        size: 9,
        color: C.muted,
      }).xml
    );
  }
  return out.join('');
}

/* ══════════════════════════════════════════════════════════════════
   1 — Rendering strategies
   ══════════════════════════════════════════════════════════════════ */

function renderingStrategies() {
  const o = [];
  const H = 600;
  const X = 158; // where every timeline starts
  const AXIS = 2400;

  o.push(
    title(
      'Rendering strategies — where each one moves the paint',
      'Same app, same 700 kB of JS, same 400 ms API. Only who renders the first HTML changes.'
    )
  );

  const rows = [
    {
      name: 'CSR',
      sub: 'Static shell, browser does everything',
      y: 92,
      segs: [
        { ms: 150, label: 'shell', tone: 'sunken' },
        { ms: 700, label: 'download + parse JS', tone: 'info' },
        { ms: 400, label: 'fetch data', tone: 'bad' },
        { ms: 200, label: 'render', tone: 'accent' },
      ],
      // Nothing meaningful is on screen until the data round-trip lands.
      fcpAfter: 3,
      ttiAfter: 4,
      verdict: 'Cheapest to host, latest paint',
      verdictTone: 'bad',
    },
    {
      name: 'SSR',
      sub: 'Server renders HTML per request',
      y: 192,
      segs: [
        { ms: 400, label: 'server render', tone: 'accent' },
        { ms: 150, label: 'HTML', tone: 'ok' },
        { ms: 700, label: 'download + parse JS', tone: 'info' },
        { ms: 300, label: 'hydrate', tone: 'warn' },
      ],
      fcpAfter: 2,
      ttiAfter: 4,
      verdict: 'Early paint, server cost per request',
      verdictTone: 'warn',
    },
    {
      name: 'SSG / ISR',
      sub: 'Rendered at build, served from CDN',
      y: 292,
      segs: [
        { ms: 90, label: 'CDN HTML', tone: 'ok' },
        { ms: 700, label: 'download + parse JS', tone: 'info' },
        { ms: 300, label: 'hydrate', tone: 'warn' },
      ],
      fcpAfter: 1,
      ttiAfter: 3,
      verdict: 'Fastest paint, content can be stale',
      verdictTone: 'ok',
    },
    {
      name: 'Streaming + islands',
      sub: 'Shell first, slow parts stream in',
      y: 392,
      segs: [
        { ms: 90, label: 'shell', tone: 'ok' },
        { ms: 260, label: 'chunk', tone: 'accent' },
        { ms: 260, label: 'chunk', tone: 'accent' },
        { ms: 220, label: 'islands', tone: 'warn' },
      ],
      fcpAfter: 1,
      ttiAfter: 4,
      verdict: 'Early paint AND early interactive',
      verdictTone: 'ok',
    },
  ];

  for (const row of rows) {
    o.push(rowLabel(24, row.y, row.name, row.sub));
    const t = track(X, row.y, row.segs);
    o.push(t.xml);

    // Milestones sit at the end of the segment that actually delivers them.
    const endOf = (n) =>
      X + row.segs.slice(0, n).reduce((sum, s) => sum + Math.round(s.ms * MS) + 2, 0) - 2;

    const fcpX = endOf(row.fcpAfter);
    const ttiX = endOf(row.ttiAfter);
    o.push(milestone(fcpX, row.y + 26, 'first paint', 'ok'));
    // Two centred 90px labels closer than that would overprint — drop one.
    o.push(milestone(ttiX, row.y + 26, 'interactive', 'warn', ttiX - fcpX < 92 ? 1 : 0));

    o.push(pill(X + 490, row.y + 2, 164, 34, row.verdict, row.verdictTone, { size: 9.5 }).xml);
  }

  o.push(timeAxis(X, 478, AXIS));

  o.push(legend(24, 512, [
    ['ok', 'HTML on screen'],
    ['accent', 'render work'],
    ['info', 'JS transfer'],
    ['warn', 'hydration'],
    ['bad', 'blocking round-trip'],
  ]));

  o.push(
    takeaway(
      538,
      'Every strategy ships the same JS, so interactive lands in roughly the same place. What you are choosing is how early something is READABLE — and whether that early HTML costs you a server per request (SSR), staleness (SSG), or added complexity (streaming).'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   2 — Caching layers
   ══════════════════════════════════════════════════════════════════ */

function cachingLayers() {
  const o = [];
  const H = 600;

  o.push(
    title(
      'The five caches a request falls through',
      'Each layer answers faster than the one below it — and goes stale in its own way'
    )
  );

  const layers = [
    {
      name: 'In-memory (React Query / SWR)',
      hit: '~0 ms',
      invalidate: 'refetch on mount, focus, or mutation',
      scope: 'one tab, one session',
      tone: 'ok',
    },
    {
      name: 'Service worker (Cache Storage)',
      hit: '~2 ms',
      invalidate: 'you write the eviction code — nobody else will',
      scope: 'one origin, survives reload & offline',
      tone: 'ok',
    },
    {
      name: 'HTTP cache (disk)',
      hit: '~5 ms',
      invalidate: 'Cache-Control max-age / ETag revalidation',
      scope: 'one browser profile',
      tone: 'accent',
    },
    {
      name: 'CDN edge',
      hit: '~30 ms',
      invalidate: 's-maxage, stale-while-revalidate, purge API',
      scope: 'every user near that POP',
      tone: 'accent',
    },
    {
      name: 'Origin / database',
      hit: '~250 ms',
      invalidate: 'it IS the truth',
      scope: 'everyone',
      tone: 'bad',
    },
  ];

  const X = 150;
  let y = 92;

  o.push(text(24, y - 26, 120, 16, 'request', { size: 11, bold: true, color: C.fg }).xml);

  for (const [i, layer] of layers.entries()) {
    o.push(box(X, y, 268, 46, layer.name, layer.tone, { size: 11.5, bold: true }).xml);
    o.push(pill(X + 278, y + 12, 62, 22, layer.hit, layer.tone, { size: 10, mono: true }).xml);
    o.push(
      text(X + 350, y + 2, 268, 20, layer.invalidate, { size: 10, color: C.fg }).xml
    );
    o.push(text(X + 350, y + 22, 268, 20, layer.scope, { size: 9.5, italic: true }).xml);

    // The miss falls to the next layer; the hit returns straight to the client.
    if (i < layers.length - 1) {
      o.push(
        arrow(X + 134, y + 46, X + 134, y + 62, {
          color: C.bad,
          width: 1.4,
          label: 'miss',
          size: 9,
        }).xml
      );
    }
    o.push(
      arrow(X - 6, y + 23, 108, y + 23, {
        color: TONE_STROKE[layer.tone],
        width: 1.4,
        dashed: true,
      }).xml
    );
    y += 62;
  }

  // The client column every hit returns to.
  o.push(box(24, 88, 84, 292, 'client', 'plain', { size: 11, bold: true, valign: 'top', padTop: 8 }).xml);
  o.push(text(24, 384, 84, 30, 'a hit at any\nlayer stops here', { align: 'center', size: 9 }).xml);

  o.push(rule(24, 424, W - 48).xml);

  o.push(
    text(24, 434, W - 48, 18, 'The cost is not the lookup — it is the invalidation', {
      size: 12,
      bold: true,
      color: C.fg,
    }).xml
  );

  const traps = [
    ['bad', 'Cached a personalised response at the CDN', 'One user sees another user\'s name. Vary on auth, or mark it private.'],
    ['bad', 'Immutable HTML', 'The shell is cached forever and your deploy never reaches anyone. Hash assets, never the HTML.'],
    ['warn', 'Service worker with no update path', 'A bad SW is installed until it is explicitly replaced. Ship skipWaiting and a kill switch first.'],
  ];
  let ty = 456;
  for (const [tone, head, body] of traps) {
    o.push(pill(24, ty, 13, 13, '', tone, { fill: TONE_STROKE[tone], stroke: TONE_STROKE[tone] }).xml);
    o.push(text(44, ty - 2, 250, 18, head, { size: 10, bold: true, color: C.fg }).xml);
    o.push(text(300, ty - 2, 496, 18, body, { size: 10 }).xml);
    ty += 22;
  }

  o.push(
    takeaway(
      530,
      'Say which layer you are caching in AND how it is invalidated, in the same breath. "I would cache it" is not an answer; "s-maxage 60 with stale-while-revalidate 600 at the edge, purged on publish" is.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   3 — State topology
   ══════════════════════════════════════════════════════════════════ */

function stateTopology() {
  const o = [];
  const H = 562;

  o.push(
    title(
      'Four kinds of state — and the one mistake that merges them',
      'Most "we need Redux" conversations are really one of these living in the wrong place'
    )
  );

  const kinds = [
    {
      x: 24,
      title: 'Server cache',
      tone: 'accent',
      what: 'A copy of data that lives somewhere else',
      egs: ['user profile', 'product list', 'search results'],
      home: 'React Query / SWR / RTK Query',
      test: 'Could another user change it while I look at it?',
    },
    {
      x: 226,
      title: 'URL',
      tone: 'ok',
      what: 'State a reader should be able to send to a colleague',
      egs: ['current tab', 'filters', 'page number', 'sort'],
      home: 'router params & search params',
      test: 'Should refresh or a shared link restore it?',
    },
    {
      x: 428,
      title: 'Form / draft',
      tone: 'warn',
      what: 'Uncommitted edits that belong to one person',
      egs: ['half-typed reply', 'wizard answers'],
      home: 'form library, autosaved to storage',
      test: 'Would losing it on reload annoy someone?',
    },
    {
      x: 630,
      title: 'UI / ephemeral',
      tone: 'info',
      what: 'Which thing is open right now',
      egs: ['modal open', 'hover', 'focus', 'toast queue'],
      home: 'useState, closest to the element',
      test: 'Does anything outside this subtree care?',
    },
  ];

  for (const k of kinds) {
    const p = panel(k.x, 74, 166, 244, k.title, k.tone);
    o.push(p.xml);
    o.push(text(k.x + 12, 100, 142, 42, k.what, { size: 10, color: C.fg }).xml);

    let ey = 148;
    for (const eg of k.egs) {
      o.push(box(k.x + 12, ey, 142, 20, eg, k.tone, { size: 9.5, rx: 6, mono: true }).xml);
      ey += 24;
    }

    o.push(rule(k.x + 12, 244, 142, { dashed: true }).xml);
    o.push(text(k.x + 12, 250, 142, 30, k.home, { size: 9.5, bold: true, color: TONE_STROKE[k.tone] }).xml);
    o.push(text(k.x + 12, 282, 142, 32, k.test, { size: 9, italic: true }).xml);
  }

  o.push(
    text(24, 332, W - 48, 18, 'The failure mode: one global store for all four', {
      size: 12,
      bold: true,
      color: C.bad,
    }).xml
  );

  // Naive beside the fix — the whole point of the diagram.
  const bad = panel(24, 356, 380, 118, 'Everything in one store', 'bad');
  o.push(bad.xml);
  o.push(box(40, 386, 348, 24, 'store = { user, products, filters, modalOpen, draft }', 'bad', { size: 9.5, mono: true, rx: 6 }).xml);
  const badNotes = [
    'Server data goes stale with no refetch policy',
    'Filters are invisible to the URL — no shareable link',
    'Opening a modal re-renders subscribers across the app',
  ];
  let by = 414;
  for (const n of badNotes) {
    o.push(text(40, by, 348, 16, `— ${n}`, { size: 9.5 }).xml);
    by += 17;
  }

  const good = panel(416, 356, 380, 118, 'Each kind in its own home', 'ok');
  o.push(good.xml);
  const goodRows = [
    ['useQuery(["products"])', 'refetches, dedupes, knows staleness'],
    ['useSearchParams()', 'the link is the state'],
    ['useForm() + autosave', 'survives a reload'],
    ['useState(false)', 're-renders one component'],
  ];
  let gy = 386;
  for (const [code, why] of goodRows) {
    o.push(text(432, gy, 172, 18, code, { size: 9.5, mono: true, color: C.fg }).xml);
    o.push(text(608, gy, 176, 18, why, { size: 9 }).xml);
    gy += 20;
  }

  o.push(
    takeaway(
      488,
      'Classify the state out loud before you pick a library. Most of what interviewers see called "global state" is a server cache with no invalidation policy and a filter that should have been in the URL.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   4 — Real-time transports
   ══════════════════════════════════════════════════════════════════ */

function realtimeTransports() {
  const o = [];
  const H = 568;

  o.push(
    title(
      'Real-time transports — four ways to hear about a change',
      'Pick by direction and frequency, not by which one sounds most impressive'
    )
  );

  // Three columns: the name, the wire, and what it costs you.
  const X = 148; // timeline origin
  const TW = 424; // timeline width — everything drawn must stay inside it
  const R = 588; // right-hand column

  const rows = [
    {
      name: 'Polling',
      sub: 'Ask again on a timer',
      y: 88,
      tone: 'bad',
      // Each tick is a whole round trip, and five of the six find nothing new.
      draw(y) {
        const out = [];
        for (let i = 0; i < 6; i += 1) {
          const x = X + i * 70;
          const fresh = i === 4;
          out.push(arrow(x, y + 6, x + 26, y + 6, { color: C.bad, width: 1.3 }).xml);
          out.push(
            arrow(x + 26, y + 22, x, y + 22, {
              color: fresh ? C.ok : C.line,
              width: 1.3,
              dashed: !fresh,
            }).xml
          );
          out.push(
            text(x - 6, y + 26, 46, 13, fresh ? '200' : '304', {
              align: 'center',
              size: 8.5,
              color: fresh ? C.ok : C.muted,
              mono: true,
            }).xml
          );
        }
        return out.join('');
      },
      cost: '5 of 6 trips wasted',
      when: 'Anything that tolerates staleness. Start here, and only move when the interval stops being good enough.',
    },
    {
      name: 'Long polling',
      sub: 'Server holds the line open',
      y: 192,
      tone: 'warn',
      draw(y) {
        const out = [];
        let x = X;
        for (const hold of [170, 120, 70]) {
          out.push(arrow(x, y + 6, x + 18, y + 6, { color: C.accent, width: 1.3 }).xml);
          out.push(box(x + 18, y, 
            hold, 13, hold > 100 ? 'held open' : '', 'warn', { size: 8, rx: 5 }).xml);
          out.push(arrow(x + 18 + hold, y + 22, x, y + 22, { color: C.ok, width: 1.3 }).xml);
          x += hold + 20;
        }
        out.push(text(X, y + 26, 260, 13, 'reply the moment there is something to say', { size: 8.5 }).xml);
        return out.join('');
      },
      cost: 'a connection parked per client',
      when: 'Server→client only, on infrastructure that predates SSE. Rarely the right new choice.',
    },
    {
      name: 'SSE',
      sub: 'One long-lived stream, server → client',
      y: 296,
      tone: 'ok',
      draw(y) {
        const out = [arrow(X, y + 6, X + 18, y + 6, { color: C.accent, width: 1.3 }).xml];
        out.push(
          box(X + 18, y, TW - 18, 13, 'text/event-stream — stays open, reconnects itself', 'ok', {
            size: 8,
            rx: 5,
          }).xml
        );
        for (const dx of [60, 130, 180, 260, 340]) {
          out.push(arrow(X + 18 + dx, y + 13, X + 18 + dx, y + 24, { color: C.ok, width: 1.3 }).xml);
        }
        out.push(text(X, y + 26, 260, 13, 'events pushed down — no request per event', { size: 8.5 }).xml);
        return out.join('');
      },
      cost: 'no client→server channel',
      when: 'Feeds, notifications, live prices, job progress. The default for one-way updates.',
    },
    {
      name: 'WebSocket',
      sub: 'One connection, both directions',
      y: 400,
      tone: 'accent',
      draw(y) {
        const out = [box(X, y, TW, 13, 'ws:// — full duplex', 'accent', { size: 8, rx: 5 }).xml];
        for (const [dx, up] of [[50, false], [120, true], [190, false], [270, true], [330, false], [390, true]]) {
          out.push(
            arrow(X + dx, up ? y + 24 : y + 13, X + dx, up ? y + 13 : y + 24, {
              color: up ? C.accent : C.ok,
              width: 1.3,
            }).xml
          );
        }
        out.push(
          text(X, y + 26, 300, 13, 'the client sends too — typing, cursors, acks', { size: 8.5 }).xml
        );
        return out.join('');
      },
      cost: 'you own reconnect, backoff, auth, ordering',
      when: 'Chat, collaborative editing, multiplayer cursors, games — anywhere the client talks back.',
    },
  ];

  for (const row of rows) {
    o.push(rowLabel(24, row.y - 4, row.name, row.sub));
    o.push(row.draw(row.y));
    o.push(pill(R, row.y - 6, 208, 26, row.cost, row.tone, { size: 9 }).xml);
    o.push(text(R, row.y + 24, 208, 52, row.when, { size: 9, italic: true }).xml);
  }

  o.push(rule(24, 474, W - 48).xml);
  o.push(
    text(24, 482, W - 48, 16, 'Whatever you pick, the follow-up is the same: what happens when it drops?', {
      size: 11.5,
      bold: true,
      color: C.warn,
    }).xml
  );
  o.push(
    text(
      24,
      500,
      W - 48,
      16,
      'Exponential backoff with jitter  ·  resume from a cursor, never from "now"  ·  fall back to polling  ·  tell the reader they are disconnected',
      { size: 9.5 }
    ).xml
  );

  o.push(
    takeaway(
      518,
      'Direction decides the transport: server→client only is SSE, both ways is WebSocket, and "every 30 seconds is fine" is polling. Reaching for WebSocket when nothing is ever sent upward buys you a reconnect problem for free.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   5 — The layered frontend architecture
   ══════════════════════════════════════════════════════════════════ */

function architectureLayers() {
  const o = [];
  const H = 604;

  o.push(
    title(
      'The layered frontend architecture',
      'The reference sketch — name each box and say what it owns'
    )
  );

  /* ── The browser ───────────────────────────────────────────────── */

  const br = panel(24, 74, 442, 330, 'The browser — one device you do not control', 'accent');
  o.push(br.xml);

  o.push(box(40, 108, 410, 40, 'App shell', 'accent', { size: 11.5, bold: true }).xml);
  o.push(
    text(40, 148, 410, 14, 'routing · auth session · layout · error boundaries · the only thing always loaded', {
      size: 9,
      align: 'center',
    }).xml
  );

  const mods = ['Feed', 'Search', 'Settings'];
  mods.forEach((m, i) => {
    o.push(box(40 + i * 138, 168, 130, 34, m, 'info', { size: 10.5 }).xml);
  });
  o.push(
    text(40, 202, 410, 14, 'feature modules — lazily loaded, one owner each', {
      size: 9,
      align: 'center',
    }).xml
  );

  o.push(box(40, 222, 200, 38, 'Design system', 'ok', { size: 10.5 }).xml);
  o.push(box(250, 222, 200, 38, 'Data layer', 'warn', { size: 10.5 }).xml);
  o.push(text(40, 260, 200, 13, 'tokens · a11y solved once', { size: 8.5, align: 'center' }).xml);
  o.push(text(250, 260, 200, 13, 'cache · dedupe · mutations', { size: 8.5, align: 'center' }).xml);

  const plat = ['Service worker', 'IndexedDB', 'Web Worker'];
  plat.forEach((m, i) => {
    o.push(box(40 + i * 138, 286, 130, 32, m, 'sunken', { size: 9.5 }).xml);
  });
  o.push(
    text(40, 318, 410, 14, 'platform — offline shell, local data, work off the main thread', {
      size: 9,
      align: 'center',
    }).xml
  );

  o.push(
    box(40, 340, 410, 44, 'One main thread renders, runs your JS, and handles input. Everything above competes for it.', 'bad', {
      size: 9.5,
      align: 'left',
      padLeft: 10,
    }).xml
  );

  /* ── The network path ──────────────────────────────────────────── */

  const net = panel(482, 74, 314, 330, 'The path to the data', 'ok');
  o.push(net.xml);

  const edge = box(498, 108, 282, 40, 'CDN edge', 'ok', { size: 11, bold: true });
  o.push(edge.xml);
  o.push(text(498, 148, 230, 13, 'static assets + anything cacheable', { size: 8.5, align: 'center' }).xml);

  const bff = box(498, 182, 282, 40, 'BFF', 'accent', { size: 11, bold: true });
  o.push(bff.xml);
  o.push(
    text(498, 222, 282, 13, 'one request in, four out — joined on a fast link', {
      size: 8.5,
      align: 'center',
    }).xml
  );

  const svcs = ['posts', 'users', 'search'];
  svcs.forEach((sv, i) => {
    o.push(box(498 + i * 96, 262, 88, 32, sv, 'sunken', { size: 9.5, mono: true }).xml);
  });
  o.push(text(498, 294, 282, 13, 'services you do not own', { size: 8.5, align: 'center' }).xml);

  // The miss hop hugs the right edge so it clears the centred caption.
  o.push(arrow(764, 150, 764, 180, { color: C.line, width: 1.4, label: 'miss', size: 8.5 }).xml);
  o.push(arrow(542, 238, 542, 260, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(639, 238, 639, 260, { color: C.line, width: 1.4 }).xml);
  o.push(arrow(735, 238, 735, 260, { color: C.line, width: 1.4 }).xml);

  o.push(
    box(498, 316, 282, 68, 'Every hop here is latency the user pays. The whole client-side design above exists to make this path shorter, rarer, or invisible.', 'warn', {
      size: 9.5,
      align: 'left',
      padLeft: 10,
    }).xml
  );

  // The one request that crosses the boundary.
  o.push(
    arrow(450, 241, 496, 128, {
      color: C.accent,
      width: 1.8,
      startArrow: 'blockThin',
      label: 'fetch',
      size: 9,
    }).xml
  );

  /* ── Cross-cutting ─────────────────────────────────────────────── */

  o.push(rule(24, 416, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 422, W - 48, 16, 'Cross-cutting — these do not sit in a layer, they cut through all of them', {
      size: 11,
      bold: true,
      color: C.fg,
    }).xml
  );

  const cross = [
    ['Observability', 'RUM, errors, traces'],
    ['i18n', 'locale bundles, RTL'],
    ['Feature flags', 'release ≠ deploy'],
    ['Security', 'CSP, sanitising, auth'],
  ];
  cross.forEach(([name, sub], i) => {
    const x = 24 + i * 194;
    o.push(box(x, 444, 178, 30, name, 'info', { size: 10 }).xml);
    o.push(text(x, 474, 178, 13, sub, { size: 8.5, align: 'center' }).xml);
  });

  o.push(
    takeaway(
      498,
      'Draw this, then delete what the problem does not need. A dashboard behind a login has no CDN story and no SEO; a marketing site has no data layer worth the name. The boxes you remove, out loud, are worth as much as the ones you keep.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   6 — News feed: the three problems on one screen
   ══════════════════════════════════════════════════════════════════ */

function newsFeed() {
  const o = [];
  const H = 654;

  o.push(
    title(
      'News feed — three separate problems wearing one screen',
      'The request shape, the list size, and what happens when the list moves under you'
    )
  );

  /* ── 1. Splitting the request ──────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, '1 · The request — personalisation is what makes it uncacheable', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const naive = panel(24, 92, 372, 124, 'One personalised response', 'bad');
  o.push(naive.xml);
  o.push(box(40, 124, 340, 30, 'GET /feed  →  ranked posts + my likes + my saves', 'bad', {
    size: 9.5, mono: true, rx: 6,
  }).xml);
  o.push(text(40, 158, 340, 14, 'Personal, so no shared cache may hold it', { size: 9.5 }).xml);
  o.push(pill(40, 178, 150, 22, 'origin · ~250 ms', 'bad', { size: 9.5, mono: true }).xml);
  o.push(text(200, 178, 180, 22, 'every request, every user', { size: 9 }).xml);

  const split = panel(424, 92, 372, 124, 'Split by who it belongs to', 'ok');
  o.push(split.xml);
  o.push(box(440, 124, 340, 24, 'GET /feed      ranked post ids — same for a cohort', 'ok', {
    size: 9, mono: true, rx: 6,
  }).xml);
  o.push(box(440, 152, 340, 24, 'GET /me/overlay   my likes, my saves — tiny', 'accent', {
    size: 9, mono: true, rx: 6,
  }).xml);
  o.push(pill(440, 182, 104, 22, 'edge · ~30 ms', 'ok', { size: 9, mono: true }).xml);
  o.push(pill(552, 182, 116, 22, 'origin · ~80 ms', 'accent', { size: 9, mono: true }).xml);
  o.push(text(676, 182, 104, 22, 'and it can arrive\nafter first paint', { size: 8.5 }).xml);

  /* ── 2. The list ───────────────────────────────────────────────── */

  o.push(text(24, 228, W - 48, 16, '2 · The list — 10,000 posts is 80,000 DOM nodes', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  // The full data, most of it off screen.
  o.push(box(24, 252, 150, 150, '', 'sunken', { rx: 4 }).xml);
  o.push(text(24, 256, 150, 14, '10,000 items', { align: 'center', size: 9.5, bold: true, color: C.muted }).xml);
  for (let i = 0; i < 11; i += 1) {
    const inView = i >= 4 && i <= 6;
    o.push(box(34, 274 + i * 11, 130, 9, '', inView ? 'accent' : 'sunken', { rx: 3 }).xml);
  }
  o.push(box(28, 314, 142, 37, '', 'accent', { rx: 4, dashed: true, fill: 'none' }).xml);
  o.push(text(24, 404, 150, 14, 'in memory', { align: 'center', size: 9 }).xml);

  o.push(arrow(180, 330, 214, 330, { color: C.accent, width: 1.6, label: 'window', size: 9 }).xml);

  o.push(box(220, 252, 176, 150, '', 'plain', { rx: 4, stroke: C.accent }).xml);
  o.push(text(220, 256, 176, 14, '~30 rendered', { align: 'center', size: 9.5, bold: true, color: C.accent }).xml);
  for (let i = 0; i < 4; i += 1) {
    o.push(box(232, 276 + i * 30, 152, 26, '', 'accent', { rx: 4 }).xml);
  }
  o.push(text(220, 404, 176, 14, 'in the DOM', { align: 'center', size: 9 }).xml);

  o.push(
    box(412, 252, 384, 150,
      'Virtualization renders only the visible window plus a small overscan, and reuses those nodes as you scroll.\n\nThe cost you take on: every row needs a known height (or you measure and cache it), scroll restoration becomes your problem, and Ctrl+F stops finding anything off screen.\n\nThe accessibility cost is the one people miss — the list needs aria-setsize and aria-posinset, or a screen reader is told there are 30 posts.',
      'warn', { size: 9.5, align: 'left', padLeft: 12, padTop: 8, valign: 'top' }).xml
  );

  /* ── 3. Pagination ─────────────────────────────────────────────── */

  o.push(text(24, 428, W - 48, 16, '3 · Pagination — the list mutates while you read it', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const off = panel(24, 450, 372, 116, 'Offset — page 2 after a new post arrives', 'bad');
  o.push(off.xml);
  const p1 = cells(40, 482, ['P9', 'P8', 'P7'], { cw: 44, ch: 26, size: 10 });
  o.push(p1.xml);
  o.push(text(190, 482, 60, 26, 'page 1', { size: 9 }).xml);
  o.push(text(250, 476, 132, 16, 'P10 posted →', { size: 9, color: C.bad }).xml);
  const p2 = cells(40, 520, [{ text: 'P7', tone: 'bad' }, 'P6', 'P5'], { cw: 44, ch: 26, size: 10 });
  o.push(p2.xml);
  o.push(text(190, 520, 60, 26, 'page 2', { size: 9 }).xml);
  o.push(text(250, 520, 132, 26, 'P7 shown twice.\nSomething else is lost.', { size: 9, color: C.bad }).xml);

  const cur = panel(424, 450, 372, 116, 'Cursor — page 2 asks "after P7"', 'ok');
  o.push(cur.xml);
  const c1 = cells(440, 482, ['P9', 'P8', 'P7'], { cw: 44, ch: 26, size: 10 });
  o.push(c1.xml);
  o.push(text(590, 482, 190, 26, 'nextCursor = P7', { size: 9, mono: true }).xml);
  const c2 = cells(440, 520, [{ text: 'P6', tone: 'ok' }, 'P5', 'P4'], { cw: 44, ch: 26, size: 10 });
  o.push(c2.xml);
  o.push(text(590, 520, 190, 26, 'Stable under insertion.\nNew posts go to a banner.', { size: 9, color: C.ok }).xml);

  o.push(
    takeaway(
      580,
      'Answer all three or the design is incomplete: split the response so the bulk of it can be cached, virtualize because the DOM is the real limit, and use a cursor because the feed mutates under the reader. Offset pagination on a live feed is a correctness bug, not a style choice.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   7 — Autocomplete: the race
   ══════════════════════════════════════════════════════════════════ */

function autocomplete() {
  const o = [];
  const H = 560;

  o.push(
    title(
      'Autocomplete — the bug that only appears on a slow network',
      'Three keystrokes, three requests, and the network does not promise you an order'
    )
  );

  const X = 150;
  const T = (ms) => X + ms * 0.42; // ms → px on this diagram's own scale

  /* ── Naive ─────────────────────────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, 'Fire a request per keystroke, render whatever comes back', {
    size: 11.5, bold: true, color: C.bad,
  }).xml);

  const reqs = [
    { q: 're', at: 0, took: 470, y: 96 },
    { q: 'rea', at: 120, took: 180, y: 128 },
    { q: 'reac', at: 240, took: 160, y: 160 },
  ];

  for (const r of reqs) {
    o.push(text(24, r.y, 120, 22, `type "${r.q}"`, { size: 10, mono: true, color: C.fg }).xml);
    o.push(box(T(r.at), r.y, T(r.at + r.took) - T(r.at), 22, `GET ?q=${r.q}`, 'info', {
      size: 9, rx: 5, mono: true,
    }).xml);
    o.push(
      arrow(T(r.at + r.took), r.y + 11, T(r.at + r.took) + 16, r.y + 11, {
        color: C.line, width: 1.3,
      }).xml
    );
  }

  // Arrival order, which is not send order.
  o.push(rule(X, 196, 460, { dashed: true }).xml);
  const arrivals = [
    { q: 'rea', at: 300, tone: 'warn', tier: 0 },
    { q: 'reac', at: 400, tone: 'warn', tier: 1 },
    { q: 're', at: 470, tone: 'bad', tier: 2 },
  ];
  for (const a of arrivals) {
    const drop = a.tier * 13;
    o.push(arrow(T(a.at), 196, T(a.at), 208 + drop, { color: TONE_STROKE[a.tone], width: 1.4 }).xml);
    o.push(
      text(T(a.at) - 40, 207 + drop, 80, 14, a.q, {
        align: 'center', size: 9, mono: true, bold: true, color: TONE_STROKE[a.tone],
      }).xml
    );
  }
  o.push(text(24, 200, 120, 16, 'responses land', { size: 9.5, bold: true, color: C.fg }).xml);

  o.push(
    box(400, 190, 210, 46, 'The box now shows results for "re" while the input says "reac".', 'bad', {
      size: 9, align: 'left', padLeft: 8,
    }).xml
  );

  /* ── Fixed ─────────────────────────────────────────────────────── */

  o.push(rule(24, 250, W - 48).xml);
  o.push(text(24, 260, W - 48, 16, 'Debounce, cancel, and refuse anything stale', {
    size: 11.5, bold: true, color: C.ok,
  }).xml);

  o.push(text(24, 288, 120, 22, 'type "reac"', { size: 10, mono: true, color: C.fg }).xml);
  for (const [i, r] of reqs.entries()) {
    const dropped = i < 2;
    o.push(
      box(T(r.at), 288, 40, 22, '', dropped ? 'sunken' : 'accent', { rx: 5, dashed: dropped }).xml
    );
  }
  o.push(text(T(0), 312, 200, 14, 'debounced — never sent', { size: 9 }).xml);

  o.push(box(T(240), 340, T(390) - T(240), 22, 'GET ?q=reac', 'accent', {
    size: 9, rx: 5, mono: true,
  }).xml);
  o.push(text(24, 340, 120, 22, 'one request', { size: 10, color: C.fg }).xml);
  o.push(arrow(T(390), 351, T(390) + 16, 351, { color: C.ok, width: 1.4 }).xml);
  o.push(pill(T(390) + 22, 341, 130, 20, 'seq matches — render', 'ok', { size: 9 }).xml);

  o.push(box(T(0), 372, T(120) - T(0), 22, 'in flight', 'sunken', { size: 9, rx: 5, dashed: true }).xml);
  o.push(text(24, 372, 120, 22, 'older request', { size: 10, color: C.muted }).xml);
  o.push(pill(T(120) + 6, 373, 150, 20, 'AbortController.abort()', 'bad', { size: 8.5, mono: true }).xml);

  o.push(
    box(24, 404, W - 48, 44,
      'Three defences, and you want all three: debounce so a fast typist sends one request, not six · abort the previous request so it cannot resolve · tag each request with a sequence number and drop any response older than the newest one rendered. Abort alone is not enough — a response already in flight can still land.',
      'warn', { size: 9.5, align: 'left', padLeft: 12 }).xml
  );

  o.push(legend(24, 464, [
    ['info', 'request in flight'],
    ['bad', 'stale — must not render'],
    ['ok', 'current — safe to render'],
  ]));

  o.push(
    takeaway(
      490,
      'This bug never reproduces on a fast connection, which is why it ships. The interviewer is listening for whether you reach for cancellation and a sequence guard unprompted — that is the whole signal in an autocomplete question.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   8 — Chat: the life of one message
   ══════════════════════════════════════════════════════════════════ */

function chat() {
  const o = [];
  const H = 616;

  o.push(
    title(
      'Chat — one message, and the gap you cannot see',
      'Optimistic send, server ordering, and what a two-minute disconnect does to both'
    )
  );

  /* ── 1. The lifecycle ──────────────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, '1 · Four states, and the user must be able to tell them apart', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const states = [
    { label: 'sending', sub: 'local id only', tone: 'sunken', mark: '○' },
    { label: 'sent', sub: 'server has it', tone: 'accent', mark: '✓' },
    { label: 'delivered', sub: 'on their device', tone: 'info', mark: '✓✓' },
    { label: 'failed', sub: 'retry or discard', tone: 'bad', mark: '!' },
  ];
  states.forEach((st, i) => {
    const x = 24 + i * 196;
    o.push(box(x, 94, 180, 42, st.label, st.tone, { size: 11, bold: true }).xml);
    o.push(pill(x + 142, 100, 30, 18, st.mark, st.tone, { size: 9, mono: true }).xml);
    o.push(text(x, 136, 180, 14, st.sub, { size: 9, align: 'center' }).xml);
    if (i < 2) {
      o.push(arrow(x + 182, 115, x + 194, 115, { color: C.line, width: 1.3 }).xml);
    }
    if (i === 2) {
      o.push(arrow(x + 182, 115, x + 194, 115, { color: C.bad, width: 1.3, dashed: true, label: 'or', size: 8.5 }).xml);
    }
  });

  o.push(
    box(24, 156, W - 48, 34,
      'A message with no visible state is the bug users report as "it didn\'t send". Render sending in a subdued style, and never let a failure look identical to a success.',
      'warn', { size: 9.5, align: 'left', padLeft: 12 }).xml
  );

  /* ── 2. Identity and ordering ──────────────────────────────────── */

  o.push(text(24, 202, W - 48, 16, '2 · Two ids, because the client must render before the server answers', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  o.push(box(24, 226, 372, 100, '', 'plain', { rx: 6, stroke: C.line }).xml);
  o.push(text(38, 232, 344, 14, 'client', { size: 9.5, bold: true, color: C.muted }).xml);
  o.push(box(38, 252, 344, 26, 'id: "tmp-8f3a"   ·   status: sending', 'sunken', {
    size: 9.5, mono: true, rx: 5,
  }).xml);
  o.push(text(38, 282, 344, 36, 'Rendered instantly with a client id. The idempotency key is\nthis same id, so a retry cannot create a duplicate.', { size: 9 }).xml);

  o.push(arrow(400, 276, 420, 276, { color: C.ok, width: 1.6, label: 'ack', size: 9 }).xml);

  o.push(box(424, 226, 372, 100, '', 'plain', { rx: 6, stroke: C.ok }).xml);
  o.push(text(438, 232, 344, 14, 'after the server answers', { size: 9.5, bold: true, color: C.ok }).xml);
  o.push(box(438, 252, 344, 26, 'id: "m-1042"   ·   seq: 1042   ·   status: sent', 'ok', {
    size: 9.5, mono: true, rx: 5,
  }).xml);
  o.push(text(438, 282, 344, 36, 'Reconcile by client id, not by position. Order by the server\nsequence — client clocks disagree and cannot be trusted.', { size: 9 }).xml);

  /* ── 3. The disconnect gap ─────────────────────────────────────── */

  o.push(text(24, 338, W - 48, 16, '3 · The gap — what "reconnected" has to mean', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const bad = panel(24, 360, 372, 128, 'Resume from "now"', 'bad');
  o.push(bad.xml);
  o.push(cells(40, 396, ['1040', '1041'], { cw: 60, ch: 28, size: 9 }).xml);
  o.push(box(168, 396, 124, 28, '1042 – 1045', 'bad', { size: 9.5, rx: 5, dashed: true, mono: true }).xml);
  o.push(cells(296, 396, ['1046'], { cw: 60, ch: 28, size: 9 }).xml);
  o.push(text(40, 432, 344, 46, 'Messages 1042–1045 arrived while the socket was down.\nNothing errors. The conversation is simply missing four\nmessages and nobody is told.', { size: 9, color: C.bad }).xml);

  const good = panel(424, 360, 372, 128, 'Resume from the last seq you hold', 'ok');
  o.push(good.xml);
  const gseq = cells(440, 396, ['1040', '1041', '1042', '1043', '…'], { cw: 60, ch: 28, size: 9 });
  o.push(gseq.xml);
  o.push(text(440, 432, 344, 46, 'GET /messages?after=1041 on reconnect, then replay the\noutbox. Idempotency keys make the replay safe even if the\nserver already received some of it.', { size: 9, color: C.ok }).xml);

  o.push(
    takeaway(
      502,
      'The socket is a day of work; reconnect, resume-from-cursor, idempotent replay and message ordering are the quarter. Every one of those is a follow-up question, and "resume from now" is the wrong answer to all of them — it loses messages silently, which is the worst failure a chat app can have.'
    )
  );

  o.push(legend(24, 566, [
    ['sunken', 'not yet acknowledged'],
    ['ok', 'confirmed by the server'],
    ['bad', 'silently lost'],
  ]));

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   9 — Collaborative editing: OT vs CRDT
   ══════════════════════════════════════════════════════════════════ */

function collabEditor() {
  const o = [];
  const H = 620;

  o.push(
    title(
      'Collaborative editing — two people, one position, three outcomes',
      'Both start from "cat". A types "s" at 3, B types "!" at 3, at the same moment.'
    )
  );

  /** A labelled document state. */
  const doc = (x, y, label, chars, tone) => [
    text(x, y, 150, 14, label, { size: 9.5, bold: true, color: tone ?? C.muted }).xml,
    cells(x, y + 16, chars, { cw: 30, ch: 30, size: 12 }).xml,
  ].join('');

  /* ── Naive ─────────────────────────────────────────────────────── */

  o.push(text(24, 76, W - 48, 16, 'Last write wins — send the whole document', {
    size: 11.5, bold: true, color: C.bad,
  }).xml);

  o.push(doc(24, 98, 'both start from', ['c', 'a', 't']));
  o.push(doc(190, 98, 'A sends', [{ text: 'c' }, { text: 'a' }, { text: 't' }, { text: 's', tone: 'accent' }]));
  o.push(doc(356, 98, 'B sends', [{ text: 'c' }, { text: 'a' }, { text: 't' }, { text: '!', tone: 'info' }]));

  o.push(arrow(512, 129, 556, 129, { color: C.bad, width: 1.6, label: 'last one wins', size: 8.5 }).xml);
  o.push(doc(566, 98, 'the server keeps', [{ text: 'c' }, { text: 'a' }, { text: 't' }, { text: '!', tone: 'info' }], C.bad));
  o.push(pill(700, 114, 96, 30, 'A’s edit\nis gone', 'bad', { size: 9 }).xml);

  o.push(rule(24, 182, W - 48, { dashed: true }).xml);

  /* ── OT ────────────────────────────────────────────────────────── */

  o.push(text(24, 190, W - 48, 16, 'Operational Transformation — send intents, and transform them against each other', {
    size: 11.5, bold: true, color: C.accent,
  }).xml);

  o.push(box(24, 214, 356, 106, '', 'plain', { rx: 6, stroke: C.accent }).xml);
  o.push(text(38, 220, 328, 14, 'What travels', { size: 9.5, bold: true, color: C.accent }).xml);
  o.push(box(38, 240, 156, 24, 'A: insert("s", 3)', 'accent', { size: 9, mono: true, rx: 5 }).xml);
  o.push(box(206, 240, 160, 24, 'B: insert("!", 3)', 'info', { size: 9, mono: true, rx: 5 }).xml);
  o.push(text(38, 270, 328, 44, 'The server picks an order, then TRANSFORMS the second op\nagainst the first: B’s insert at 3 becomes an insert at 4,\nbecause A already put a character there.', { size: 9 }).xml);

  o.push(arrow(386, 262, 408, 262, { color: C.accent, width: 1.6, label: 'transform', size: 8.5 }).xml);

  o.push(box(416, 214, 380, 106, '', 'plain', { rx: 6, stroke: C.ok }).xml);
  o.push(text(430, 220, 352, 14, 'Both converge', { size: 9.5, bold: true, color: C.ok }).xml);
  o.push(cells(430, 240, [{ text: 'c' }, { text: 'a' }, { text: 't' }, { text: 's', tone: 'accent' }, { text: '!', tone: 'info' }], { cw: 28, ch: 26, size: 11 }).xml);
  o.push(text(430, 272, 352, 42, 'Needs a central server to decide the order — that is the\ncost. Simple ops, small payloads, and the algorithm is\nnotoriously easy to get subtly wrong.', { size: 9 }).xml);

  o.push(rule(24, 332, W - 48, { dashed: true }).xml);

  /* ── CRDT ──────────────────────────────────────────────────────── */

  o.push(text(24, 340, W - 48, 16, 'CRDT — give every character a unique, orderable id, and the conflict cannot exist', {
    size: 11.5, bold: true, color: C.ok,
  }).xml);

  o.push(box(24, 364, 356, 112, '', 'plain', { rx: 6, stroke: C.ok }).xml);
  o.push(text(38, 370, 328, 14, 'What travels', { size: 9.5, bold: true, color: C.ok }).xml);
  o.push(box(38, 390, 156, 24, 'A: ("s", id A:7, after t)', 'accent', { size: 8.5, mono: true, rx: 5 }).xml);
  o.push(box(206, 390, 160, 24, 'B: ("!", id B:3, after t)', 'info', { size: 8.5, mono: true, rx: 5 }).xml);
  o.push(text(38, 420, 328, 50, 'Both insert after the same character. The tie is broken by\ncomparing ids — deterministically, the same way on every\nreplica. No server has to arbitrate.', { size: 9 }).xml);

  o.push(arrow(386, 412, 408, 412, { color: C.ok, width: 1.6, label: 'merge', size: 8.5 }).xml);

  o.push(box(416, 364, 380, 112, '', 'plain', { rx: 6, stroke: C.ok }).xml);
  o.push(text(430, 370, 352, 14, 'Converges with no coordination', { size: 9.5, bold: true, color: C.ok }).xml);
  o.push(cells(430, 390, [{ text: 'c' }, { text: 'a' }, { text: 't' }, { text: 's', tone: 'accent' }, { text: '!', tone: 'info' }], { cw: 28, ch: 26, size: 11 }).xml);
  o.push(text(430, 422, 352, 48, 'Works peer-to-peer and offline. Costs metadata per\ncharacter — a mature library (Yjs, Automerge) keeps that\nmanageable; a hand-rolled one will not.', { size: 9 }).xml);

  o.push(
    takeaway(
      492,
      'Never hand-roll either. The honest answer is "Yjs or Automerge, because OT is famously easy to get subtly wrong and a bad merge silently destroys someone\'s work". Reach for OT only if you must interoperate with an existing OT server.'
    )
  );

  o.push(
    box(24, 548, W - 48, 54,
      'The parts a library does NOT give you, and every one is a follow-up: presence and remote cursors · undo that only undoes YOUR edits · awareness of who is typing · access control · persistence and compaction of the operation log · and what the document looks like to someone who joins an hour late.',
      'info', { size: 9.5, align: 'left', padLeft: 12 }).xml
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   10 — Video player: adaptive bitrate
   ══════════════════════════════════════════════════════════════════ */

function videoPlayer() {
  const o = [];
  const H = 592;
  const X = 150;
  const SEG = 52; // one segment's width

  o.push(
    title(
      'Adaptive bitrate — the loop that keeps playback from stalling',
      'Estimate the bandwidth, pick the next segment’s quality, watch the buffer, repeat'
    )
  );

  /* ── The ladder ────────────────────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, '1 · The same content, encoded once per rung', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const ladder = [
    { q: '1080p', bps: '5 Mbps', tone: 'accent' },
    { q: '720p', bps: '2.5 Mbps', tone: 'info' },
    { q: '480p', bps: '1 Mbps', tone: 'ok' },
    { q: '240p', bps: '400 kbps', tone: 'sunken' },
  ];
  ladder.forEach((r, i) => {
    const y = 94 + i * 30;
    o.push(box(24, y, 110, 26, r.q, r.tone, { size: 10, bold: true }).xml);
    o.push(text(140, y, 90, 26, r.bps, { size: 9.5, mono: true }).xml);
  });
  o.push(
    text(236, 94, 250, 116,
      'The manifest lists every rung. The player may switch between them at any segment boundary, because each segment starts with a keyframe.',
      { size: 9.5, valign: 'top' }).xml
  );

  o.push(
    box(500, 94, 296, 116,
      'Segments are 2–6 seconds. Shorter means faster reaction to a bandwidth change and more requests; longer means better compression and slower recovery. 4s is the usual compromise.',
      'info', { size: 9.5, align: 'left', padLeft: 12, padTop: 8, valign: 'top' }).xml
  );

  /* ── The switch in action ──────────────────────────────────────── */

  o.push(text(24, 224, W - 48, 16, '2 · Bandwidth drops at segment 4 — what the player does', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const segs = [
    { q: '1080p', tone: 'accent' },
    { q: '1080p', tone: 'accent' },
    { q: '1080p', tone: 'accent' },
    { q: '480p', tone: 'ok' },
    { q: '480p', tone: 'ok' },
    { q: '720p', tone: 'info' },
    { q: '1080p', tone: 'accent' },
  ];
  segs.forEach((sg, i) => {
    o.push(box(X + i * (SEG + 4), 250, SEG, 30, sg.q, sg.tone, { size: 9 }).xml);
    o.push(text(X + i * (SEG + 4), 281, SEG, 13, String(i + 1), {
      align: 'center', size: 8.5, color: C.muted, mono: true,
    }).xml);
  });
  o.push(text(24, 250, 120, 30, 'segment fetched', { size: 10, color: C.fg }).xml);

  // Bandwidth trace under the segments.
  o.push(text(24, 302, 120, 26, 'measured', { size: 10, color: C.fg }).xml);
  const bw = ['5.4', '5.1', '5.3', '0.9', '1.1', '2.8', '5.2'];
  bw.forEach((v, i) => {
    const low = Number(v) < 2;
    o.push(box(X + i * (SEG + 4), 302, SEG, 24, v, low ? 'bad' : 'sunken', {
      size: 9, mono: true, rx: 5,
    }).xml);
  });
  o.push(text(X + 7 * (SEG + 4) + 8, 302, 60, 24, 'Mbps', { size: 9 }).xml);

  o.push(
    box(X + 5 * (SEG + 4), 334, 232, 34, 'Step down fast, step up slowly — one good segment is not evidence.', 'warn', {
      size: 9, align: 'left', padLeft: 8,
    }).xml
  );

  /* ── Buffer ────────────────────────────────────────────────────── */

  o.push(text(24, 380, W - 48, 16, '3 · The buffer is the real signal', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const zones = [
    { label: 'panic — drop quality now', w: 140, tone: 'bad', note: '< 5 s' },
    { label: 'steady — hold', w: 250, tone: 'ok', note: '5–20 s' },
    { label: 'healthy — try stepping up', w: 250, tone: 'accent', note: '> 20 s' },
  ];
  let bx = 24;
  for (const z of zones) {
    o.push(box(bx, 404, z.w, 30, z.label, z.tone, { size: 9.5 }).xml);
    o.push(text(bx, 435, z.w, 13, z.note, { align: 'center', size: 8.5, mono: true }).xml);
    bx += z.w + 6;
  }

  o.push(
    box(24, 458, W - 48, 40,
      'Bandwidth estimates lag and lie — a CDN burst reads as a fast link right before a stall. Buffer level is ground truth: it already reflects everything that actually happened. Use bandwidth to choose, and the buffer to overrule.',
      'info', { size: 9.5, align: 'left', padLeft: 12 }).xml
  );

  o.push(
    takeaway(
      508,
      'Never hand-roll ABR — hls.js or Shaka. What the interviewer wants is that you know the loop exists, that you step down fast and up slowly, and that a stall is far worse for a viewer than a lower resolution they will probably not notice.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   11 — Checkout: the three boundaries
   ══════════════════════════════════════════════════════════════════ */

function ecommerceCheckout() {
  const o = [];
  const H = 584;

  o.push(
    title(
      'Checkout — three boundaries, three different rules',
      'What the client may own, what it must never touch, and what must never happen twice'
    )
  );

  const cols = [
    {
      x: 24,
      title: 'Cart — the client may own it',
      tone: 'ok',
      rows: [
        ['Optimistic add and remove', 'The count updates before the server answers'],
        ['Persist locally', 'A guest cart survives a reload; merge it on sign-in'],
        ['Re-price on load', 'Never trust a stored price — the server decides'],
      ],
      warn: 'The cart is a wish, not a contract. Availability and price are only true at the moment the order is placed.',
    },
    {
      x: 282,
      title: 'Payment — you must not touch it',
      tone: 'bad',
      rows: [
        ['Hosted fields in an iframe', 'Stripe / Adyen own the card inputs'],
        ['Card data never reaches you', 'That is what keeps you out of PCI scope'],
        ['You receive a token', 'Charge the token, never the number'],
      ],
      warn: 'Styling is limited and you cannot read the fields. That is the point — a card field you can read is a card field an XSS can read.',
    },
    {
      x: 540,
      title: 'Order — it must happen once',
      tone: 'accent',
      rows: [
        ['Idempotency key per intent', 'Generated once, reused on every retry'],
        ['Disable submit while pending', 'Necessary, and nowhere near sufficient'],
        ['Reconcile, do not re-submit', 'On an unclear failure, GET the order'],
      ],
      warn: 'A dropped response is indistinguishable from a failure. Without a key, a retry double-charges — and the customer sees it.',
    },
  ];

  for (const col of cols) {
    const pl = panel(col.x, 74, 256, 300, col.title, col.tone);
    o.push(pl.xml);
    let y = 110;
    for (const [head, sub] of col.rows) {
      o.push(box(col.x + 14, y, 228, 26, head, col.tone, { size: 9.5 }).xml);
      o.push(text(col.x + 14, y + 28, 228, 30, sub, { size: 9 }).xml);
      y += 66;
    }
    o.push(box(col.x + 14, 308, 228, 54, col.warn, 'warn', {
      size: 8.5, align: 'left', padLeft: 8, padTop: 6, valign: 'top',
    }).xml);
  }

  o.push(arrow(284, 224, 278, 224, { color: C.line, width: 1.4, startArrow: 'blockThin', endArrow: 'none' }).xml);
  o.push(arrow(542, 224, 536, 224, { color: C.line, width: 1.4, startArrow: 'blockThin', endArrow: 'none' }).xml);

  /* ── The failure nobody designs ────────────────────────────────── */

  o.push(rule(24, 388, W - 48, { dashed: true }).xml);
  o.push(text(24, 396, W - 48, 16, 'The state everyone forgets: payment succeeded, the response never arrived', {
    size: 11.5, bold: true, color: C.bad,
  }).xml);

  const steps = [
    { t: 'Submit', tone: 'accent' },
    { t: 'Charged', tone: 'ok' },
    { t: 'Response lost', tone: 'bad' },
    { t: 'User retries', tone: 'warn' },
    { t: 'Key matches —\nsame order returned', tone: 'ok' },
  ];
  steps.forEach((st, i) => {
    const x = 24 + i * 158;
    o.push(box(x, 420, 142, 42, st.t, st.tone, { size: 9.5 }).xml);
    if (i < steps.length - 1) {
      o.push(arrow(x + 144, 441, x + 156, 441, { color: C.line, width: 1.3 }).xml);
    }
  });

  o.push(
    takeaway(
      478,
      'Say the words "idempotency key" before you are asked. The double-charge is the failure this whole question is built around, and a disabled button does not prevent it — the second attempt comes from a refresh, a back button, or a phone that lost signal at exactly the wrong moment.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   12 — Dashboard: independent widgets
   ══════════════════════════════════════════════════════════════════ */

function analyticsDashboard() {
  const o = [];
  const H = 572;
  const X = 150;
  const MS = 0.16;

  o.push(
    title(
      'Dashboard — one slow query should not hold the page hostage',
      'Six widgets, one of them slow. The layout decides whether the reader waits for all six.'
    )
  );

  /* ── Naive ─────────────────────────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, 'One request for everything', {
    size: 11.5, bold: true, color: C.bad,
  }).xml);

  o.push(text(24, 96, 120, 26, 'GET /dashboard', { size: 9.5, mono: true, color: C.fg }).xml);
  o.push(box(X, 96, 2400 * MS, 26, 'blocked on the slowest query — the cohort retention table', 'bad', {
    size: 9, rx: 5,
  }).xml);
  o.push(text(X + 2400 * MS + 8, 96, 190, 26, 'everything appears at once', {
    size: 9, bold: true, color: C.bad,
  }).xml);
  o.push(text(24, 142, 120, 20, 'the reader sees', { size: 9.5 }).xml);
  o.push(box(X, 140, 2400 * MS, 20, 'a page of spinners', 'sunken', { size: 8.5, rx: 5, dashed: true }).xml);

  /* ── Fixed ─────────────────────────────────────────────────────── */

  o.push(rule(24, 178, W - 48).xml);
  o.push(text(24, 188, W - 48, 16, 'One query per widget, rendered as each lands', {
    size: 11.5, bold: true, color: C.ok,
  }).xml);

  const widgets = [
    { name: 'Active users', ms: 180, tone: 'ok' },
    { name: 'Revenue today', ms: 240, tone: 'ok' },
    { name: 'Signups', ms: 320, tone: 'ok' },
    { name: 'Top pages', ms: 620, tone: 'accent' },
    { name: 'Error rate', ms: 780, tone: 'accent' },
    { name: 'Cohort retention', ms: 2400, tone: 'warn' },
  ];
  widgets.forEach((wd, i) => {
    const y = 214 + i * 30;
    o.push(text(24, y, 120, 24, wd.name, { size: 9.5, color: C.fg }).xml);
    o.push(box(X, y, wd.ms * MS, 24, `${wd.ms} ms`, wd.tone, { size: 8.5, rx: 5, mono: true }).xml);
    o.push(
      box(X + wd.ms * MS + 4, y, 10, 24, '', 'ok', { rx: 5, fill: C.ok, stroke: C.ok }).xml
    );
  });

  o.push(
    arrow(X + 180 * MS, 398, X + 180 * MS, 386, { color: C.ok, width: 1.6 }).xml
  );
  o.push(text(X + 180 * MS + 8, 392, 220, 14, 'first widget usable at 180 ms', {
    size: 9, bold: true, color: C.ok,
  }).xml);

  o.push(
    box(X + 2400 * MS + 22, 214, 208, 150,
      'Each widget owns its own query, its own skeleton, and its own error boundary. A failing widget shows a retry in its own card; the other five are unaffected.',
      'info', { size: 9.5, align: 'left', padLeft: 10, padTop: 8, valign: 'top' }).xml
  );

  /* ── The skeleton rule ─────────────────────────────────────────── */

  o.push(rule(24, 420, W - 48, { dashed: true }).xml);
  o.push(text(24, 432, W - 48, 16, 'Reserve the space, or independent loading costs you the layout', {
    size: 11.5, bold: true, color: C.warn,
  }).xml);

  o.push(box(24, 456, 372, 46, 'Skeletons sized to the real content — the grid never moves as widgets land', 'ok', {
    size: 9.5, align: 'left', padLeft: 10,
  }).xml);
  o.push(box(424, 456, 372, 46, 'Spinners in auto-height cards — six separate layout shifts, and a CLS failure', 'bad', {
    size: 9.5, align: 'left', padLeft: 10,
  }).xml);

  o.push(
    takeaway(
      512,
      'Independent widgets is the easy half. The half people miss is that six things arriving at six different times is six chances to reflow the page — so every widget gets a fixed-height skeleton before it gets a query.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   13 — The loading waterfall
   ══════════════════════════════════════════════════════════════════ */

function loadingWaterfall() {
  const o = [];
  const H = 616;
  const X = 190;
  const SC = 0.24; // ms → px

  o.push(
    title(
      'The critical path — what is actually between the click and the pixel',
      'The same page, the same bytes. Only the dependency chain changes.'
    )
  );

  const row = (y, label, at, ms, text, tone, opts = {}) => {
    const out = [
      textCell(24, y, 162, 24, label),
      box(X + at * SC, y, Math.max(6, ms * SC), 24, text, tone, {
        size: 9, rx: 5, mono: opts.mono,
      }).xml,
    ];
    return out.join('');
  };
  const textCell = (x, y, w, h, t) =>
    text(x, y, w, h, t, { size: 9.5, color: C.fg }).xml;

  /* ── Before ────────────────────────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, 'Serialised — each request discovers the next', {
    size: 11.5, bold: true, color: C.bad,
  }).xml);

  o.push(row(94, 'HTML', 0, 220, 'document', 'ok'));
  o.push(row(122, 'CSS (blocking)', 220, 260, 'app.css', 'bad'));
  o.push(row(150, 'JS (blocking)', 480, 620, 'bundle.js', 'bad'));
  o.push(row(178, 'font (in CSS)', 480, 300, 'Inter.woff2', 'warn'));
  o.push(row(206, 'API (in JS)', 1100, 380, '/feed', 'bad'));
  o.push(row(234, 'hero image (in JSON)', 1480, 420, 'hero.avif', 'warn'));

  o.push(arrow(X + 1900 * SC, 106, X + 1900 * SC, 250, {
    color: C.bad, width: 1.4, endArrow: 'none', dashed: true,
  }).xml);
  o.push(pill(X + 1900 * SC + 6, 96, 96, 20, 'LCP 1.9 s', 'bad', { size: 9, mono: true }).xml);

  o.push(
    box(614, 122, 182, 88,
      'Every arrow is a discovery: the browser could not know it needed the next thing until the previous one arrived.',
      'bad', { size: 9, align: 'left', padLeft: 8, padTop: 6, valign: 'top' }).xml
  );

  /* ── After ─────────────────────────────────────────────────────── */

  o.push(rule(24, 268, W - 48).xml);
  o.push(text(24, 278, W - 48, 16, 'Parallelised — tell the browser everything up front', {
    size: 11.5, bold: true, color: C.ok,
  }).xml);

  o.push(row(302, 'HTML (streamed)', 0, 180, 'document', 'ok'));
  o.push(row(330, 'CSS (critical inline)', 0, 6, '', 'ok'));
  o.push(text(X + 12, 330, 220, 24, 'inlined — zero requests', { size: 9, color: C.ok }).xml);
  o.push(row(358, 'font (preload)', 60, 300, 'Inter.woff2', 'ok'));
  o.push(row(386, 'hero (preload)', 60, 420, 'hero.avif', 'ok'));
  o.push(row(414, 'API (server-rendered)', 60, 380, '/feed on the server', 'accent'));
  o.push(row(442, 'JS (defer, non-blocking)', 180, 620, 'bundle.js', 'info'));

  o.push(arrow(X + 480 * SC, 314, X + 480 * SC, 458, {
    color: C.ok, width: 1.4, endArrow: 'none', dashed: true,
  }).xml);
  o.push(pill(X + 480 * SC + 6, 304, 96, 20, 'LCP 0.5 s', 'ok', { size: 9, mono: true }).xml);

  o.push(
    box(X + 480 * SC + 110, 302, 248, 74,
      'Nothing here is faster. The same bytes arrive over the same connection — they just stopped waiting for each other.',
      'ok', { size: 9, align: 'left', padLeft: 8, padTop: 6, valign: 'top' }).xml
  );

  /* ── The levers ────────────────────────────────────────────────── */

  o.push(rule(24, 476, W - 48, { dashed: true }).xml);
  o.push(text(24, 484, W - 48, 16, 'The five levers, in order of impact', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const levers = [
    ['Inline critical CSS', 'removes a blocking round trip'],
    ['Preload the LCP image', 'found at parse, not after JSON'],
    ['defer / async the JS', 'stops blocking the parser'],
    ['Render data on the server', 'removes a whole round trip'],
    ['preconnect third parties', 'DNS + TLS paid early'],
  ];
  levers.forEach(([name, why], i) => {
    const x = 24 + i * 155;
    o.push(box(x, 508, 144, 30, name, 'accent', { size: 9 }).xml);
    o.push(text(x, 538, 144, 26, why, { size: 8.5, align: 'center' }).xml);
  });

  o.push(
    takeaway(
      568,
      'Waterfalls are about DEPENDENCY, not bandwidth. Before optimising a single byte, ask what the browser could not know it needed yet — that question finds more milliseconds than compression ever will.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   14 — Auth on the frontend
   ══════════════════════════════════════════════════════════════════ */

function authFlows() {
  const o = [];
  const H = 628;

  o.push(
    title(
      'Frontend auth — where the token lives decides everything else',
      'The storage choice is the design; the flow is mostly the same either way'
    )
  );

  /* ── Storage ───────────────────────────────────────────────────── */

  o.push(text(24, 70, W - 48, 16, '1 · Two real options, and one that keeps being chosen anyway', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const stores = [
    {
      x: 24, name: 'localStorage', tone: 'bad',
      rows: [['XSS', 'Readable by any script on the page — one bad dependency is total compromise'],
             ['CSRF', 'Immune — not sent automatically'],
             ['Verdict', 'Do not. The XSS exposure is not worth the CSRF convenience.']],
    },
    {
      x: 282, name: 'httpOnly cookie', tone: 'ok',
      rows: [['XSS', 'Unreadable by JavaScript, by construction'],
             ['CSRF', 'Needs SameSite=Lax/Strict, plus a token for cross-site POSTs'],
             ['Verdict', 'The default. Pair with SameSite and Secure.']],
    },
    {
      x: 540, name: 'In memory only', tone: 'accent',
      rows: [['XSS', 'Readable, but gone on reload — a much smaller window'],
             ['CSRF', 'Immune'],
             ['Verdict', 'Good for the access token, with a refresh cookie behind it.']],
    },
  ];

  for (const st of stores) {
    const pl = panel(st.x, 94, 256, 178, st.name, st.tone);
    o.push(pl.xml);
    let y = 128;
    for (const [k, v] of st.rows) {
      o.push(text(st.x + 14, y, 64, 14, k, { size: 9, bold: true, color: C.fg }).xml);
      o.push(text(st.x + 14, y + 14, 228, 34, v, { size: 8.5 }).xml);
      y += 50;
    }
  }

  /* ── The refresh dance ─────────────────────────────────────────── */

  o.push(text(24, 286, W - 48, 16, '2 · Silent refresh — and the stampede it causes if you get it wrong', {
    size: 11.5, bold: true, color: C.fg,
  }).xml);

  const naive = panel(24, 310, 372, 150, 'Refresh per failed request', 'bad');
  o.push(naive.xml);
  for (let i = 0; i < 4; i += 1) {
    o.push(box(40, 344 + i * 26, 150, 22, `request ${i + 1} → 401`, 'sunken', {
      size: 8.5, rx: 5, mono: true,
    }).xml);
    o.push(arrow(194, 355 + i * 26, 212, 355 + i * 26, { color: C.bad, width: 1.2 }).xml);
    o.push(box(216, 344 + i * 26, 164, 22, 'POST /refresh', 'bad', { size: 8.5, rx: 5, mono: true }).xml);
  }
  o.push(text(40, 448, 340, 14, 'Four refreshes. Rotation invalidates three of them — and logs the user out.', {
    size: 8.5, color: C.bad,
  }).xml);

  const fixed = panel(424, 310, 372, 150, 'One in-flight refresh, shared', 'ok');
  o.push(fixed.xml);
  for (let i = 0; i < 4; i += 1) {
    o.push(box(440, 344 + i * 26, 150, 22, `request ${i + 1} → 401`, 'sunken', {
      size: 8.5, rx: 5, mono: true,
    }).xml);
    o.push(arrow(594, 355 + i * 26, 612, 381, { color: C.ok, width: 1.2, endArrow: i === 0 ? 'blockThin' : 'none' }).xml);
  }
  o.push(box(616, 370, 164, 22, 'POST /refresh', 'ok', { size: 8.5, rx: 5, mono: true }).xml);
  o.push(text(616, 394, 164, 26, 'all four await the\nsame promise', { size: 8.5, color: C.ok }).xml);
  o.push(text(440, 448, 340, 14, 'One refresh, one rotation, four requests replayed with the new token.', {
    size: 8.5, color: C.ok,
  }).xml);

  /* ── Rules ─────────────────────────────────────────────────────── */

  o.push(rule(24, 474, W - 48, { dashed: true }).xml);
  o.push(text(24, 482, W - 48, 16, 'Rules that are not negotiable', {
    size: 11.5, bold: true, color: C.warn,
  }).xml);

  const rules = [
    ['PKCE, always', 'The implicit flow is deprecated'],
    ['Validate on the server', 'A client check is a UX hint'],
    ['Rotate refresh tokens', 'And detect reuse as theft'],
    ['Sync logout across tabs', 'BroadcastChannel or storage'],
  ];
  rules.forEach(([name, why], i) => {
    const x = 24 + i * 194;
    o.push(box(x, 506, 178, 30, name, 'warn', { size: 9.5 }).xml);
    o.push(text(x, 536, 178, 26, why, { size: 8.5, align: 'center' }).xml);
  });

  o.push(
    takeaway(
      570,
      'Everything the client does with auth is convenience. The only thing that actually protects a resource is the server checking the token on every request — so say "the client hides the button, the server enforces the rule" out loud, because that is the sentence being listened for.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── Containers and orchestration ─────────────────────────────────── */

function containerAnatomy() {
  const o = [];
  const H = 690;

  o.push(
    title(
      'Multi-stage build — the toolchain does not ship',
      'One Dockerfile, two stages: what builds the app and what runs it are different machines'
    )
  );

  /* 1 · The two stages */

  o.push(
    text(24, 70, W - 48, 16, '1 · Two stages, and only one of them is pushed', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(panel(24, 94, 340, 186, 'Stage 1 · builder — `node:20-alpine`', 'warn').xml);
  [
    'the whole source tree, tests and configs',
    '`node_modules` — dev *and* prod, ≈480 MB',
    'vite / tsc / eslint, the toolchain',
    '`dist/` — the only useful output',
  ].forEach((t, i) => {
    o.push(box(38, 128 + i * 30, 312, 26, t, i === 3 ? 'ok' : 'sunken', { size: 9, rx: 6 }).xml);
  });
  o.push(
    text(38, 250, 312, 26, '≈1.2 GB, discarded when the build ends. Never pushed, never run.', {
      size: 8.5,
      color: C.warn,
    }).xml
  );

  o.push(
    text(366, 122, 88, 40, 'COPY\n--from=builder\n/app/dist', {
      size: 8,
      align: 'center',
      mono: true,
      color: C.muted,
    }).xml
  );
  o.push(arrow(368, 176, 452, 176, { color: C.ok, width: 1.6 }).xml);

  o.push(panel(456, 94, 340, 186, 'Stage 2 · runtime — `nginx:alpine`', 'ok').xml);
  [
    'nginx and its config',
    '`dist/` — the hashed assets',
    'nothing else: no node, no npm, no source',
  ].forEach((t, i) => {
    o.push(box(470, 128 + i * 30, 312, 26, t, i === 2 ? 'ok' : 'sunken', { size: 9, rx: 6 }).xml);
  });
  o.push(
    text(470, 220, 312, 44, '≈25 MB. This is what goes to the registry and runs in the cluster — a smaller image is a faster pull, a faster scale-up and a smaller attack surface.', {
      size: 8.5,
      color: C.ok,
    }).xml
  );

  /* 2 · Layer order */

  o.push(rule(24, 292, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 302, W - 48, 16, '2 · Layer order decides your rebuild time — one source edit, twice', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const LANES = [
    {
      y: 344,
      label: '`COPY . .` before `npm ci`',
      tone: C.bad,
      steps: [
        ['FROM node:20-alpine', 'cached', 'ok'],
        ['COPY . .', 'invalidated', 'bad'],
        ['RUN npm ci', 're-runs — 90 s', 'bad'],
        ['RUN npm run build', 're-runs — 14 s', 'bad'],
        ['total ≈ 110 s', 'every commit', 'bad'],
      ],
    },
    {
      y: 424,
      label: '`COPY package*.json` first',
      tone: C.ok,
      steps: [
        ['FROM node:20-alpine', 'cached', 'ok'],
        ['COPY package*.json\n+ RUN npm ci', 'cached — 0 s', 'ok'],
        ['COPY . .', 'invalidated', 'warn'],
        ['RUN npm run build', 're-runs — 14 s', 'warn'],
        ['total ≈ 16 s', 'every commit', 'ok'],
      ],
    },
  ];

  for (const lane of LANES) {
    o.push(text(24, lane.y - 18, 400, 14, lane.label, { size: 9.5, bold: true, color: lane.tone }).xml);
    lane.steps.forEach(([name, state, t], i) => {
      const x = 24 + i * 158;
      o.push(box(x, lane.y, 150, 44, `${name}\n${state}`, t, { size: 8, rx: 6 }).xml);
      if (i < 4) o.push(arrow(x + 151, lane.y + 22, x + 157, lane.y + 22, { color: C.line, width: 1 }).xml);
    });
  }

  /* 3 · Config */

  o.push(rule(24, 488, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 498, W - 48, 16, '3 · The frontend-specific trap: config baked into the bundle', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(panel(24, 522, 372, 110, 'Baked at build time', 'bad').xml);
  o.push(box(38, 556, 344, 26, 'ENV VITE_API_URL=https://api.prod.example.com', 'sunken', {
    size: 8.5,
    mono: true,
    rx: 6,
  }).xml);
  o.push(
    text(38, 586, 344, 34, 'A different image per environment, so staging never tested the artefact production runs. Any config change is a rebuild.', { size: 8.5 }).xml
  );

  o.push(panel(424, 522, 372, 110, 'Fetched at runtime', 'ok').xml);
  o.push(box(438, 556, 344, 26, 'fetch("/config.json") on boot  ·  ConfigMap', 'sunken', {
    size: 8.5,
    mono: true,
    rx: 6,
  }).xml);
  o.push(
    text(438, 586, 344, 34, 'One image, promoted unchanged from staging to production. Only the mounted config differs.', { size: 8.5 }).xml
  );

  o.push(
    takeaway(
      646,
      'Build once, run anywhere is not a slogan here — it is the reason the image must contain no environment. Say "the builder stage is thrown away and config is mounted, so the bytes that passed staging are the bytes in production."'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

function k8sRequestPath() {
  const o = [];
  const H = 608;

  o.push(
    title(
      'Kubernetes for a frontend — the objects on the request path',
      'Most of your traffic should never reach a pod at all'
    )
  );

  /* 1 · The two request paths */

  o.push(
    text(24, 70, W - 48, 16, '1 · Where each kind of request actually stops', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(
    text(24, 88, 500, 14, 'A hashed asset — `GET /assets/app.8f3a2b.js`', {
      size: 9.5,
      bold: true,
      color: C.ok,
    }).xml
  );
  o.push(box(24, 106, 120, 44, 'Browser', 'accent', { size: 10 }).xml);
  o.push(arrow(146, 128, 184, 128, { color: C.ok, width: 1.4 }).xml);
  o.push(box(186, 106, 140, 44, 'CDN / edge', 'ok', { size: 10 }).xml);
  o.push(box(368, 106, 428, 44, 'Stops here. Immutable, hashed, cached at the edge — the cluster never sees it.', 'ok', {
    size: 9,
    align: 'left',
    padLeft: 12,
  }).xml);

  o.push(
    text(24, 168, 500, 14, 'The document and the API — `GET /` and `/api/*`', {
      size: 9.5,
      bold: true,
      color: C.accent,
    }).xml
  );

  const CHAIN = [
    { x: 24, w: 120, name: 'Browser', tone: 'accent', note: '' },
    { x: 186, w: 140, name: 'CDN / edge', tone: 'sunken', note: 'passes through, or caches the HTML briefly' },
    { x: 368, w: 140, name: '**Ingress**', tone: 'info', note: 'TLS, host and path routing, weights' },
    { x: 550, w: 120, name: '**Service**', tone: 'info', note: 'one stable name, load-balances the pods' },
    { x: 712, w: 84, name: '**Pods**\n×3', tone: 'accent', note: 'your container, replicated' },
  ];

  CHAIN.forEach((c, i) => {
    o.push(box(c.x, 186, c.w, 44, c.name, c.tone, { size: 10 }).xml);
    if (c.note) o.push(text(c.x - 8, 232, c.w + 16, 34, c.note, { size: 8, align: 'center' }).xml);
    if (i < CHAIN.length - 1) {
      const next = CHAIN[i + 1];
      o.push(arrow(c.x + c.w + 2, 208, next.x - 2, 208, { color: C.line, width: 1.4 }).xml);
    }
  });

  /* 2 · The objects */

  o.push(rule(24, 276, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 286, W - 48, 16, '2 · The five objects you must be able to name and draw', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const OBJECTS = [
    ['Deployment', 'accent', 'The desired state: this image, this many replicas. Owns the rollout.'],
    ['ReplicaSet → Pod', 'accent', 'What the Deployment creates. A pod is one running container set.'],
    ['Service', 'info', 'A stable DNS name and virtual IP in front of pods that come and go.'],
    ['Ingress', 'info', 'The HTTP door in: TLS termination, host/path rules, traffic splits.'],
    ['ConfigMap / Secret', 'warn', 'Environment, mounted at runtime. The same image, configured per cluster.'],
  ];

  OBJECTS.forEach(([name, t, why], i) => {
    const x = 24 + i * 158;
    o.push(box(x, 310, 150, 28, name, t, { size: 9.5, rx: 8 }).xml);
    o.push(text(x, 342, 150, 46, why, { size: 8, align: 'center' }).xml);
  });

  /* 3 · Probes */

  o.push(rule(24, 396, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 406, W - 48, 16, '3 · The three probes — and the one that makes a rollout safe', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const PROBES = [
    ['`startupProbe`', 'info', 'Gives a slow boot time to finish before the other two start judging it.'],
    ['`readinessProbe`', 'ok', 'Fails → the Service stops sending traffic. The pod keeps running.'],
    ['`livenessProbe`', 'warn', 'Fails → the container is killed and restarted. Wrong tool for a slow boot.'],
  ];

  PROBES.forEach(([name, t, why], i) => {
    const x = 24 + i * 260;
    o.push(box(x, 430, 252, 28, name, t, { size: 9.5, mono: true, rx: 8 }).xml);
    o.push(text(x, 462, 252, 34, why, { size: 8.5, align: 'center' }).xml);
  });

  o.push(
    box(24, 500, W - 48, 30, 'No readiness probe → the rollout marks a pod ready the moment it starts, and sends real traffic to a process still building its first render.', 'bad', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  o.push(
    takeaway(
      542,
      'What a frontend owes this platform is small and concrete: an image that starts fast, a readiness endpoint that tells the truth, config read at runtime, and assets served from the CDN rather than from a pod.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

function rolloutStrategies() {
  const o = [];
  const H = 620;

  o.push(
    title(
      'Rolling, blue-green, canary — what the browser experiences',
      'Every one of them puts two versions of your app in front of users at the same time'
    )
  );

  /* 1 · The three strategies */

  o.push(
    text(24, 70, W - 48, 16, '1 · The same deploy, three ways', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const STRATS = [
    {
      x: 24,
      tone: 'accent',
      name: 'Rolling update',
      steps: [
        ['v1  v1  v1', 'sunken'],
        ['v1  v1  **v2**', 'warn'],
        ['**v2  v2  v2**', 'ok'],
      ],
      cost: 'Cheapest. Both versions serve for a minute or two, and rollback means rolling forward again.',
    },
    {
      x: 284,
      tone: 'info',
      name: 'Blue / green',
      steps: [
        ['blue v1 live · green v2 warm', 'sunken'],
        ['switch the Service selector', 'warn'],
        ['green v2 live · blue v1 idle', 'ok'],
      ],
      cost: 'Double the pods for a while. Rollback is one selector flip — seconds, not a redeploy.',
    },
    {
      x: 544,
      tone: 'ok',
      name: 'Canary',
      steps: [
        ['v1 95%  ·  v2 5%', 'sunken'],
        ['watch vitals + errors', 'warn'],
        ['ramp 25% → 50% → 100%', 'ok'],
      ],
      cost: 'Ingress weights split the traffic. The only one that catches a regression before everyone has it.',
    },
  ];

  for (const s of STRATS) {
    o.push(panel(s.x, 94, 252, 194, s.name, s.tone).xml);
    s.steps.forEach(([t, tn], i) => {
      o.push(box(s.x + 14, 130 + i * 36, 224, 28, t, tn, { size: 9, rx: 6 }).xml);
      if (i < 2) {
        o.push(arrow(s.x + 126, 158 + i * 36, s.x + 126, 164 + i * 36, { color: C.line, width: 1 }).xml);
      }
    });
    o.push(text(s.x + 14, 240, 224, 42, s.cost, { size: 8.5 }).xml);
  }

  /* 2 · The stale-chunk failure */

  o.push(rule(24, 300, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 310, W - 48, 16, '2 · What breaks for a tab that was already open', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const SEQ = [
    ['Tab opened on **v1**', 'sunken'],
    ['User clicks a lazy route', 'sunken'],
    ['`GET /assets/feed.a1b2.js`', 'warn'],
    ['Pods are **v2** — that hash is gone → **404**', 'bad'],
  ];
  SEQ.forEach(([t, tn], i) => {
    const x = 24 + i * 198;
    o.push(box(x, 334, 178, 42, t, tn, { size: 8.5, rx: 6 }).xml);
    if (i < 3) o.push(arrow(x + 180, 355, x + 196, 355, { color: C.line, width: 1.2 }).xml);
  });
  o.push(
    text(24, 382, W - 48, 14, 'A blank screen and a lost form, caused by a deploy that every dashboard called successful.', {
      size: 9,
      align: 'center',
      color: C.bad,
    }).xml
  );

  o.push(
    text(24, 406, W - 48, 16, 'The two fixes, and you want both', {
      size: 11.5,
      bold: true,
      color: C.warn,
    }).xml
  );
  const FIXES = [
    ['Assets on the CDN, not in the pod', 'A chunk is not a pod resource. Upload to object storage before the rollout, keep the last few builds, and a retired pod takes nothing with it.'],
    ['Detect the new build, offer a reload', 'Poll a tiny `/version.json`; when the SHA changes show a toast. Never force a reload on someone mid-form.'],
  ];
  FIXES.forEach(([name, why], i) => {
    const x = 24 + i * 392;
    o.push(box(x, 430, 380, 28, name, 'ok', { size: 9.5, rx: 8 }).xml);
    o.push(text(x, 462, 380, 44, why, { size: 8.5 }).xml);
  });

  o.push(
    takeaway(
      520,
      'Pick the strategy from what a bad version costs, not from what is fashionable: rolling for a low-stakes internal app, blue-green when rollback speed is the requirement, canary when a regression must be found on 1% of users instead of all of them.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── CDN, edge, and AI features ───────────────────────────────────── */

function cdnEdge() {
  const o = [];
  const H = 622;

  o.push(
    title(
      'CDN and the edge — hit, miss, and the key that decides which',
      'The largest performance lever a frontend has, and the one most often configured once and never read again'
    )
  );

  /* 1 · Hit and miss */

  o.push(
    text(24, 70, W - 48, 16, '1 · Two requests, one cached and one not', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(box(24, 96, 120, 46, 'Browser\nin Mumbai', 'accent', { size: 9.5 }).xml);
  o.push(arrow(146, 119, 178, 119, { color: C.line, width: 1.4 }).xml);
  o.push(box(182, 96, 150, 46, '**PoP** — Mumbai\nedge cache', 'ok', { size: 9.5 }).xml);

  o.push(arrow(334, 108, 372, 108, { color: C.ok, width: 1.6 }).xml);
  o.push(box(376, 92, 200, 26, '**HIT** — 8 ms, done', 'ok', { size: 9, rx: 6 }).xml);

  o.push(arrow(334, 132, 372, 132, { color: C.bad, width: 1.4, dashed: true }).xml);
  o.push(box(376, 120, 200, 26, '**MISS** — go upstream', 'bad', { size: 9, rx: 6 }).xml);
  o.push(arrow(578, 133, 606, 133, { color: C.line, width: 1.4 }).xml);
  o.push(box(610, 110, 92, 46, '**Shield**\nPoP', 'info', { size: 9 }).xml);
  o.push(arrow(704, 133, 722, 133, { color: C.line, width: 1.4 }).xml);
  o.push(box(726, 110, 70, 46, 'Origin', 'warn', { size: 9.5 }).xml);

  o.push(
    text(24, 158, W - 48, 26, 'Without an origin shield, a cold cache in 200 PoPs is 200 requests to your origin for the same file. With it — plus request coalescing — the origin sees one.', {
      size: 9,
      align: 'center',
      italic: true,
    }).xml
  );

  /* 2 · The cache key */

  o.push(rule(24, 192, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 202, W - 48, 16, '2 · The cache key decides your hit rate', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(panel(24, 226, 380, 178, 'A key that destroys the hit rate', 'bad').xml);
  [
    ['`?utm_source=twitter` in the key', 'every campaign link is a new object'],
    ['all cookies in the key', 'an analytics cookie makes every user unique'],
    ['`Vary: User-Agent`', 'thousands of variants of one file'],
  ].forEach(([k, why], i) => {
    o.push(box(38, 262 + i * 44, 352, 24, k, 'bad', { size: 8.5, rx: 5 }).xml);
    o.push(text(38, 286 + i * 44, 352, 16, why, { size: 8 }).xml);
  });

  o.push(panel(416, 226, 380, 178, 'A key that works', 'ok').xml);
  [
    ['strip marketing params before the key', 'one object per real URL'],
    ['ignore every cookie except the ones that change the body', 'anonymous HTML stays cacheable'],
    ['`Vary: Accept-Encoding` only', 'two variants: brotli and gzip'],
  ].forEach(([k, why], i) => {
    o.push(box(430, 262 + i * 44, 352, 24, k, 'ok', { size: 8.5, rx: 5 }).xml);
    o.push(text(430, 286 + i * 44, 352, 16, why, { size: 8 }).xml);
  });

  /* 3 · Headers and invalidation */

  o.push(rule(24, 416, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 426, W - 48, 16, '3 · Two audiences, two headers — and four ways to invalidate', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(box(24, 450, 380, 26, 'max-age → the browser   ·   s-maxage → the CDN', 'accent', {
    size: 9,
    mono: true,
    rx: 6,
  }).xml);
  o.push(
    text(24, 478, 380, 30, 'Hashed asset: `max-age=31536000, immutable`. HTML: `max-age=0, s-maxage=60, stale-while-revalidate=600`.', { size: 8.5 }).xml
  );

  const LADDER = [
    ['1 · Versioned URL', 'ok', 'nothing to invalidate'],
    ['2 · Surrogate key', 'ok', 'purge by tag'],
    ['3 · Short TTL + SWR', 'warn', 'stale for a minute'],
    ['4 · Purge', 'bad', 'the emergency lever'],
  ];
  LADDER.forEach(([name, t, why], i) => {
    const x = 416 + i * 96;
    o.push(box(x, 450, 88, 26, name, t, { size: 8, rx: 6 }).xml);
    o.push(text(x, 478, 88, 30, why, { size: 7.5, align: 'center' }).xml);
  });

  o.push(
    takeaway(
      518,
      'The two sentences that score: "static assets never reach a pod, they are immutable at the edge", and "I invalidate by changing the URL, not by purging" — because a global purge is both slow to propagate and a thundering herd against the origin.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

function aiStreamingUi() {
  const o = [];
  const H = 604;

  o.push(
    title(
      'Streaming UI for a model call',
      'Total time is roughly fixed; time to *first token* is the entire perceived difference'
    )
  );

  /* 1 · Waiting vs streaming */

  o.push(
    text(24, 70, W - 48, 16, '1 · The same 8-second answer, two ways', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const X0 = 150;
  const X1 = 796;
  const sc = (v) => X0 + (v / 8) * (X1 - X0);

  o.push(text(24, 100, 120, 20, 'Await the whole\nresponse', { size: 9, align: 'right', color: C.bad }).xml);
  o.push(box(sc(0), 96, sc(7.6) - sc(0), 28, 'spinner — nothing to read', 'bad', { size: 9, rx: 5 }).xml);
  o.push(box(sc(7.6), 96, sc(8) - sc(7.6), 28, '', 'ok', { size: 9, rx: 5 }).xml);
  o.push(text(150, 126, 646, 14, 'Eight seconds of a spinner, then a wall of text. Users reload, or leave.', { size: 8.5 }).xml);

  o.push(text(24, 158, 120, 20, 'Stream the\ntokens', { size: 9, align: 'right', color: C.ok }).xml);
  o.push(box(sc(0), 154, sc(0.4) - sc(0), 28, 'queued', 'warn', { size: 8, rx: 5 }).xml);
  o.push(box(sc(0.4), 154, sc(8) - sc(0.4), 28, 'text arriving, readable from the first word', 'ok', { size: 9, rx: 5 }).xml);
  o.push(arrow(sc(0.4), 200, sc(0.4), 184, { color: C.accent, width: 1.4 }).xml);
  o.push(text(sc(0.4) - 70, 200, 140, 14, 'first token — 400 ms', { size: 8, align: 'center', color: C.accent }).xml);

  /* 2 · The states */

  o.push(rule(24, 226, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 236, W - 48, 16, '2 · The seven states — "loading" and "done" are not enough', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const STATES = [
    ['Queued', 'warn', 'thinking indicator'],
    ['Streaming', 'ok', 'partial text + Stop'],
    ['Tool running', 'info', '"Searching…"'],
    ['Complete', 'ok', 'copy · retry · feedback'],
    ['Stopped', 'accent', 'keep the partial text'],
    ['Failed mid-stream', 'bad', 'retry without losing it'],
    ['Refused / empty', 'bad', 'a real message'],
  ];
  STATES.forEach(([name, t, ui], i) => {
    const x = 24 + (i % 4) * 194;
    const y = 262 + Math.floor(i / 4) * 62;
    o.push(box(x, y, 178, 26, name, t, { size: 9, rx: 8 }).xml);
    o.push(text(x, y + 28, 178, 26, ui, { size: 8, align: 'center' }).xml);
  });

  /* 3 · Render cost */

  o.push(rule(24, 392, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 402, W - 48, 16, '3 · The rendering trap', { size: 11.5, bold: true, color: C.fg }).xml
  );

  o.push(panel(24, 426, 380, 104, 'Re-parse markdown on every token', 'bad').xml);
  o.push(box(38, 458, 352, 24, 'O(n²) — token 900 re-parses 900 tokens', 'bad', { size: 8.5, rx: 5 }).xml);
  o.push(text(38, 486, 352, 34, 'The tab janks by the third paragraph, and the whole transcript re-renders with every chunk.', { size: 8.5 }).xml);

  o.push(panel(416, 426, 380, 104, 'Append text, parse on a throttle', 'ok').xml);
  o.push(box(430, 458, 352, 24, 'plain text while streaming · parse every ~100 ms', 'ok', { size: 8.5, rx: 5 }).xml);
  o.push(text(430, 486, 352, 34, 'Memoise completed messages, virtualise long conversations, and never flash a half-streamed code fence.', { size: 8.5 }).xml);

  o.push(
    takeaway(
      544,
      'Cancellation is a feature, not an edge case: abort the fetch *and* tell the server, or you keep paying for tokens nobody will read. And the API key never leaves your server — a key in the bundle is a public key.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

function ragPipeline() {
  const o = [];
  const H = 602;

  o.push(
    title(
      'RAG — retrieve, rerank, ground, cite',
      'Almost all of the quality is in the retrieval; almost none of it is in the prompt'
    )
  );

  /* 1 · Offline indexing */

  o.push(
    text(24, 70, W - 48, 16, '1 · Offline, once per document change', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const INDEX = [
    ['Source docs', 'sunken', 'markdown, pages, PDFs'],
    ['Chunk', 'accent', 'on **headings**, not on a character count'],
    ['Embed', 'info', 'vector + metadata: url, section, updated, scope'],
    ['Index', 'ok', 'vector store **and** a keyword index'],
  ];
  INDEX.forEach(([name, t, why], i) => {
    const x = 24 + i * 198;
    o.push(box(x, 96, 178, 34, name, t, { size: 9.5, rx: 6 }).xml);
    o.push(text(x, 132, 178, 32, why, { size: 8, align: 'center' }).xml);
    if (i < 3) o.push(arrow(x + 180, 113, x + 196, 113, { color: C.line, width: 1.3 }).xml);
  });

  /* 2 · Per query */

  o.push(rule(24, 174, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 184, W - 48, 16, '2 · Per query — and the two steps everyone skips', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const QUERY = [
    ['Question', 'accent', '"why is my build 400 kB?"'],
    ['Retrieve\nhybrid', 'warn', 'vector **+** keyword — top 50'],
    ['Rerank', 'warn', 'cross-encoder → best 5'],
    ['Ground', 'info', 'chunks + ids in the prompt'],
    ['Stream + cite', 'ok', 'answer, with sources'],
  ];
  QUERY.forEach(([name, t, why], i) => {
    const x = 24 + i * 158;
    o.push(box(x, 208, 140, 40, name, t, { size: 9, rx: 6 }).xml);
    o.push(text(x - 6, 250, 152, 32, why, { size: 8, align: 'center' }).xml);
    if (i < 4) o.push(arrow(x + 142, 228, x + 156, 228, { color: C.line, width: 1.3 }).xml);
  });

  o.push(
    box(24, 288, W - 48, 30, 'The permission filter belongs **inside the retrieval query**, scoped to the current user. "Only answer about documents they can see" is an instruction, not an access control.', 'bad', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  /* 3 · Failure table */

  o.push(rule(24, 332, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 342, W - 48, 16, '3 · Which half is broken', { size: 11.5, bold: true, color: C.fg }).xml
  );

  const FAILS = [
    ['Confident but wrong', 'Retrieval missed — the model answered from its weights'],
    ['Right doc, wrong part', 'Chunks too large, or no reranking'],
    ['Cannot find an error code', 'Pure vector search — add keyword'],
    ['Answers from a deleted page', 'Stale index: deletions must propagate too'],
  ];
  FAILS.forEach(([symptom, cause], i) => {
    const y = 366 + i * 34;
    o.push(box(24, y, 250, 28, symptom, 'bad', { size: 8.5, rx: 6 }).xml);
    o.push(arrow(278, y + 14, 294, y + 14, { color: C.line, width: 1.1 }).xml);
    o.push(text(300, y, 496, 28, cause, { size: 8.5 }).xml);
  });

  o.push(
    box(24, 508, W - 48, 30, 'Measure the halves separately: **recall@k** for retrieval (was the right chunk in the top *k*?), then groundedness and citation accuracy for generation.', 'ok', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  o.push(
    takeaway(
      548,
      'The frontend owes the user three things a demo skips: the sources, visible and clickable; citations that hydrate rather than jump as tokens stream; and a designed "I could not find this" state — because a refusal is a success, and without a place to put it the model invents instead.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ══════════════════════════════════════════════════════════════════
   21 — Normalized state: byId and allIds
   ══════════════════════════════════════════════════════════════════ */

function normalizedState() {
  const o = [];
  const H = 664;

  o.push(
    title(
      'Normalized state — one collection, two shapes',
      'A dictionary answers "give me this one". An array answers "in what order".'
    )
  );

  /* ── 1 · The lookup, both ways ──────────────────────────────────── */

  o.push(
    text(24, 68, W - 48, 16, '1 · Update one record', { size: 11.5, bold: true, color: C.fg }).xml
  );

  /* Left: the array. The scan is drawn as three equal cells so "walk until
     the id matches" is a distance on the page rather than a word. */
  o.push(panel(24, 90, 380, 212, 'An array of objects', 'bad').xml);
  o.push(
    box(38, 122, 352, 38, 'users: [ { id: "u2", name: "Bob" }, … ]', 'sunken', {
      mono: true,
      size: 10,
      align: 'left',
      padLeft: 10,
    }).xml
  );

  const arr = cells(
    44,
    176,
    [{ text: 'u1\nAlice' }, { text: 'u2\nBob', tone: 'bad', bold: true }, { text: 'u3\nCharlie' }],
    { cw: 108, gap: 10, ch: 44, size: 10, indices: true }
  );
  o.push(arr.xml);
  o.push(
    text(44, 240, 344, 16, 'compare every id until one matches', {
      size: 10,
      align: 'center',
      color: C.bad,
    }).xml
  );
  o.push(pill(44, 262, 92, 22, 'O(n)', 'bad', { size: 12 }).xml);
  o.push(text(146, 262, 242, 22, 'and O(n) again to delete', { size: 10 }).xml);

  /* Right: the same three records, addressed by key. */
  o.push(panel(416, 90, 380, 212, '`byId` + `allIds`', 'ok').xml);
  o.push(
    box(430, 122, 352, 38, 'byId:   { u1: {…}, u2: {…}, u3: {…} }\nallIds: ["u1", "u2", "u3"]', 'sunken', {
      mono: true,
      size: 10,
      align: 'left',
      padLeft: 10,
    }).xml
  );

  const dict = cells(
    436,
    176,
    [{ text: 'u1\nAlice' }, { text: 'u2\nBob', tone: 'ok', bold: true }, { text: 'u3\nCharlie' }],
    { cw: 108, gap: 10, ch: 44, size: 10 }
  );
  o.push(dict.xml);
  /* Keys, not indices — the whole difference between the two halves. */
  ['"u1"', '"u2"', '"u3"'].forEach((k, i) => {
    o.push(
      text(dict.left(i), 221, 108, 14, k, {
        align: 'center',
        size: 10,
        mono: true,
        color: C.muted,
      }).xml
    );
  });
  o.push(
    text(436, 240, 344, 16, 'byId["u2"] — one hop, nothing compared', {
      size: 10,
      align: 'center',
      color: C.ok,
    }).xml
  );
  o.push(pill(436, 262, 92, 22, 'O(1)', 'ok', { size: 12 }).xml);
  o.push(text(538, 262, 242, 22, 'and O(1) to delete', { size: 10 }).xml);

  /* ── 2 · Why it is two halves and not one ───────────────────────── */

  o.push(
    text(24, 312, W - 48, 16, '2 · Why both halves', { size: 11.5, bold: true, color: C.fg }).xml
  );
  o.push(
    box(24, 332, 380, 62, '`byId` — the lookup\nAn update is a spread of one entry, so nothing else in the store changes identity. Object key order is not something to render from.', 'info', {
      size: 10,
      align: 'left',
      padLeft: 12,
    }).xml
  );
  o.push(
    box(416, 332, 380, 62, '`allIds` — the order\nThe list renders by mapping this array, so order is explicit. A sorted or filtered view is a second id array, never a re-sorted `byId`.', 'accent', {
      size: 10,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  /* ── 3 · The payoff that decides the architecture ───────────────── */

  o.push(
    text(24, 404, W - 48, 16, '3 · One copy, many readers', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );
  o.push(panel(24, 424, W - 48, 100, 'Entities reference each other by id, never by copy', 'accent').xml);

  o.push(
    box(40, 456, 212, 46, 'posts.byId["p9"]\n{ id: "p9", authorId: "u2" }', 'sunken', {
      mono: true,
      size: 9.5,
      align: 'left',
      padLeft: 10,
    }).xml
  );
  o.push(arrow(256, 479, 336, 479, { color: C.accent, label: 'authorId' }).xml);
  o.push(
    box(340, 456, 180, 46, 'users.byId["u2"]\n{ name: "Bob" }', 'ok', {
      mono: true,
      size: 9.5,
      align: 'left',
      padLeft: 10,
    }).xml
  );
  o.push(arrow(524, 479, 590, 479, { color: C.accent }).xml);

  ['post header', 'comment list', '@mention chip'].forEach((r, i) => {
    o.push(box(594, 444 + i * 24, 182, 20, r, 'info', { size: 9.5, rx: 6 }).xml);
  });

  /* ── 4 · Same shape under another name ──────────────────────────── */

  o.push(
    text(24, 534, W - 48, 16, '4 · The same pattern, renamed', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );
  o.push(
    box(24, 554, W - 48, 38, "Redux Toolkit's `createEntityAdapter` calls the two halves **`entities`** and **`ids`** — the identical shape, plus `upsertOne` / `removeMany` / `getSelectors` and a `sortComparer`.", 'info', {
      size: 10.5,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  o.push(
    takeaway(
      606,
      'The dictionary answers "give me this one"; the array answers "in what order" — neither does the other job. And deleting an entity leaves its id behind in every array that referenced it, so decide on a cascade before you need one.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── Registry ─────────────────────────────────────────────────────── */

export const DIAGRAMS = {
  'loading-waterfall': {
    title: 'The critical path — serialised vs parallelised',
    build: loadingWaterfall,
  },
  'auth-flows': {
    title: 'Frontend auth — token storage and silent refresh',
    build: authFlows,
  },
  'video-player': {
    title: 'Adaptive bitrate — the quality-selection loop',
    build: videoPlayer,
  },
  'ecommerce-checkout': {
    title: 'Checkout — cart, payment and order boundaries',
    build: ecommerceCheckout,
  },
  'analytics-dashboard': {
    title: 'Dashboard — independent widget queries',
    build: analyticsDashboard,
  },
  chat: {
    title: 'Chat — message lifecycle, ordering and the reconnect gap',
    build: chat,
  },
  'collab-editor': {
    title: 'Collaborative editing — last-write-wins vs OT vs CRDT',
    build: collabEditor,
  },
  'news-feed': {
    title: 'News feed — request split, virtualization, cursor pagination',
    build: newsFeed,
  },
  autocomplete: {
    title: 'Autocomplete — the out-of-order response race',
    build: autocomplete,
  },
  'architecture-layers': {
    title: 'The layered frontend architecture',
    build: architectureLayers,
  },
  'rendering-strategies': {
    title: 'Rendering strategies — where each one moves the paint',
    build: renderingStrategies,
  },
  'caching-layers': {
    title: 'The five caches a request falls through',
    build: cachingLayers,
  },
  'state-topology': {
    title: 'Four kinds of state and where each one lives',
    build: stateTopology,
  },
  'realtime-transports': {
    title: 'Real-time transports — polling, long polling, SSE, WebSocket',
    build: realtimeTransports,
  },
  'container-anatomy': {
    title: 'Multi-stage build — the toolchain does not ship',
    build: containerAnatomy,
  },
  'k8s-request-path': {
    title: 'Kubernetes for a frontend — the objects on the request path',
    build: k8sRequestPath,
  },
  'rollout-strategies': {
    title: 'Rolling, blue-green, canary — what the browser experiences',
    build: rolloutStrategies,
  },
  'cdn-edge': {
    title: 'CDN and the edge — hit, miss, and the cache key',
    build: cdnEdge,
  },
  'ai-streaming-ui': {
    title: 'Streaming UI for a model call',
    build: aiStreamingUi,
  },
  'rag-pipeline': {
    title: 'RAG — retrieve, rerank, ground, cite',
    build: ragPipeline,
  },
  'normalized-state': {
    title: 'Normalized state — byId and allIds',
    build: normalizedState,
  },
};
