/**
 * A tiny mxGraph (draw.io) XML builder.
 *
 * The Blind 75 diagrams used to be written as Mermaid and handed to the
 * draw.io CLI's importer. The importer's auto-layout produced overlapping
 * nodes, leaked raw Mermaid syntax into labels (`I_Loop --> I_Cond[`), and
 * emitted canvases ~1600px wide that scaled down to 5px text in the reading
 * column. Positioning every node explicitly is the fix: these helpers make
 * hand-authored layout cheap enough to be worth doing.
 *
 * Output is real `.drawio` XML, so any diagram here still opens and edits in
 * draw.io — the file is the source, this file is just a comfortable way to
 * write it.
 */

/* ── Palette ──────────────────────────────────────────────────────────
   Authoring colours only. Every one of these is rewritten to a CSS
   custom property by the SVG post-processor, so the exported diagram
   follows the app's own light/dark theme rather than baking in a light
   background. Keep these values unique and in sync with PALETTE in
   scripts/lib/svg-postprocess.mjs. ── */

export const C = {
  accent: '#5145E5',
  accentBg: '#EEF0FF',
  accentFg: '#1B1E5C',

  ok: '#16A34A',
  okBg: '#E9FBF0',
  okFg: '#0A4A25',

  bad: '#DC2626',
  badBg: '#FDECEC',
  badFg: '#7A1414',

  warn: '#D97706',
  warnBg: '#FEF6E7',
  warnFg: '#6B3A05',

  info: '#0EA5E9',
  infoBg: '#E8F6FE',
  infoFg: '#084C68',

  line: '#94A0B8',
  surface: '#FFFFFF',
  sunken: '#F4F6FA',
  fg: '#1A1D26',
  muted: '#5F667A',
};

/** Tone name → { stroke, fill, text } used by most helpers. */
const TONES = {
  accent: { stroke: C.accent, fill: C.accentBg, text: C.accentFg },
  ok: { stroke: C.ok, fill: C.okBg, text: C.okFg },
  bad: { stroke: C.bad, fill: C.badBg, text: C.badFg },
  warn: { stroke: C.warn, fill: C.warnBg, text: C.warnFg },
  info: { stroke: C.info, fill: C.infoBg, text: C.infoFg },
  plain: { stroke: C.line, fill: C.surface, text: C.fg },
  sunken: { stroke: C.line, fill: C.sunken, text: C.fg },
  ghost: { stroke: 'none', fill: 'none', text: C.muted },
};

export function tone(name) {
  const t = TONES[name];
  if (!t) throw new Error(`Unknown tone: ${name}`);
  return t;
}

const SANS = 'Helvetica';
const MONO = 'Courier New';

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * draw.io labels are HTML held inside an XML attribute, so they are escaped
 * twice: once so the author's text is safe as HTML, and again so the
 * resulting markup is safe as an attribute value. Emitting a raw `<br/>`
 * into `value="..."` makes the file malformed XML, and draw.io's parser
 * gives up at that cell — which silently drops every shape after it.
 *
 * Supports `\n` for a line break, `**bold**`, `*italic*`, and `` `code` ``
 * because hand-writing `&lt;b&gt;` in every label is unreadable.
 */
