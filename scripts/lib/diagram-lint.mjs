/**
 * Geometry checks for a generated `.drawio` file.
 *
 * Coordinates in these diagrams are written by hand, so the two ways they
 * go wrong are both silent: a cell placed past the edge of the canvas is
 * simply cropped out of the SVG, and a label longer than its box is clipped
 * mid-sentence. Neither shows up in the export — the build says `✓` and the
 * diagram ships with a missing box or a truncated takeaway.
 *
 * Both were found by rendering a PNG and looking at it, which does not
 * scale to a set of thirty. This does the looking.
 *
 * Text measurement is an estimate, not a layout engine, so a clipped label
 * is reported as a warning and only geometry that leaves the canvas fails
 * the build.
 */

/** Per-character width as a fraction of font size, near enough for both faces. */
const CHAR_W = { Helvetica: 0.53, 'Courier New': 0.6 };
const LINE_H = 1.3;

function attr(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

function styleValue(style, key) {
  const m = new RegExp(`(?:^|;)${key}=([^;]*)`).exec(style ?? '');
  return m ? m[1] : null;
}

/**
 * Undoes the double escaping `label()` applies, then strips the markup it
 * generated, leaving the text a reader actually sees.
 */
function plainText(value) {
  if (!value) return '';
  // The author's own angle brackets arrive as `&amp;lt;`, the markup this
  // module generated as `&lt;`. Park the author's out of the way first, or
  // stripping the tags eats `<App>` along with them.
  return value
    .replace(/&amp;lt;/g, '\u0001')
    .replace(/&amp;gt;/g, '\u0002')
    .replace(/&lt;br\s*\/?&gt;/g, '\n')
    .replace(/&lt;[\s\S]*?&gt;/g, '')
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\u0001/g, '<')
    .replace(/\u0002/g, '>');
}

/** Estimated rendered height of `text` wrapped into `width`. */
function textHeight(text, width, fontSize, fontFamily) {
  const charW = (CHAR_W[fontFamily] ?? CHAR_W.Helvetica) * fontSize;
  const perLine = Math.max(1, Math.floor(width / charW));
  let lines = 0;
  for (const segment of text.split('\n')) {
    lines += Math.max(1, Math.ceil(segment.length / perLine));
  }
  return lines * fontSize * LINE_H;
}

/**
 * Returns `{ offCanvas, clipped, overlapping }`. `offCanvas` is fatal; the
 * other two are heuristic warnings.
 */
export function lintDiagram(xml, { width, height, slack = 6 } = {}) {
  const offCanvas = [];
  const clipped = [];
  const boxes = [];

  const cellRe = /<mxCell ([^>]*?)>\s*<mxGeometry ([^/>]*)\/>/g;
  let match;

  while ((match = cellRe.exec(xml)) !== null) {
    const [, head, geo] = match;
    if (attr(head, 'edge') === '1') continue;

    const x = Number(attr(geo, 'x'));
    const y = Number(attr(geo, 'y'));
    const w = Number(attr(geo, 'width'));
    const h = Number(attr(geo, 'height'));
    if (![x, y, w, h].every(Number.isFinite)) continue;

    const id = attr(head, 'id');
    const value = attr(head, 'value') ?? '';
    const label = plainText(value).replace(/\s+/g, ' ').trim().slice(0, 44);

    if (x < -slack || y < -slack || x + w > width + slack || y + h > height + slack) {
      offCanvas.push({ id, label, box: `${x},${y} ${w}×${h}` });
      continue;
    }

    const style = attr(head, 'style') ?? '';
    const fontSize = Number(styleValue(style, 'fontSize') ?? 13);
    const fontFamily = styleValue(style, 'fontFamily') ?? 'Helvetica';

    // Only a shape with a border or a fill can look clipped. A
    // free-standing `text()` cell has neither: draw.io centres the label
    // and lets it spill, which is exactly what captions and axis numbers
    // are meant to do, so measuring them produces nothing but noise.
    const fill = styleValue(style, 'fillColor');
    const stroke = styleValue(style, 'strokeColor');
    const framed = (fill && fill !== 'none') || (stroke && stroke !== 'none');
    if (!framed) continue;

    // Only framed cells take part in the overlap check. A caption sitting
    // over a box is how half these diagrams annotate themselves — it has
    // no background, so nothing is hidden.
    boxes.push({ id, label, x, y, w, h });

    const text = plainText(value);
    if (!text.trim()) continue;

    // A panel is a title strip around empty space, not a filled box.
    if (fill === 'none' && h > 90) continue;

    const padL = Number(styleValue(style, 'spacingLeft') ?? 0);
    const padR = Number(styleValue(style, 'spacingRight') ?? 0);
    const padT = Number(styleValue(style, 'spacingTop') ?? 0);
    const inner = w - padL - padR - 8;
    if (inner <= 0) continue;

    // The estimate is good to roughly a line, so a cell is only reported
    // once it is over by more than that — the goal is to catch the label
    // that lost its last sentence, not to police a tight fit.
    const needed = textHeight(text, inner, fontSize, fontFamily) + padT + 4;
    const allowed = h + Math.max(10, h * 0.18);
    if (needed > allowed) {
      clipped.push({ id, label, needed: Math.ceil(needed), have: h });
    }
  }

  return { offCanvas, clipped, overlapping: findOverlaps(boxes) };
}

/**
 * Cells that intersect without one containing the other.
 *
 * Containment is the normal case — every box sits inside a panel — so only
 * a partial overlap is reported. That is the shape a grown box makes when
 * it runs into whatever was laid out below it.
 *
 * `slack` is generous because a few pixels of touching is a rounding
 * artefact of hand-placed coordinates, not a collision anyone can see.
 */
function findOverlaps(boxes, slack = 12) {
  const out = [];

  const contains = (a, b) =>
    a.x <= b.x + 2 &&
    a.y <= b.y + 2 &&
    a.x + a.w >= b.x + b.w - 2 &&
    a.y + a.h >= b.y + b.h - 2;

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapW = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlapW <= slack || overlapH <= slack) continue;
      if (contains(a, b) || contains(b, a)) continue;
      out.push({ a: a.label || a.id, b: b.label || b.id, by: `${Math.round(overlapW)}×${Math.round(overlapH)}` });
    }
  }

  return out;
}
