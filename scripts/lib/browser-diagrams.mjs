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

import { C, box, text, arrow, panel, rule } from './drawio-builder.mjs';
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

export const DIAGRAMS = {
  'storage-scope': {
    title: 'Scope — localStorage is origin-locked, a cookie is not',
    build: storageScope,
  },
  'cookie-auth': {
    title: 'Cookie auth — the round trip, the attributes, the two attacks',
    build: cookieAuth,
  },
};