function label(text) {
  if (text == null || text === '') return '';
  let html = esc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>');
  html = html.replace(/`([^`]+)`/g, `<span style="font-family: ${MONO}">$1</span>`);
  html = html.replace(/\n/g, '<br/>');
  // Second pass: the HTML above is now the attribute's text content.
  return html
    .replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleString(pairs) {
  return Object.entries(pairs)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(';');
}

let uid = 0;
function nextId(prefix) {
  uid += 1;
  return `${prefix}-${uid}`;
}

/** Resets the id counter so each diagram's ids start from the same place. */
export function resetIds() {
  uid = 0;
}

/* ── Cell helpers ─────────────────────────────────────────────────── */

/**
 * A rounded box with a label. The workhorse.
 *
 * `t` is a tone name; `opts.mono`, `opts.bold`, `opts.size`, `opts.align`,
 * `opts.dashed` and `opts.rx` cover the variations actually used.
 */
export function box(x, y, w, h, text, t = 'plain', opts = {}) {
  const { stroke, fill, text: fg } = tone(t);
  const id = opts.id || nextId('b');
  const style = styleString({
    rounded: opts.rx === 0 ? 0 : 1,
    arcSize: opts.rx === 0 ? undefined : (opts.rx ?? 12),
    whiteSpace: 'wrap',
    html: 1,
    fillColor: opts.fill ?? fill,
    strokeColor: opts.stroke ?? stroke,
    strokeWidth: opts.strokeWidth ?? 1.5,
    dashed: opts.dashed ? 1 : undefined,
    dashPattern: opts.dashed ? '6 4' : undefined,
    fontColor: opts.color ?? fg,
    fontSize: opts.size ?? 13,
    fontFamily: opts.mono ? MONO : SANS,
    fontStyle: opts.bold ? 1 : undefined,
    align: opts.align ?? 'center',
    verticalAlign: opts.valign ?? 'middle',
    spacingLeft: opts.padLeft,
    spacingRight: opts.padRight,
    spacingTop: opts.padTop,
    spacing: opts.pad,
    shadow: 0,
  });
  return {
    id,
    xml:
      `<mxCell id="${id}" value="${label(text)}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`,
  };
}

/** Free-standing text with no box — headings, captions, annotations. */
export function text(x, y, w, h, content, opts = {}) {
  const id = opts.id || nextId('t');
  const style = styleString({
    text: undefined,
    html: 1,
    whiteSpace: 'wrap',
    strokeColor: 'none',
    fillColor: 'none',
    align: opts.align ?? 'left',
    verticalAlign: opts.valign ?? 'middle',
    fontColor: opts.color ?? C.muted,
    fontSize: opts.size ?? 12,
    fontFamily: opts.mono ? MONO : SANS,
    fontStyle: (opts.bold ? 1 : 0) + (opts.italic ? 2 : 0) || undefined,
  });
  return {
    id,
    xml:
      `<mxCell id="${id}" value="${label(content)}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`,
  };
}

/**
 * A titled panel: the container that groups one idea.
 *
 * Returns the frame cell plus a `body` rect so callers can lay out inside
 * it without recomputing the title strip's height every time.
 */
export function panel(x, y, w, h, title, t = 'accent', opts = {}) {
  const { stroke } = tone(t);
  const cells = [];
  const id = opts.id || nextId('p');
  const style = styleString({
    rounded: 1,
    arcSize: 4,
    whiteSpace: 'wrap',
    html: 1,
    fillColor: 'none',
    strokeColor: stroke,
    strokeWidth: 1.5,
    dashed: opts.dashed ? 1 : undefined,
    dashPattern: opts.dashed ? '8 5' : undefined,
    verticalAlign: 'top',
    align: 'left',
    fontColor: tone(t).text,
    fontSize: 13,
    fontFamily: SANS,
    fontStyle: 1,
    spacingLeft: 12,
    spacingTop: 6,
    opacity: opts.opacity,
  });
  cells.push(
    `<mxCell id="${id}" value="${label(title)}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`
  );
  return {
    id,
    xml: cells.join(''),
    body: { x: x + 14, y: y + 34, w: w - 28, h: h - 48 },
  };
}

/**
 * An edge between two cells.
 *
 * `opts.from`/`opts.to` are exit/entry anchors as [x, y] in 0..1 — draw.io
 * routes far better when told which side to leave from, and the default
 * router loves to loop an arrow around a box otherwise.
 */
