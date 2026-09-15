/**
 * Persisted text highlights, and the anchor maths that make them survive a
 * re-render.
 *
 * The content is markdown rendered to React elements, so there is no stable
 * DOM node to attach a highlight to and no id in the source to point at. What
 * *is* stable is the prose itself, so a highlight is stored as "the Nth
 * occurrence of this exact string in this entry" and re-found on every render.
 *
 * That choice has one deliberate consequence: editing an entry's prose can
 * orphan a highlight. Losing a highlight is the acceptable failure here —
 * silently marking the *wrong* words is not — so `markRanges.js` verifies the
 * text still matches at the computed offset before it wraps anything.
 *
 * `code`, `pre` and the math/diagram subtrees are excluded from "prose" on
 * both sides. They render through SyntaxHighlighter, Mermaid and VisualTrace,
 * which own their own DOM, and a <mark> spliced into them would either be
 * destroyed on the next render or break the highlighter's token spans.
 */

/** Tags whose text is not prose and never carries a highlight. */
export const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'svg', 'math']);

/** Class names on wrappers that render their own subtree. */
const SKIP_CLASSES = ['visual-trace', 'mermaid', 'inline-svg', 'tex-notation'];

export const EMPTY_HIGHLIGHTS = {};

/** Shared, so an entry with no marks keeps a stable array identity. */
const NO_MARKS = [];

export function keyFor(section, id) {
  return `${section}:${id}`;
}

export function marksFor(state, section, id) {
  const marks = state?.[keyFor(section, id)];
  return Array.isArray(marks) ? marks : NO_MARKS;
}

export function addMark(state, section, id, mark) {
  const key = keyFor(section, id);
  const existing = marksFor(state, section, id);
  // Same text at the same occurrence is the same highlight — re-selecting and
  // hitting Highlight again should not stack duplicate marks on one phrase.
  if (existing.some((m) => m.text === mark.text && m.nth === mark.nth)) return state;
  return { ...state, [key]: [...existing, mark] };
}

export function removeMark(state, section, id, markId) {
  const key = keyFor(section, id);
  const existing = marksFor(state, section, id);
  const next = existing.filter((m) => m.id !== markId);
  if (next.length === existing.length) return state;
  if (next.length === 0) {
    const { [key]: _dropped, ...rest } = state;
    return rest;
  }
  return { ...state, [key]: next };
}

export function countMarks(state) {
  return Object.values(state ?? {}).reduce(
    (total, marks) => total + (Array.isArray(marks) ? marks.length : 0),
    0
  );
}

/**
 * Index of the `nth` (0-based) occurrence of `needle` in `haystack`, or -1.
 *
 * Occurrences are counted non-overlapping and left to right, which is the same
 * order the DOM walk counts them in — the two must agree or a highlight lands
 * on the wrong words.
 */
export function nthIndexOf(haystack, needle, nth) {
  if (!needle) return -1;
  let from = 0;
  for (let i = 0; i <= nth; i += 1) {
    const found = haystack.indexOf(needle, from);
    if (found === -1) return -1;
    if (i === nth) return found;
    from = found + needle.length;
  }
  return -1;
}

/** How many non-overlapping occurrences of `needle` end at or before `limit`. */
export function occurrencesBefore(haystack, needle, limit) {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const found = haystack.indexOf(needle, from);
    if (found === -1 || found >= limit) return count;
    count += 1;
    from = found + needle.length;
  }
}

/** True when this DOM node sits inside a subtree that is not prose. */
export function isInSkippedSubtree(node, root) {
  let el = node?.nodeType === 1 ? node : node?.parentElement;
  while (el && el !== root) {
    const tag = el.tagName?.toLowerCase();
    if (tag && SKIP_TAGS.has(tag)) return true;
    if (SKIP_CLASSES.some((cls) => el.classList?.contains(cls))) return true;
    el = el.parentElement;
  }
  return false;
}

/* ── DOM side ──────────────────────────────────────────────────────── */

/**
 * Text nodes of `root` in document order, skipping the non-prose subtrees.
 *
 * Deliberately *not* `range.toString()` with a collapsed clone, which is the
 * usual trick for this: that counts the text inside code fences and diagrams,
 * which the render side does not, and the two offsets would drift apart by the
 * length of every code block above the selection.
 */
function proseTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isInSkippedSubtree(node, root) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

