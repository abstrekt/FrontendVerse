/**
 * Diagrams for the Browser & Web Platform section.
 *
 * Same DSL, palette and furniture as the Blind 75, system-design and React
 * sets — see `drawio-builder.mjs` for the helpers and `diagram-furniture.mjs`
 * for the 820px canvas, the heading pair and the takeaway strip.
 *
 * Both of these belong to learning 132 (`Cookies, localStorage, and
 * sessionStorage`). The section's two hardest facts are spatial ones — what
 * a store is *scoped to*, and where an auth cookie physically travels — and
 * prose keeps flattening them into a table that reads as "cookies are also
 * domain-wide", which is exactly the misunderstanding.
 */

import { C, box, text, arrow, panel, rule, pill } from './drawio-builder.mjs';
import { W, title, takeaway } from './diagram-furniture.mjs';

/* Reachability marks. Rendered as words with a tick rather than a tick and a
   cross, because a cross exports as a missing glyph in some draw.io builds
   and "isolated" is not a failure anyway — it is the whole point of an
   origin-scoped store. */
const YES = (t) => ({ text: t, tone: 'ok' });
const NO = (t) => ({ text: t, tone: 'sunken' });

/* ────────────────────────────────────────────────────────────────────
   1 · Scope — origin-locked vs Domain + Path
   ──────────────────────────────────────────────────────────────────── */