export function edge(sourceId, targetId, opts = {}) {
  const id = opts.id || nextId('e');
  const [ex, ey] = opts.from ?? [];
  const [tx, ty] = opts.to ?? [];
  const style = styleString({
    edgeStyle: opts.style ?? 'orthogonalEdgeStyle',
    rounded: 1,
    arcSize: 8,
    html: 1,
    jettySize: 'auto',
    orthogonalLoop: 1,
    strokeColor: opts.color ?? C.line,
    strokeWidth: opts.width ?? 1.5,
    dashed: opts.dashed ? 1 : undefined,
    dashPattern: opts.dashed ? '6 4' : undefined,
    startArrow: opts.startArrow ?? 'none',
    startFill: opts.startArrow && opts.startArrow !== 'none' ? 1 : 0,
    endArrow: opts.endArrow ?? 'blockThin',
    endFill: opts.endArrow === 'none' ? 0 : 1,
    exitX: ex,
    exitY: ey,
    exitDx: ex !== undefined ? 0 : undefined,
    exitDy: ey !== undefined ? 0 : undefined,
    entryX: tx,
    entryY: ty,
    entryDx: tx !== undefined ? 0 : undefined,
    entryDy: ty !== undefined ? 0 : undefined,
    fontSize: opts.size ?? 11,
    fontColor: opts.labelColor ?? C.muted,
    fontFamily: SANS,
    labelBackgroundColor: opts.labelBg ?? C.surface,
    verticalAlign: 'middle',
    curved: opts.curved ? 1 : undefined,
  });
  const geo = opts.points
    ? `<mxGeometry relative="1" as="geometry"><Array as="points">${opts.points
        .map(([px, py]) => `<mxPoint x="${px}" y="${py}"/>`)
        .join('')}</Array></mxGeometry>`
    : '<mxGeometry relative="1" as="geometry"/>';
  return {
    id,
    xml:
      `<mxCell id="${id}" value="${label(opts.label ?? '')}" style="${style}" edge="1" parent="1" ` +
      `source="${sourceId}" target="${targetId}">${geo}</mxCell>`,
  };
}

/** A straight connector between two raw points, for pointer arrows. */
export function arrow(x1, y1, x2, y2, opts = {}) {
  const id = opts.id || nextId('a');
  const style = styleString({
    edgeStyle: opts.style ?? 'none',
    rounded: 0,
    html: 1,
    strokeColor: opts.color ?? C.line,
    strokeWidth: opts.width ?? 1.5,
    dashed: opts.dashed ? 1 : undefined,
    dashPattern: opts.dashed ? '5 4' : undefined,
    startArrow: opts.startArrow ?? 'none',
    startFill: opts.startArrow && opts.startArrow !== 'none' ? 1 : 0,
    endArrow: opts.endArrow ?? 'blockThin',
    endFill: opts.endArrow === 'none' ? 0 : 1,
    fontSize: opts.size ?? 11,
    fontColor: opts.labelColor ?? C.muted,
    fontFamily: SANS,
    labelBackgroundColor: opts.labelBg ?? C.surface,
    curved: opts.curved ? 1 : undefined,
  });
  return {
    id,
    xml:
      `<mxCell id="${id}" value="${label(opts.label ?? '')}" style="${style}" edge="1" parent="1">` +
      `<mxGeometry relative="1" as="geometry">` +
      `<mxPoint x="${x1}" y="${y1}" as="sourcePoint"/>` +
      `<mxPoint x="${x2}" y="${y2}" as="targetPoint"/>` +
      (opts.points
        ? `<Array as="points">${opts.points.map(([px, py]) => `<mxPoint x="${px}" y="${py}"/>`).join('')}</Array>`
        : '') +
      `</mxGeometry></mxCell>`,
  };
}

/**
 * A row of equal cells — an array, a string, a bit pattern.
 *
 * Drawing the actual data is the whole point of these diagrams: "walk the
 * array once" is abstract, `[2, 7, 11, 15]` with a pointer under index 1 is
 * not. Returns the cell ids so arrows can target individual slots.
 */
