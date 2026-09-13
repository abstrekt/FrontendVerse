/**
 * The furniture every diagram in the app shares: the heading pair, the
 * takeaway strip at the foot, the colour legend, and the pointer caret.
 *
 * Extracted from `blind75-diagrams.mjs` when the system-design set arrived and
 * wanted the same layout language. Both sets draw on one 820px canvas so a
 * diagram lands close to its authored text size in the article column — at the
 * ~1600px the first diagrams used, labels scaled down to about 5px.
 */

import { C, box, text, arrow } from './drawio-builder.mjs';

/** One canvas width for every diagram, sized to the reading column. */
export const W = 820;

const TONE_STROKE = { accent: C.accent, ok: C.ok, bad: C.bad, warn: C.warn, info: C.info };

export function title(main, sub) {
  const out = [
    text(0, 14, W, 24, main, { align: 'center', size: 15, bold: true, color: C.fg }).xml,
  ];
  if (sub) {
    out.push(text(0, 39, W, 18, sub, { align: 'center', size: 12, color: C.muted }).xml);
  }
  return out.join('');
}

/** The one-line lesson at the foot of every diagram. */
export function takeaway(y, content) {
  return box(24, y, W - 48, 46, content, 'warn', {
    align: 'left',
    padLeft: 14,
    size: 12,
  }).xml;
}

export function legend(x, y, entries) {
  const out = [];
  let cx = x;
  for (const [t, labelText] of entries) {
    out.push(
      box(cx, y, 11, 11, '', t, { fill: TONE_STROKE[t], stroke: TONE_STROKE[t], rx: 30 }).xml
    );
    const w = labelText.length * 6.1 + 8;
    out.push(text(cx + 17, y - 4, w, 18, labelText, { size: 11, color: C.muted }).xml);
    cx += 17 + w + 13;
  }
  return out.join('');
}

/** A pointer caret under an array slot. */
export function pointer(x, yTop, labelText, t = 'accent', opts = {}) {
  const colour = TONE_STROKE[t];
  const out = [
    arrow(x, yTop + 22, x, yTop + 4, { color: colour, width: 2, endArrow: 'blockThin' }).xml,
  ];
  out.push(
    text(x - 40, yTop + 22, 80, 16, labelText, {
      align: 'center',
      size: 11,
      bold: true,
      color: colour,
      mono: opts.mono,
    }).xml
  );
  return out.join('');
}
