import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * One Light / One Dark, with every token colour lifted to WCAG AA.
 *
 * Both palettes are tuned for a pure editor chrome and fall short on the
 * app's code surface: in One Light five of seven token colours land below
 * 4.5:1, comments worst at 2.41:1 — which is exactly the text a teaching
 * snippet most needs read. One Dark puts comments at 3.17:1.
 *
 * This has to happen here rather than in CSS. `react-syntax-highlighter`
 * emits `<span class="token" style="color: …">` — one bare class for every
 * kind of token, with the palette baked into inline styles. There is nothing
 * for a stylesheet to target, and no amount of `!important` helps when the
 * selector cannot match in the first place.
 *
 * Adjustment happens in HSL, on the lightness channel only, because that is
 * how these palettes are authored (`hsl(230, 4%, 64%)`). Hue and saturation
 * survive untouched, so the result still reads as One Light rather than as a
 * different theme that happens to pass a checker.
 */

const TARGET_RATIO = 4.5;
/** The surface snippets actually sit on, per theme (--code-bg). */
const SURFACE = { light: [247, 247, 248], dark: [34, 35, 42] };

/** Accepts the `hsl()`/`hsla()` these palettes use, and hex for safety. */
function parseColor(value) {
  const str = String(value).trim();

  const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(str);
  if (hsl) {
    return { h: +hsl[1], s: +hsl[2], l: +hsl[3], a: hsl[4] === undefined ? 1 : +hsl[4] };
  }

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str);
  if (hex) {
    const full =
      hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    const n = parseInt(full, 16);
    return { ...rgbToHsl([(n >> 16) & 255, (n >> 8) & 255, n & 255]), a: 1 };
  }

  return null;
}

function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  const m = ln - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

function channel(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function format({ h, s, l, a }) {
  const hh = Math.round(h);
  const ss = Math.round(s);
  const ll = Math.round(l * 10) / 10;
  return a < 1 ? `hsla(${hh}, ${ss}%, ${ll}%, ${a})` : `hsl(${hh}, ${ss}%, ${ll}%)`;
}

/**
 * Walks lightness toward the far end of the scale until the colour clears
 * `TARGET_RATIO`. Returns the input untouched when it already passes or is
 * not a colour this understands (`inherit`, gradients).
 *
 * Translucent colours are measured composited over the surface — an alpha
 * token that looks fine at full strength is not fine at 0.2.
 */
function accessible(value, surface, lighten) {
  const parsed = parseColor(value);
  if (!parsed) return value;

  const measure = ({ h, s, l, a }) => {
    const rgb = hslToRgb({ h, s, l });
    const composited = a < 1 ? rgb.map((c, i) => c * a + surface[i] * (1 - a)) : rgb;
    return contrast(composited, surface);
  };

  if (measure(parsed) >= TARGET_RATIO) return value;

  const step = lighten ? 2 : -2;
  let { l } = parsed;
  for (let i = 0; i < 50; i += 1) {
    l = Math.max(0, Math.min(100, l + step));
    const next = { ...parsed, l };
    if (measure(next) >= TARGET_RATIO) return format(next);
    if (l === 0 || l === 100) break;
  }
  return format({ ...parsed, l: lighten ? 100 : 0 });
}

function harden(base, themeName) {
  const surface = SURFACE[themeName];
  const lighten = themeName === 'dark';
  const out = {};

  for (const [selector, rules] of Object.entries(base)) {
    out[selector] =
      rules && typeof rules === 'object' && typeof rules.color === 'string'
        ? { ...rules, color: accessible(rules.color, surface, lighten) }
        : rules;
  }
  return out;
}

// Hardened once at module load: the objects are large and the result is
// constant, so doing it per render would be pure waste.
const LIGHT = harden(oneLight, 'light');
const DARK = harden(oneDark, 'dark');

export function getSyntaxStyle(theme) {
  return theme === 'dark' ? DARK : LIGHT;
}