export function cells(x, y, values, opts = {}) {
  const cw = opts.cw ?? 46;
  const ch = opts.ch ?? 40;
  const gap = opts.gap ?? 4;
  const out = [];
  const ids = [];

  values.forEach((value, i) => {
    const v = typeof value === 'object' ? value : { text: value };
    const t = v.tone ?? opts.tone ?? 'sunken';
    const cell = box(x + i * (cw + gap), y, cw, ch, v.text, t, {
      mono: true,
      size: opts.size ?? 13,
      bold: v.bold ?? opts.bold,
      rx: 8,
      color: v.color,
      fill: v.fill,
      stroke: v.stroke,
    });
    out.push(cell.xml);
    ids.push(cell.id);
  });

  if (opts.indices) {
    values.forEach((_, i) => {
      out.push(
        text(x + i * (cw + gap), y + ch + 1, cw, 14, String(i), {
          align: 'center',
          size: 10,
          color: C.muted,
          mono: true,
        }).xml
      );
    });
  }

  return {
    xml: out.join(''),
    ids,
    width: values.length * cw + (values.length - 1) * gap,
    height: ch + (opts.indices ? 15 : 0),
    /** Centre x of slot `i`, for placing a pointer arrow under it. */
    centerX: (i) => x + i * (cw + gap) + cw / 2,
    left: (i) => x + i * (cw + gap),
    cw,
    ch,
  };
}

/** A small pill — a legend swatch, a complexity tag, a step number. */
export function pill(x, y, w, h, content, t = 'accent', opts = {}) {
  const { stroke, text: fg } = tone(t);
  const id = opts.id || nextId('pl');
  const style = styleString({
    rounded: 1,
    arcSize: 50,
    whiteSpace: 'wrap',
    html: 1,
    fillColor: opts.fill ?? tone(t).fill,
    strokeColor: opts.stroke ?? (opts.borderless ? 'none' : stroke),
    strokeWidth: 1.5,
    fontColor: opts.color ?? fg,
    fontSize: opts.size ?? 11,
    fontFamily: opts.mono ? MONO : SANS,
    fontStyle: opts.bold === false ? undefined : 1,
  });
  return {
    id,
    xml:
      `<mxCell id="${id}" value="${label(content)}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`,
  };
}

/** A circle — tree nodes, list nodes, graph vertices. */
export function circle(x, y, d, content, t = 'plain', opts = {}) {
  const { stroke, fill, text: fg } = tone(t);
  const id = opts.id || nextId('c');
  const style = styleString({
    ellipse: undefined,
    whiteSpace: 'wrap',
    html: 1,
    fillColor: opts.fill ?? fill,
    strokeColor: opts.stroke ?? stroke,
    strokeWidth: opts.strokeWidth ?? 1.5,
    dashed: opts.dashed ? 1 : undefined,
    dashPattern: opts.dashed ? '5 4' : undefined,
    fontColor: opts.color ?? fg,
    fontSize: opts.size ?? 13,
    fontFamily: opts.mono === false ? SANS : MONO,
    fontStyle: opts.bold === false ? undefined : 1,
  });
  return {
    id,
    xml:
      `<mxCell id="${id}" value="${label(content)}" style="ellipse;${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${d}" height="${d}" as="geometry"/></mxCell>`,
  };
}

/** A horizontal rule, for separating stacked panels. */
export function rule(x, y, w, opts = {}) {
  return arrow(x, y, x + w, y, {
    endArrow: 'none',
    color: opts.color ?? C.line,
    width: 1,
    dashed: opts.dashed,
  });
}

/* ── Document ─────────────────────────────────────────────────────── */

export function document({ name, width, height, cells: cellXml }) {
  return (
    `<mxfile host="app.diagrams.net" type="device">` +
    `<diagram name="${esc(name)}" id="${esc(name)}">` +
    `<mxGraphModel dx="${width}" dy="${height}" grid="0" gridSize="10" guides="1" tooltips="1" ` +
    `connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="${width}" pageHeight="${height}" ` +
    `math="0" shadow="0" background="none">` +
    `<root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
    cellXml +
    `</root></mxGraphModel></diagram></mxfile>`
  );
}
