/**
 * Renders the small slice of TeX the content actually uses.
 *
 * The learnings are written with `$…$` math — almost all of it complexity
 * notation: `$O(N \log N)$`, `$O(N^2)$`, `$O(V + E)$`, `$k^{\text{th}}$`.
 * Until now nothing parsed it, so readers saw the raw `$O(N^2)$` including
 * the dollar signs.
 *
 * KaTeX would render it properly but costs ~300KB of fonts to set `O(N)` in
 * italics, so this converts the handful of commands in use to HTML instead:
 * superscripts, a few operators, and upright text. Anything it does not
 * recognise falls through as-is, which for this content means a bare
 * identifier — still correct, just unstyled.
 *
 * Note on why this cannot be a regex over the source JSON: roughly seventy of
 * the `$…$` matches in the data are JavaScript template literals inside code
 * fences (`` `${this.name} from ${x}` ``). remark-math only parses math in
 * text nodes, so code is left alone — which is the whole reason for going
 * through the parser rather than rewriting content.
 */

/** `\command` → what to print. */
const COMMANDS = {
  log: 'log',
  ln: 'ln',
  min: 'min',
  max: 'max',
  sum: '∑',
  cdot: '·',
  times: '×',
  div: '÷',
  le: '≤',
  ge: '≥',
  ne: '≠',
  approx: '≈',
  to: '→',
  rightarrow: '→',
  leftarrow: '←',
  dots: '…',
  ldots: '…',
  infty: '∞',
  alpha: 'α',
  beta: 'β',
  theta: 'θ',
  lambda: 'λ',
};

/** Digits and a few letters have real superscript glyphs; the rest use <sup>. */
const SUPERSCRIPT = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴',
  5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
  n: 'ⁿ', i: 'ⁱ', '+': '⁺', '-': '⁻',
};

function asUnicodeSuper(body) {
  const chars = [...body];
  if (!chars.every((ch) => SUPERSCRIPT[ch])) return null;
  return chars.map((ch) => SUPERSCRIPT[ch]).join('');
}

/**
 * Reads the group that follows `^` or `_` — either `{…}` (balanced) or the
 * single next character.
 */
function readGroup(src, start) {
  if (src[start] !== '{') return { body: src.slice(start, start + 1), next: start + 1 };
  let depth = 1;
  let i = start + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') depth -= 1;
    i += 1;
  }
  return { body: src.slice(start + 1, i - 1), next: i };
}

/** Parses `tex` into an array of strings and React elements. */
function parse(tex, keyPrefix = 'm') {
  const out = [];
  let buf = '';
  let i = 0;
  let key = 0;

  const flush = () => {
    if (buf) out.push(buf);
    buf = '';
  };

  while (i < tex.length) {
    const ch = tex[i];

    if (ch === '\\') {
      const match = /^\\([a-zA-Z]+)/.exec(tex.slice(i));
      if (match) {
        const name = match[1];
        if (name === 'text' || name === 'mathrm' || name === 'operatorname') {
          const { body, next } = readGroup(tex, i + match[0].length);
          flush();
          out.push(
            <span className="tex-text" key={`${keyPrefix}-${(key += 1)}`}>
              {body}
            </span>
          );
          i = next;
          continue;
        }
        buf += COMMANDS[name] ?? name;
        i += match[0].length;
        // `\log N` has a space that belongs in the output.
        if (tex[i] === ' ') {
          buf += ' ';
          i += 1;
        }
        continue;
      }
      // An escaped literal such as `\{`.
      buf += tex[i + 1] ?? '';
      i += 2;
      continue;
    }

    if (ch === '^' || ch === '_') {
      const { body, next } = readGroup(tex, i + 1);
      const inner = parse(body, `${keyPrefix}-${(key += 1)}`);
      const plain = inner.every((part) => typeof part === 'string') ? inner.join('') : null;
      const uni = ch === '^' && plain !== null ? asUnicodeSuper(plain) : null;

      if (uni) {
        buf += uni;
      } else {
        flush();
        const Tag = ch === '^' ? 'sup' : 'sub';
        out.push(<Tag key={`${keyPrefix}-s${(key += 1)}`}>{inner}</Tag>);
      }
      i = next;
      continue;
    }

    buf += ch;
    i += 1;
  }

  flush();
  return out;
}

export default function TexNotation({ tex, display = false }) {
  const Tag = display ? 'div' : 'span';
  return (
    <Tag className={display ? 'tex tex-display' : 'tex'}>{parse(String(tex ?? ''))}</Tag>
  );
}
