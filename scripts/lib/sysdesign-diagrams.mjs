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
};