function storageScope() {
  const o = [];
  const H = 590;

  o.push(
    title(
      'Scope — `localStorage` is origin-locked, a cookie is not',
      'Everything below was set by one page: `https://shop.example.com/app`'
    )
  );

  /* ── The reachability grid ─────────────────────────────────────── */

  o.push(
    text(24, 70, W - 48, 16, '1 · Who can see it, from where', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const COLS = [
    { x: 200, w: 196, name: 'localStorage', tone: 'info' },
    { x: 404, w: 196, name: 'sessionStorage', tone: 'accent' },
    { x: 608, w: 196, name: 'cookie', tone: 'warn' },
  ];

  for (const c of COLS) {
    o.push(box(c.x, 92, c.w, 26, c.name, c.tone, { size: 11, bold: true, rx: 8 }).xml);
  }
  o.push(
    text(24, 92, 170, 26, 'scope tested →', {
      size: 10,
      italic: true,
      align: 'right',
      color: C.muted,
    }).xml
  );

  const ROWS = [
    [
      'Another tab on the **same origin**',
      YES('shared'),
      NO('tab-local, a fresh store'),
      YES('shared'),
    ],
    [
      '`login.example.com`\n(sibling subdomain)',
      NO('different origin'),
      NO('different origin'),
      YES('with `Domain=example.com`'),
    ],
    [
      '`http://` instead of `https://`',
      NO('scheme is part of the origin'),
      NO('scheme is part of the origin'),
      YES('unless `Secure` is set'),
    ],
    [
      '`shop.example.com:3000`\n(another port)',
      NO('port is part of the origin'),
      NO('port is part of the origin'),
      YES('cookies ignore the port'),
    ],
    [
      'Sent to the **server**',
      NO('JS must attach it by hand'),
      NO('JS must attach it by hand'),
      YES('every request, automatically'),
    ],
  ];

  ROWS.forEach(([labelText, ...marks], i) => {
    const y = 126 + i * 36;
    o.push(text(24, y, 170, 30, labelText, { size: 9, color: C.fg }).xml);
    marks.forEach((m, j) => {
      const c = COLS[j];
      const label = m.tone === 'ok' ? `✓  ${m.text}` : `—  ${m.text}`;
      o.push(box(c.x, y, c.w, 30, label, m.tone, { size: 8.5, rx: 6 }).xml);
    });
  });

  o.push(
    text(24, 306, W - 48, 14, 'Origin = scheme + host + port. A cookie is scoped by none of those three — it is scoped by `Domain` and `Path`.', {
      size: 9,
      align: 'center',
      italic: true,
    }).xml
  );

  /* ── Path, the axis the Storage APIs do not have ───────────────── */

  o.push(rule(24, 328, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 338, W - 48, 16, '2 · `Path` — an axis `localStorage` does not have at all', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const lanes = [
    {
      x: 24,
      tone: 'warn',
      name: 'Cookie set with `Path=/admin`',
      rows: [
        ['`GET /admin/users`', 'sent', 'ok'],
        ['`GET /shop/cart`', 'not sent', 'bad'],
      ],
      note: 'The path prefix decides which requests carry it. Narrowing `Path` shrinks the blast radius of a leak.',
    },
    {
      x: 416,
      tone: 'info',
      name: '`localStorage` on `example.com`',
      rows: [
        ['`/admin/users` page', 'readable', 'info'],
        ['`/shop/cart` page', 'readable', 'info'],
      ],
      note: 'Path is not part of an origin, so every page on the host reads the same store. There is no narrowing it.',
    },
  ];

  for (const lane of lanes) {
    o.push(panel(lane.x, 362, 380, 156, lane.name, lane.tone).xml);
    lane.rows.forEach(([req, verdict, t], i) => {
      const y = 400 + i * 36;
      o.push(box(lane.x + 14, y, 176, 28, req, 'sunken', { size: 9, mono: true, rx: 6 }).xml);
      o.push(
        arrow(lane.x + 194, y + 14, lane.x + 212, y + 14, {
          color: t === 'bad' ? C.bad : t === 'ok' ? C.ok : C.info,
          width: 1.2,
        }).xml
      );
      o.push(box(lane.x + 216, y, 150, 28, verdict, t, { size: 9, bold: true, rx: 6 }).xml);
    });
    o.push(text(lane.x + 14, 474, 352, 32, lane.note, { size: 8.5 }).xml);
  }

  o.push(
    takeaway(
      534,
      'One sentence to say out loud: the Storage APIs are scoped to an **origin** and never leave the browser; a cookie is scoped to a **domain and a path** and is attached to every matching request. That is why the token lives in the cookie and the dark-mode flag lives in `localStorage`.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ────────────────────────────────────────────────────────────────────
   2 · Cookie auth — the round trip and the attributes
   ──────────────────────────────────────────────────────────────────── */

function cookieAuth() {
  const o = [];
  const H = 622;

  o.push(
    title(
      'Cookie auth — the browser does the carrying',
      'Log in once; every later request is authenticated without a line of JavaScript'
    )
  );

  /* ── The round trip ────────────────────────────────────────────── */

  o.push(
    text(24, 70, W - 48, 16, '1 · The round trip', { size: 11.5, bold: true, color: C.fg }).xml
  );

  const STEPS = [
    {
      tone: 'accent',
      label: '**1 · Login**\n`POST /login`',
      note: 'Credentials leave the client exactly once, over HTTPS.',
    },
    {
      tone: 'info',
      label: '**2 · Verify**\nserver checks the password',
      note: 'A session id or a signed JWT is minted server-side.',
    },
    {
      tone: 'ok',
      label: '**3 · `Set-Cookie:`**\nresponse header',
      note: 'The only way to set `HttpOnly` — JS cannot.',
    },
    {
      tone: 'ok',
      label: '**4 · Stored**\nthe browser cookie jar',
      note: '`document.cookie` never shows it.',
    },
    {
      tone: 'ok',
      label: '**5 · Every request**\n`Cookie: auth_token=…`',
      note: 'Attached automatically, to matching Domain + Path.',
    },
  ];

  STEPS.forEach((s, i) => {
    const x = 24 + i * 159;
    o.push(box(x, 96, 144, 66, s.label, s.tone, { size: 9.5 }).xml);
    o.push(text(x, 166, 144, 34, s.note, { size: 8.5, align: 'center' }).xml);
    if (i < STEPS.length - 1) {
      o.push(arrow(x + 146, 129, x + 157, 129, { color: C.line, width: 1.4 }).xml);
    }
  });

  /* ── The attributes ────────────────────────────────────────────── */

  o.push(rule(24, 208, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 218, W - 48, 16, '2 · The attributes — each one closes a specific door', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(
    box(
      24,
      242,
      W - 48,
      30,
      'Set-Cookie: auth_token=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800',
      'sunken',
      { size: 10.5, mono: true, rx: 6 }
    ).xml
  );

  const ATTRS = [
    ['`HttpOnly`', 'ok', 'JavaScript cannot read it. An XSS payload gets nothing.'],
    ['`Secure`', 'ok', 'HTTPS only — nothing to intercept in plaintext.'],
    ['`SameSite=Lax`', 'ok', 'Withheld on cross-site POSTs. This is the CSRF fix.'],
    ['`Path=/`', 'info', 'Which URLs the cookie rides along with.'],
    ['`Max-Age`', 'info', 'Seconds until the browser drops it on its own.'],
  ];

  ATTRS.forEach(([name, t, why], i) => {
    const x = 24 + i * 158;
    o.push(box(x, 286, 150, 30, name, t, { size: 10, mono: true, rx: 6 }).xml);
    o.push(text(x, 320, 150, 44, why, { size: 8.5, align: 'center' }).xml);
  });

  /* ── The two attacks ───────────────────────────────────────────── */

  o.push(rule(24, 372, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 382, W - 48, 16, '3 · The two attacks — and why the trade is worth it', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const ATTACKS = [
    {
      x: 24,
      tone: 'bad',
      name: 'XSS — a script is running on your page',
      rows: [
        ['`localStorage.getItem("t")`', 'stolen', 'bad'],
        ['`HttpOnly` cookie', 'unreadable', 'ok'],
      ],
      note: 'One compromised dependency reads every key in `localStorage`. It cannot read the cookie, because the browser will not hand it over.',
    },
    {
      x: 416,
      tone: 'warn',
      name: 'CSRF — `evil.com` posts to your API',
      rows: [
        ['cookie, no `SameSite`', 'rides along', 'bad'],
        ['`SameSite=Lax`', 'withheld', 'ok'],
      ],
      note: 'The cookie’s own weakness: it is attached automatically, so a forged cross-site request is authenticated too. `SameSite` is the answer.',
    },
  ];

  for (const a of ATTACKS) {
    o.push(panel(a.x, 406, 380, 148, a.name, a.tone).xml);
    a.rows.forEach(([subject, verdict, t], i) => {
      const y = 442 + i * 34;
      o.push(box(a.x + 14, y, 186, 26, subject, 'sunken', { size: 8.5, mono: true, rx: 6 }).xml);
      o.push(
        arrow(a.x + 204, y + 13, a.x + 220, y + 13, {
          color: t === 'bad' ? C.bad : C.ok,
          width: 1.2,
        }).xml
      );
      o.push(box(a.x + 224, y, 142, 26, verdict, t, { size: 9, bold: true, rx: 6 }).xml);
    });
    o.push(text(a.x + 14, 512, 352, 34, a.note, { size: 8.5 }).xml);
  }

  o.push(
    takeaway(
      566,
      'An `HttpOnly` cookie trades an attack you cannot fully prevent (XSS reading a token) for one you close with a single attribute (`SameSite`). That is the whole argument for putting the session in a cookie and the theme in `localStorage`.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── Networking ───────────────────────────────────────────────────── */

function requestLife() {
  const o = [];
  const H = 560;

  o.push(
    title(
      'The life of a request',
      'Three round trips of setup before your request is even sent — on mobile, that is most of the wait'
    )
  );

  /* 1 · The stacked timeline */

  o.push(
    text(24, 70, W - 48, 16, '1 · A cold request, 180 ms round trip', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const TOTAL = 900;
  const X0 = 24;
  const SPAN = W - 48;
  const px = (v) => (v / TOTAL) * SPAN;

  const PHASES = [
    ['DNS', 120, 'warn', 'resolve the hostname'],
    ['TCP', 180, 'warn', 'SYN · SYN-ACK · ACK'],
    ['TLS', 180, 'warn', 'certificate and keys'],
    ['request', 90, 'info', 'your bytes leave'],
    ['TTFB', 130, 'accent', 'server thinks'],
    ['download', 200, 'ok', 'the body streams in'],
  ];

  let x = X0;
  let acc = 0;
  for (const [name, ms, t, why] of PHASES) {
    const w = px(ms);
    o.push(box(x, 96, w - 2, 40, `**${name}**\n${ms} ms`, t, { size: 8.5, rx: 6 }).xml);
    o.push(text(x - 20, 140, w + 38, 26, why, { size: 7.5, align: 'center' }).xml);
    acc += ms;
    o.push(text(Math.min(x + w - 40, W - 80), 172, 76, 12, `${acc} ms`, { size: 7.5, align: 'center', color: C.muted }).xml);
    x += w;
  }

  o.push(
    box(24, 192, px(480) - 2, 26, 'setup — nothing useful transferred', 'bad', { size: 9, rx: 5 }).xml
  );
  o.push(
    box(24 + px(480), 192, px(420) - 2, 26, 'actually moving your page', 'ok', { size: 9, rx: 5 }).xml
  );

  /* 2 · Reused connection */

  o.push(rule(24, 236, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 246, W - 48, 16, '2 · The second request to the same origin', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  let rx = X0;
  for (const [name, ms, , ] of PHASES) {
    const w = px(ms);
    const skipped = ['DNS', 'TCP', 'TLS'].includes(name);
    o.push(
      box(rx, 272, w - 2, 34, skipped ? `${name}\nskipped` : `**${name}**\n${ms} ms`, skipped ? 'sunken' : 'ok', {
        size: 8,
        rx: 6,
        dashed: skipped,
      }).xml
    );
    rx += w;
  }
  o.push(
    text(24, 312, W - 48, 14, 'Connection reuse removes 480 ms. This is why origin count is a performance decision, and why one `preconnect` can beat a week of code splitting.', {
      size: 9,
      align: 'center',
      italic: true,
    }).xml
  );

  /* 3 · What each phase responds to */

  o.push(rule(24, 336, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 346, W - 48, 16, '3 · What each phase actually responds to', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const FIXES = [
    ['DNS', 'accent', 'Fewer origins · `preconnect` · sane record TTLs'],
    ['TCP + TLS', 'info', 'Connection reuse · TLS 1.3 · terminate at a nearby CDN PoP'],
    ['TTFB', 'warn', 'Server work, cache hits, and physical distance to the user'],
    ['Download', 'ok', 'Brotli · smaller payloads · the first 14 kB matter most'],
  ];
  FIXES.forEach(([name, t, why], i) => {
    const fx = 24 + i * 194;
    o.push(box(fx, 370, 178, 26, name, t, { size: 9.5, rx: 8 }).xml);
    o.push(text(fx, 400, 178, 46, why, { size: 8, align: 'center' }).xml);
  });

  o.push(
    box(24, 452, W - 48, 32, 'Every extra origin pays DNS + TCP + TLS again — and cache partitioning means a "shared" CDN copy of a library is no longer shared between sites. Self-host, and `preconnect` to what is left.', 'info', {
      size: 9,
      align: 'left',
      padLeft: 12,
    }).xml
  );

  o.push(
    takeaway(
      494,
      'Split a slow TTFB before you theorise about it: DNS, connect, TLS and server time are four different problems with four different fixes, and the waterfall already tells you which one you have.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

function httpVersions() {
  const o = [];
  const H = 616;

  o.push(
    title(
      'HTTP/1.1, HTTP/2, HTTP/3 — one problem, pushed one layer down each time',
      'Head-of-line blocking: the request queue, then TCP, then nothing'
    )
  );

  const LANES = [
    {
      y: 88,
      name: 'HTTP/1.1',
      tone: 'bad',
      sub: 'One request at a time per connection. Browsers opened ~6 connections to compensate.',
      bars: [
        [0, 200, '`app.js`', 'accent'],
        [200, 340, '`style.css`', 'info'],
        [340, 420, '`logo.svg`', 'ok'],
      ],
      marker: '`style.css` queued behind it',
      markerAt: 200,
      hol: 'Blocking is in the **HTTP queue** — a slow response holds up everything behind it.',
    },
    {
      y: 232,
      name: 'HTTP/2',
      tone: 'warn',
      sub: 'One connection, many interleaved streams, compressed headers.',
      bars: [
        [0, 60, '`app.js`', 'accent'],
        [60, 110, '`style`', 'info'],
        [110, 150, '`logo`', 'ok'],
        [150, 290, 'all three streams stalled — TCP will not deliver out of order', 'bad'],
      ],
      marker: 'packet lost here',
      markerAt: 150,
      hol: 'Blocking moved down to **TCP** — one lost packet stalls *every* stream until it is retransmitted.',
    },
    {
      y: 376,
      name: 'HTTP/3',
      tone: 'ok',
      sub: 'QUIC over UDP: independent streams, 1-RTT handshake, survives a network change.',
      bars: [
        [0, 60, '`app.js`', 'accent'],
        [60, 110, '`style`', 'info'],
        [110, 150, '`logo`', 'ok'],
        [150, 200, '`app.js` stalled', 'bad'],
        [200, 245, '`style`', 'info'],
        [245, 290, '`logo`', 'ok'],
      ],
      marker: 'packet lost here',
      markerAt: 150,
      hol: 'A lost packet stalls **only its own stream**. The other downloads keep going.',
    },
  ];

  const T0 = 150;
  const T1 = 796;
  const scale = (v) => T0 + (v / 440) * (T1 - T0);

  for (const lane of LANES) {
    o.push(text(24, lane.y + 8, 120, 20, lane.name, { size: 11, bold: true, color: C[lane.tone] }).xml);
    o.push(text(150, lane.y - 4, 646, 14, lane.sub, { size: 8.5 }).xml);
    for (const [a, b, label, t] of lane.bars) {
      o.push(box(scale(a), lane.y + 16, scale(b) - scale(a) - 2, 30, label, t, { size: 8, rx: 5 }).xml);
    }
    o.push(text(24, lane.y + 52, 120, 26, 'one connection', { size: 8, align: 'right' }).xml);

    /* The lost packet, and what it costs. */
    o.push(arrow(scale(lane.markerAt), lane.y + 76, scale(lane.markerAt), lane.y + 50, { color: C.bad, width: 1.4 }).xml);
    o.push(text(scale(lane.markerAt) - 90, lane.y + 76, 180, 14, lane.marker, { size: 8, align: 'center', color: C.bad }).xml);
    o.push(box(150, lane.y + 92, 646, 26, lane.hol, lane.tone, { size: 8.5, align: 'left', padLeft: 10, rx: 5 }).xml);
  }

  /* What changes in your build */

  o.push(rule(24, 512, W - 48, { dashed: true }).xml);
  const PRACTICE = [
    ['Concatenate everything', 'bad', 'One byte changed invalidates the whole file'],
    ['Domain sharding', 'bad', 'Extra handshakes, no parallelism to win'],
    ['Many small chunks', 'warn', 'Fine — until per-request overhead eats the win'],
    ['Fewer origins', 'ok', 'Still right: connection reuse'],
  ];
  PRACTICE.forEach(([name, t, why], i) => {
    const x = 24 + i * 194;
    o.push(box(x, 522, 178, 24, name, t, { size: 9, rx: 8 }).xml);
    o.push(text(x, 548, 178, 30, why, { size: 8, align: 'center' }).xml);
  });

  o.push(
    text(24, 584, W - 48, 20, 'Concatenation and sharding were HTTP/1.1 workarounds. Keeping them today costs you cache hits and handshakes.', {
      size: 9,
      align: 'center',
      italic: true,
      color: C.warn,
    }).xml
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ────────────────────────────────────────────────────────────────────
   5 · The Performance API — one timeline, four sources of entries
   ──────────────────────────────────────────────────────────────────── */

function performanceApi() {
  const o = [];
  const H = 610;

  o.push(
    title(
      'The Performance API — one monotonic timeline, four kinds of entry',
      'Everything is measured in milliseconds since `performance.timeOrigin`, never since 1970'
    )
  );

  const X = 150; // where the timeline starts
  const TW = 560; // its full width — ms 0 … 2400

  /* ── The axis ──────────────────────────────────────────────────── */

  o.push(
    box(X - 8, 78, 16, 16, '', 'accent', { rx: 30, fill: C.accent, stroke: C.accent }).xml
  );
  o.push(
    text(X - 76, 78, 64, 16, 'timeOrigin', { align: 'right', size: 9.5, bold: true, mono: true })
      .xml
  );
  o.push(arrow(X, 86, X + TW + 20, 86, { color: C.line, width: 1.5 }).xml);
  for (const [ms, dx] of [[0, 0], [600, 140], [1200, 280], [1800, 420], [2400, 560]]) {
    o.push(arrow(X + dx, 82, X + dx, 90, { color: C.line, width: 1, endArrow: 'none' }).xml);
    o.push(
      text(X + dx - 26, 92, 52, 13, `${ms}ms`, { align: 'center', size: 8.5, mono: true }).xml
    );
  }

  /* ── Row 1 · Navigation Timing ─────────────────────────────────── */

  const rows = [
    {
      label: 'Navigation Timing',
      sub: 'one entry, the document itself',
      y: 124,
      api: "getEntriesByType('navigation')",
      draw(y) {
        const segs = [
          ['DNS', 0, 52, 'info'],
          ['TCP', 52, 60, 'info'],
          ['TLS', 112, 56, 'info'],
          ['request', 168, 44, 'warn'],
          ['TTFB wait', 212, 96, 'warn'],
          ['response', 308, 74, 'ok'],
          ['DOM parse', 382, 104, 'accent'],
        ];
        return segs
          .map(([n, dx, w, t]) => box(X + dx, y, w, 17, n, t, { size: 8, rx: 4 }).xml)
          .join('');
      },
      note: 'nav.responseStart − nav.requestStart is your TTFB',
    },
    {
      label: 'Resource Timing',
      sub: 'one entry per asset fetched',
      y: 186,
      api: "getEntriesByType('resource')",
      draw(y) {
        const res = [
          ['app.js · 142 KB', 120, 150, 'accent'],
          ['main.css · 18 KB', 280, 78, 'ok'],
          ['/api/me · 2 KB', 372, 96, 'warn'],
        ];
        return res.map(([n, dx, w, t]) => box(X + dx, y, w, 17, n, t, { size: 8, rx: 4 }).xml).join('');
      },
      note: 'transferSize === 0 means it came from cache',
    },
    {
      label: 'User Timing',
      sub: 'the marks you set yourself',
      y: 248,
      api: "mark() · measure()",
      draw(y) {
        const out = [];
        const a = X + 180;
        const b = X + 430;
        for (const [x, n] of [[a, 'fetch-start'], [b, 'fetch-end']]) {
          out.push(arrow(x, y - 6, x, y + 22, { color: C.accent, width: 1.5, endArrow: 'none' }).xml);
          out.push(
            text(x - 46, y + 22, 92, 13, n, { align: 'center', size: 8, mono: true, color: C.accent })
              .xml
          );
        }
        out.push(box(a, y, b - a, 17, "measure('UserDataFetch') — 250ms", 'accent', { size: 8, rx: 4 }).xml);
        return out.join('');
      },
      note: 'the only entries that know what your app was doing',
    },
    {
      label: 'Paint & Element',
      sub: 'what the user actually saw',
      y: 320,
      api: "type: 'paint' · 'largest-contentful-paint'",
      draw(y) {
        const out = [];
        for (const [dx, n, t] of [[196, 'FCP', 'ok'], [392, 'LCP', 'warn']]) {
          out.push(
            box(X + dx - 7, y + 1, 14, 14, '', t, {
              rx: 30,
              fill: t === 'ok' ? C.ok : C.warn,
              stroke: t === 'ok' ? C.ok : C.warn,
            }).xml
          );
          out.push(
            text(X + dx - 40, y + 16, 80, 13, n, {
              align: 'center',
              size: 9,
              bold: true,
              color: t === 'ok' ? C.ok : C.warn,
            }).xml
          );
        }
        return out.join('');
      },
      note: 'buffered: true — these fire before your observer exists',
    },
  ];

  for (const row of rows) {
    o.push(text(24, row.y - 4, 120, 16, row.label, { size: 11, bold: true, color: C.fg }).xml);
    o.push(text(24, row.y + 11, 120, 24, row.sub, { size: 8.5 }).xml);
    o.push(row.draw(row.y));
    o.push(text(X, row.y + 36, TW, 13, row.note, { size: 8.5, italic: true }).xml);
  }

  /* ── now() vs Date.now() ───────────────────────────────────────── */

  o.push(rule(24, 396, W - 48, { dashed: true }).xml);

  const cmp = panel(24, 410, W - 48, 118, 'Why not just Date.now()?', 'bad');
  o.push(cmp.xml);

  const COLS = [
    ['Date.now()', 'bad', 'Unix epoch · whole ms', 'Resyncs with NTP — can jump\nbackwards mid-measurement'],
    ['performance.now()', 'ok', 'timeOrigin · fractional ms', 'Monotonic — only ever moves\nforward, immune to clock drift'],
  ];
  COLS.forEach(([name, t, unit, why], i) => {
    const x = 48 + i * 370;
    o.push(pill(x, 442, 200, 24, name, t, { size: 10, mono: true }).xml);
    o.push(text(x + 210, 442, 150, 24, unit, { size: 9 }).xml);
    o.push(text(x, 470, 340, 30, why.replace('\n', ' '), { size: 9 }).xml);
  });

  o.push(
    text(48, 500, W - 96, 22, 'Both are rounded by the browser — to 5–100µs — so a Spectre-style timing attack cannot read the cache through them.', {
      size: 9,
      italic: true,
      color: C.warn,
    }).xml
  );

  o.push(
    takeaway(
      544,
      'Everything above lands on the same monotonic timeline, so a user-timing mark can be compared directly against TTFB or LCP. Poll `getEntries()` and you race the entries that fired before your code ran — use a `PerformanceObserver` with `buffered: true` instead.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ────────────────────────────────────────────────────────────────────
   6 · Web worker vs service worker — same thread trick, opposite jobs
   ──────────────────────────────────────────────────────────────────── */

function workerTypes() {
  const o = [];
  const H = 606;

  o.push(
    title(
      'Web worker vs service worker — same thread trick, opposite jobs',
      'One moves computation off the main thread; the other sits on the network path'
    )
  );

  o.push(
    text(24, 74, W - 48, 16, 'Two tabs of the same origin, two web workers, one service worker', {
      size: 11,
      bold: true,
      color: C.fg,
      align: 'center',
    }).xml
  );

  /* ── The tabs, each with its own dedicated worker ──────────────── */

  const TABS = [
    { y: 104, name: 'Tab A — page thread', worker: 'Web Worker A' },
    { y: 236, name: 'Tab B — page thread', worker: 'Web Worker B' },
  ];
  for (const t of TABS) {
    o.push(box(24, t.y, 210, 44, t.name, 'accent', { size: 10, bold: true, rx: 8 }).xml);
    o.push(
      arrow(129, t.y + 46, 129, t.y + 64, {
        color: C.line,
        width: 1.3,
        startArrow: 'blockThin',
        label: 'postMessage',
        size: 8,
      }).xml
    );
    o.push(box(24, t.y + 66, 210, 34, t.worker, 'info', { size: 9.5, rx: 8 }).xml);
    // Into the service worker.
    o.push(
      arrow(236, t.y + 22, 322, t.y + 22, { color: C.ok, width: 1.4, label: 'fetch', size: 8.5 })
        .xml
    );
  }

  o.push(
    text(24, 340, 210, 14, '1 : 1 — dies when its tab closes', {
      size: 8.5,
      align: 'center',
      italic: true,
      color: C.info,
    }).xml
  );

  /* ── The one service worker both tabs share ────────────────────── */

  o.push(box(324, 104, 180, 232, 'Service Worker\n\nthe network proxy', 'warn', {
    size: 11,
    bold: true,
    rx: 8,
  }).xml);
  o.push(
    text(324, 340, 180, 14, '1 : many — outlives every tab', {
      size: 8.5,
      align: 'center',
      italic: true,
      color: C.warn,
    }).xml
  );

  o.push(box(584, 104, 212, 44, 'Cache Storage', 'ok', { size: 10, bold: true, rx: 8 }).xml);
  o.push(box(584, 236, 212, 44, 'Network', 'plain', { size: 10, bold: true, rx: 8 }).xml);
  o.push(
    arrow(506, 126, 582, 126, { color: C.ok, width: 1.4, label: 'hit', size: 8.5 }).xml
  );
  o.push(
    arrow(506, 258, 582, 258, { color: C.line, width: 1.4, label: 'miss', size: 8.5 }).xml
  );
  o.push(
    text(584, 152, 212, 28, 'Answered offline, with no network at all.', {
      size: 8.5,
      align: 'center',
    }).xml
  );

  /* ── The distinction ───────────────────────────────────────────── */

  o.push(rule(24, 362, W - 48, { dashed: true }).xml);

  const COLS = [
    {
      x: 24,
      tone: 'info',
      heading: 'Web worker — a compute worker',
      rows: [
        'Purpose: move CPU work off the main thread',
        'Lifetime: tied to the tab that spawned it',
        'Network: cannot intercept a single request',
        'Woken by: postMessage, and nothing else',
      ],
    },
    {
      x: 416,
      tone: 'warn',
      heading: 'Service worker — a network worker',
      rows: [
        'Purpose: cache, offline, background delivery',
        'Lifetime: independent of tabs; wakes on events',
        'Network: intercepts every fetch in its scope',
        'Woken by: install, activate, fetch, push, sync',
      ],
    },
  ];
  for (const col of COLS) {
    o.push(panel(col.x, 376, 380, 148, col.heading, col.tone).xml);
    col.rows.forEach((r, i) => {
      o.push(pill(col.x + 18, 408 + i * 26, 344, 20, r, col.tone, { size: 8.5 }).xml);
    });
  }

  o.push(
    takeaway(
      540,
      'Both run off the main thread with no DOM, and that is where the similarity ends. Reach for a web worker when the main thread is busy; reach for a service worker when the network is the problem.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ────────────────────────────────────────────────────────────────────
   7 · Shipping RUM data — the flush that survives the page going away
   ──────────────────────────────────────────────────────────────────── */

function beaconFlush() {
  const o = [];
  const H = 596;

  o.push(
    title(
      'Shipping RUM data — the flush that survives the page going away',
      'Collect into an array, flush once on `visibilitychange`, hand the request to the browser'
    )
  );

  /* ── 1 · Collect ───────────────────────────────────────────────── */

  o.push(
    text(24, 72, W - 48, 16, '1 · Collect — one array, not one request per entry', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  o.push(box(24, 94, 168, 32, 'PerformanceObserver', 'accent', { size: 9.5, mono: true }).xml);
  o.push(arrow(196, 110, 226, 110, { color: C.line, width: 1.5 }).xml);
  o.push(box(230, 94, 150, 32, 'callback(list)', 'plain', { size: 9.5, mono: true }).xml);
  o.push(arrow(384, 110, 414, 110, { color: C.line, width: 1.5 }).xml);
  o.push(
    box(418, 94, 378, 32, 'metrics[] — LCP · CLS · INP · your own marks', 'info', {
      size: 9.5,
    }).xml
  );

  o.push(
    text(24, 130, W - 48, 14, 'push and return — the callback runs on the main thread you are trying to measure', {
      size: 9,
      italic: true,
    }).xml
  );

  /* ── 2 · Flush ─────────────────────────────────────────────────── */

  o.push(
    text(24, 156, W - 48, 16, '2 · Flush — the lifecycle event that actually fires', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const STATES = [
    ['visible', 'ok', 24, 170],
    ['hidden — tab or app switch', 'warn', 228, 190],
    ['frozen / bfcache', 'info', 442, 156],
    ['terminated', 'sunken', 622, 174],
  ];
  for (const [label, t, x, w] of STATES) {
    o.push(box(x, 178, w, 30, label, t, { size: 9.5 }).xml);
  }
  o.push(arrow(198, 193, 224, 193, { color: C.line, width: 1.5 }).xml);
  o.push(arrow(422, 193, 438, 193, { color: C.line, width: 1.5 }).xml);
  o.push(arrow(602, 193, 618, 193, { color: C.line, width: 1.5 }).xml);

  const TRANSPORTS = [
    [
      '`unload` / `beforeunload`',
      'bad',
      'Unreliable on mobile — a swiped-away tab often never fires it. Registering either handler also disqualifies the page from the back/forward cache.',
    ],
    [
      '`fetch()` in the handler',
      'bad',
      'The document is being torn down, so the browser cancels the in-flight request. `keepalive: true` is the escape hatch, and it shares the same 64KB budget.',
    ],
    [
      '`visibilitychange` → `sendBeacon`',
      'ok',
      'Fires on every hide, including the ones that end in termination. The browser takes ownership of the request and sends it after the page is gone.',
    ],
  ];
  TRANSPORTS.forEach(([name, t, why], i) => {
    const y = 224 + i * 46;
    o.push(pill(24, y, 236, 26, name, t, { size: 9.5 }).xml);
    o.push(text(274, y - 3, 522, 34, why, { size: 9 }).xml);
  });

  /* ── 3 · What the browser does not give back ───────────────────── */

  o.push(rule(24, 376, W - 48, { dashed: true }).xml);

  o.push(panel(24, 388, W - 48, 116, '3 · What `sendBeacon` will not do for you', 'warn').xml);

  const LIMITS = [
    ['returns `true`', '— queued, not delivered'],
    ['no response', '— fire and forget, nothing to read'],
    ['~64KB cap', '— over it, it returns `false` and sends nothing'],
    ['text/plain', '— wrap the JSON in a Blob to set the type; CORS still applies'],
  ];
  LIMITS.forEach(([head, tail], i) => {
    const x = 44 + (i % 2) * 384;
    const y = 420 + Math.floor(i / 2) * 38;
    o.push(pill(x, y, 108, 22, head, 'warn', { size: 9 }).xml);
    o.push(text(x + 116, y, 250, 22, tail, { size: 9 }).xml);
  });

  o.push(
    takeaway(
      522,
      'Buffer in memory, flush once when the page is hidden, and let the browser own the send. A `fetch()` on the way out is cancelled; an `unload` handler costs you the bfcache.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

/* ── IntersectionObserver ─────────────────────────────────────────── */

function intersectionObserver() {
  const o = [];
  const H = 690;

  o.push(
    title(
      'IntersectionObserver — let the browser watch visibility for you',
      'No scroll listener, no forced layout: the callback runs only when a threshold is crossed'
    )
  );

  /* 1 · Legacy vs observer */

  o.push(
    text(24, 70, W - 48, 16, '1 · The work moves off your scroll handler', { size: 11.5, bold: true, color: C.fg }).xml
  );

  o.push(panel(24, 94, 378, 134, 'Legacy — The Nervous Checker', 'bad').xml);
  o.push(
    box(38, 128, 350, 86, '`scroll` fires ~60×/s → your handler runs\n`getBoundingClientRect()` → **forced layout** each time\nall on the **main thread**, even when nothing changed', 'bad', {
      size: 9.5,
      align: 'left',
      padLeft: 10,
    }).xml
  );

  o.push(panel(418, 94, 378, 134, '`IntersectionObserver` — The Lookout', 'ok').xml);
  o.push(
    box(432, 128, 350, 86, 'browser computes intersections **during its own rendering**\nno per-pixel work in your code\ncallback **batched**, only when a threshold is crossed', 'ok', {
      size: 9.5,
      align: 'left',
      padLeft: 10,
    }).xml
  );

  /* 2 · root, rootMargin, targets */

  o.push(rule(24, 242, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 250, W - 48, 16, '2 · `root`, `rootMargin` and what counts as intersecting', { size: 11.5, bold: true, color: C.fg }).xml
  );

  o.push(panel(60, 278, 220, 146, '`root` — the viewport (`null`)', 'accent').xml);
  o.push(box(90, 322, 160, 40, 'target **A**', 'ok', { size: 10 }).xml);

  o.push(box(60, 430, 220, 50, '', 'warn', { dashed: true }).xml);
  o.push(box(90, 440, 160, 30, 'target **B**', 'warn', { size: 10 }).xml);

  o.push(box(90, 500, 160, 30, 'target **C**', 'sunken', { size: 10 }).xml);

  o.push(
    text(300, 322, 496, 40, '**A** — inside the root. `isIntersecting: true`, `intersectionRatio: 1`.', { size: 10, color: C.fg }).xml
  );
  o.push(
    text(300, 430, 496, 50, '**B** — still offscreen, but inside `rootMargin: "0px 0px 50px 0px"`, which grows the root 50px downward. Counts as intersecting → **load it early**.', {
      size: 10,
      color: C.fg,
    }).xml
  );
  o.push(text(300, 500, 496, 30, '**C** — outside root + margin. No callback, zero cost.', { size: 10, color: C.fg }).xml);

  /* 3 · threshold */

  o.push(rule(24, 546, W - 48, { dashed: true }).xml);
  o.push(
    text(24, 554, W - 48, 16, '3 · `threshold: [0, 0.25, 0.5, 0.75, 1]` — one callback per crossing', {
      size: 11.5,
      bold: true,
      color: C.fg,
    }).xml
  );

  const MARKS = [
    ['`0`', 'first pixel visible'],
    ['`0.25`', 'a quarter in'],
    ['`0.5`', 'half — ad viewability'],
    ['`0.75`', 'mostly in'],
    ['`1`', 'fully visible'],
  ];
  MARKS.forEach(([v, why], i) => {
    const x = 24 + i * 158;
    o.push(pill(x, 580, 150, 24, v, i === 2 ? 'warn' : 'accent', { size: 10, mono: true }).xml);
    o.push(text(x, 606, 150, 16, why, { size: 9, align: 'center' }).xml);
    if (i < 4) o.push(arrow(x + 151, 592, x + 157, 592, { color: C.line, width: 1.2 }).xml);
  });

  o.push(
    takeaway(
      634,
      'Describe **when** you care, let the browser tell you. `unobserve` one-shot targets; `disconnect()` on unmount.'
    )
  );

  return { width: W, height: H, cells: o.join('') };
}

export const DIAGRAMS = {
  'intersection-observer': {
    title: 'IntersectionObserver — root, rootMargin, threshold',
    build: intersectionObserver,
  },
  'storage-scope': {
    title: 'Scope — localStorage is origin-locked, a cookie is not',
    build: storageScope,
  },
  'cookie-auth': {
    title: 'Cookie auth — the round trip, the attributes, the two attacks',
    build: cookieAuth,
  },
  'request-life': {
    title: 'The life of a request — DNS, TCP, TLS, TTFB',
    build: requestLife,
  },
  'http-versions': {
    title: 'HTTP/1.1, HTTP/2, HTTP/3 — where head-of-line blocking lives',
    build: httpVersions,
  },
  'performance-api': {
    title: 'The Performance API — one monotonic timeline, four kinds of entry',
    build: performanceApi,
  },
  'worker-types': {
    title: 'Web worker vs service worker — same thread trick, opposite jobs',
    build: workerTypes,
  },
  'beacon-flush': {
    title: 'Shipping RUM data — the flush that survives the page going away',
    build: beaconFlush,
  },
};