/** Resolve a Range boundary to the text node it actually starts in. */
function boundaryTextNode(container, offset) {
  if (container?.nodeType === Node.TEXT_NODE) return { node: container, offset };
  let node = container?.childNodes?.[offset] ?? container?.firstChild ?? null;
  while (node && node.nodeType !== Node.TEXT_NODE) node = node.firstChild;
  return { node, offset: 0 };
}

/**
 * Flatten the entry's prose and locate a Range's start within it.
 *
 * Everything below needs the same two things, so they are computed once:
 * `prose` (what the render side also sees) and `at` (where this selection
 * begins in it, or -1 if it began somewhere we do not track).
 */
function locate(root, range) {
  const { node: startNode, offset: startOffset } = boundaryTextNode(
    range?.startContainer,
    range?.startOffset ?? 0
  );
  if (!startNode) return { prose: '', at: -1, startNode: null };

  let prose = '';
  let at = -1;
  for (const node of proseTextNodes(root)) {
    if (node === startNode) at = prose.length + startOffset;
    prose += node.nodeValue ?? '';
  }
  return { prose, at, startNode };
}

/** An anchor is only usable if the text is still where we think it is. */
function anchorAt(prose, start, text) {
  if (!text || prose.slice(start, start + text.length) !== text) return null;
  return { text, nth: occurrencesBefore(prose, text, start) };
}

/**
 * Turn a live selection into the anchor we can store: the exact text, and
 * which occurrence of it this is within the entry's prose.
 *
 * Returns null when the selection starts inside a code block or diagram, is
 * only whitespace, or cannot be verified against the flattened prose — all of
 * which mean "do not offer to highlight this".
 */
export function selectionAnchor(root, range) {
  const raw = range?.toString() ?? '';
  const text = raw.trim();
  if (!root || !text) return null;

  const { prose, at, startNode } = locate(root, range);
  if (at === -1 || isInSkippedSubtree(startNode, root)) return null;

  // The stored text is trimmed, so shift past whatever whitespace the user
  // dragged over before the first real character.
  return anchorAt(prose, at + (raw.length - raw.trimStart().length), text);
}

/* Abbreviations whose full stop does not end a sentence. Without these,
   "e.g. a feed" and "p99. " both split mid-thought and Explain gets handed a
   fragment. Not exhaustive — it covers what this content actually writes. */
const ABBREVIATIONS = /(?:\b(?:e\.g|i\.e|etc|vs|approx|Dr|Mr|Ms|St|Fig|No)\.|\b[A-Z]\.|\d\.)$/;

function isSentenceEnd(prose, i) {
  if (!'.!?'.includes(prose[i])) return false;
  // A terminator only ends a sentence when whitespace or the text end follows.
  const next = prose[i + 1];
  if (next !== undefined && !/\s/.test(next)) return false;
  return !ABBREVIATIONS.test(prose.slice(Math.max(0, i - 6), i + 1));
}

/**
 * The whole sentence containing a selection — what Explain operates on.
 *
 * Returns the anchor so the sentence can be previewed with the same <mark>
 * machinery a stored highlight uses, rather than a second rendering path.
 */
export function sentenceAnchor(root, range) {
  if (!root || !range) return null;
  const { prose, at, startNode } = locate(root, range);
  if (at === -1 || isInSkippedSubtree(startNode, root)) return null;

  let start = 0;
  for (let i = at - 1; i >= 0; i -= 1) {
    if (isSentenceEnd(prose, i)) {
      start = i + 1;
      break;
    }
  }

  let end = prose.length;
  for (let i = Math.max(at, start); i < prose.length; i += 1) {
    if (isSentenceEnd(prose, i)) {
      end = i + 1;
      break;
    }
  }

  const raw = prose.slice(start, end);
  const text = raw.trim();
  if (!text) return null;
  return anchorAt(prose, start + (raw.length - raw.trimStart().length), text);
}

/**
 * The prose around a selection, for the Define and Explain prompts.
 *
 * A term on its own is a dictionary lookup; the surrounding paragraphs are
 * what make the answer specific to this entry.
 */
export function selectionContext(root, range, radius = 600) {
  if (!root || !range) return '';
  const { prose, at } = locate(root, range);
  if (at === -1) return prose.slice(0, radius * 2).trim();
  return prose.slice(Math.max(0, at - radius), at + radius).trim();
}

export function newMarkId() {
  return `h_${Math.random().toString(36).slice(2, 10)}`;
}

/* Exported for the unit tests only — the sentence heuristic is fiddly enough
   that it deserves direct coverage, but it is not part of the module's API. */
export const __testables = { isSentenceEnd };
