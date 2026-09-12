/**
 * Turns a draw.io SVG export into something worth shipping.
 *
 * The exporter's raw output has two problems:
 *
 * 1. **Size.** Every text label is emitted twice — once as a `<foreignObject>`
 *    and once as a base64 PNG raster fallback for renderers without
 *    `foreignObject` support. That fallback was 94% of the bytes in the old
 *    diagrams (a 13-label diagram shipped 275KB). Every browser this app
 *    supports handles `foreignObject`, so the raster copy is dead weight.
 *
 * 2. **Theme.** The export bakes in the authoring colours. The old diagrams
 *    were light-mode figures that glared on the dark theme. Here every
 *    authoring colour is rewritten to a CSS custom property, so once the SVG
 *    is inlined into the page (see components/InlineSvg.jsx) it follows the
 *    app's own theme like any other element.
 */

/**
 * Authoring hex → CSS custom property.
 *
 * Must stay in sync with `C` in drawio-builder.mjs. The values are chosen to
 * be distinctive so a stray colour that slipped past the builder shows up in
 * the unmapped-colour audit below rather than silently shipping.
 */
const PALETTE = {
  '#5145e5': '--dg-accent',
  '#eef0ff': '--dg-accent-bg',
  '#1b1e5c': '--dg-accent-fg',

  '#16a34a': '--dg-ok',
  '#e9fbf0': '--dg-ok-bg',
  '#0a4a25': '--dg-ok-fg',

  '#dc2626': '--dg-bad',
  '#fdecec': '--dg-bad-bg',
  '#7a1414': '--dg-bad-fg',

  '#d97706': '--dg-warn',
  '#fef6e7': '--dg-warn-bg',
  '#6b3a05': '--dg-warn-fg',

  '#0ea5e9': '--dg-info',
  '#e8f6fe': '--dg-info-bg',
  '#084c68': '--dg-info-fg',

  '#94a0b8': '--dg-line',
  '#ffffff': '--dg-surface',
  '#f4f6fa': '--dg-sunken',
  '#1a1d26': '--dg-fg',
  '#5f667a': '--dg-muted',
};

const FONT_SANS =
  "'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
const FONT_MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function hexToRgbString(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

export function postprocess(svg, { name } = {}) {
  let out = svg;

  // ── 1. Drop the raster fallbacks ──
  // Each is an <image> sibling of a <foreignObject> inside a <switch>.
  out = out.replace(/<image[^>]*xlink:href="data:image\/png;base64,[^"]*"[^>]*\/>/g, '');
  // A <switch> with a single child no longer switches between anything.
  out = out.replace(/<switch>\s*(<foreignObject[\s\S]*?<\/foreignObject>)\s*<\/switch>/g, '$1');
  // `requiredFeatures` only mattered for picking between the two branches.
  out = out.replace(/\s*requiredFeatures="[^"]*"/g, '');

  // ── 2. Colours → custom properties ──
  // The exporter writes each colour in three places: a presentation
  // attribute, an inline `style` as rgb(), and (for text) a `color:` on the
  // label div. All three have to be rewritten or the attribute wins in one
  // renderer and the style in another.
  for (const [hex, cssVar] of Object.entries(PALETTE)) {
    const ref = `var(${cssVar})`;
    const rgb = hexToRgbString(hex);
    const hexRe = new RegExp(hex, 'gi');
    const rgbRe = new RegExp(rgb.replace(/[()]/g, '\\$&'), 'gi');

    out = out.replace(new RegExp(`(fill|stroke|color)="${hex}"`, 'gi'), `$1="${ref}"`);
    out = out.replace(new RegExp(`(fill|stroke|color):\\s*${hex}`, 'gi'), `$1: ${ref}`);
    out = out.replace(new RegExp(`(fill|stroke|color):\\s*${rgb.replace(/[()]/g, '\\$&')}`, 'gi'),
      `$1: ${ref}`);
    // Anything left (gradients, label backgrounds) gets the plain swap.
    out = out.replace(hexRe, ref);
    out = out.replace(rgbRe, ref);
  }

  // ── 3. Fonts ──
  out = out.replace(/font-family:\s*Helvetica/g, `font-family: ${FONT_SANS}`);
  out = out.replace(/font-family:\s*&quot;?Courier New&quot;?/g, `font-family: ${FONT_MONO}`);
  out = out.replace(/font-family:\s*"Courier New"/g, `font-family: ${FONT_MONO}`);
  out = out.replace(/font-family:\s*Courier New/g, `font-family: ${FONT_MONO}`);

  // ── 4. Root element ──
  // The export pins `color-scheme` and paints its own background; both fight
  // the page. Width/height are dropped in favour of the viewBox so the image
  // scales to its container instead of forcing a fixed pixel size.
  out = out.replace(
    /<svg([^>]*?)style="[^"]*"([^>]*)>/,
    '<svg$1$2 role="img" class="dg-svg" preserveAspectRatio="xMidYMid meet">'
  );
  out = out.replace(/(<svg[^>]*?)\swidth="\d+px"\sheight="\d+px"/, '$1');

  // ── 5. Accessibility ──
  if (name) {
    out = out.replace(/(<svg[^>]*>)/, `$1<title>${name}</title>`);
  }

  // Strip the XML prolog and DOCTYPE — this markup gets inlined into an HTML
  // document, where both are invalid.
  out = out.replace(/<\?xml[^>]*\?>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/, '');

  return out.trim();
}

/**
 * Any colour literal left after the rewrite is a colour the builder produced
 * that isn't in the palette — it would ship as a fixed value and break in one
 * theme or the other. Surfaced as a build warning rather than silently.
 */
export function findUnmappedColors(svg) {
  const found = new Set();
  for (const m of svg.matchAll(/#[0-9a-f]{6}\b/gi)) found.add(m[0].toLowerCase());
  for (const m of svg.matchAll(/rgb\(\s*\d+,\s*\d+,\s*\d+\s*\)/gi)) found.add(m[0]);
  return [...found];
}
