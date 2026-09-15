/**
 * A rehype plugin that wraps stored highlights in <mark>.
 *
 * Applying highlights by walking the rendered DOM would mean mutating nodes
 * React owns, which it undoes on the next render. Doing it here instead — on
 * the hast tree, before React sees it — means the marks are part of the
 * element tree like any other content, survive re-renders for free, and cost
 * one pass over the text nodes.
 *
 * The tree is flattened into one prose string in document order, which is the
 * same string `occurrenceIndexOf` builds from the DOM when the user selects.
 * Both sides skip the same subtrees (see SKIP_TAGS), so an offset computed
 * from a selection resolves to the same characters here.
 */

import { SKIP_TAGS, nthIndexOf } from './highlights.js';

/** Stable identity for the transient sentence preview Explain shows on hover. */
export const PREVIEW_MARK_ID = '__preview__';

/** Shared empty array so a no-marks entry keeps a stable prop identity. */
export const EMPTY_MARKS = [];

/**
 * Walk the tree collecting prose text nodes with their absolute offsets.
 *
 * Returns the flattened string plus, for each text node, where it sits in that
 * string and how to reach it — enough to splice a <mark> in without walking
 * again.
 */
function collectTextNodes(tree) {
  const nodes = [];
  let offset = 0;

  const walk = (node, parent, index) => {
    if (node.type === 'text') {
      const value = node.value ?? '';
      nodes.push({ parent, index, start: offset, end: offset + value.length, value });
      offset += value.length;
      return;
    }
    if (node.type === 'element' && SKIP_TAGS.has(node.tagName)) return;
    const children = node.children ?? [];
    for (let i = 0; i < children.length; i += 1) walk(children[i], node, i);
  };

  walk(tree, null, 0);
  return { nodes, text: nodes.map((n) => n.value).join('') };
}

function markElement(id, value) {
  return {
    type: 'element',
    tagName: 'mark',
    properties: { dataMarkId: id, className: ['hl-mark'] },
    children: [{ type: 'text', value }],
  };
}

/**
 * `marks` is the stored array for one entry: [{ id, text, nth }].
 *
 * A mark whose text no longer sits at its recorded occurrence is skipped
 * rather than approximated — see the note in highlights.js about why losing a
 * highlight beats moving one.
 */
export function rehypeMarkRanges(marks = []) {
  return () => (tree) => {
    if (!marks.length) return;

    const { nodes, text } = collectTextNodes(tree);
    if (!text) return;

    // Absolute ranges, resolved once against the flattened prose.
    const ranges = [];
    for (const mark of marks) {
      if (!mark?.text) continue;
      const start = nthIndexOf(text, mark.text, mark.nth ?? 0);
      if (start === -1) continue;
      const end = start + mark.text.length;
      // Verify rather than trust: the entry may have been edited since.
      if (text.slice(start, end) !== mark.text) continue;
      ranges.push({ id: mark.id, start, end });
    }
    if (!ranges.length) return;

    // Segments per text node, in the node's own coordinates.
    const segmentsByNode = new Map();
    nodes.forEach((node, i) => {
      for (const range of ranges) {
        if (range.end <= node.start || range.start >= node.end) continue;
        const localStart = Math.max(0, range.start - node.start);
        const localEnd = Math.min(node.value.length, range.end - node.start);
        if (localEnd <= localStart) continue;
        if (!segmentsByNode.has(i)) segmentsByNode.set(i, []);
        segmentsByNode.get(i).push({ id: range.id, start: localStart, end: localEnd });
      }
    });
    if (!segmentsByNode.size) return;

    // Build replacements, then splice them in back-to-front per parent so the
    // indices collected during the walk stay valid as children are replaced.
    const replacements = [];
    for (const [nodeIndex, segments] of segmentsByNode) {
      const node = nodes[nodeIndex];
      segments.sort((a, b) => a.start - b.start);

      const children = [];
      let cursor = 0;
      for (const seg of segments) {
        // Overlapping highlights: the earlier one wins the shared characters.
        if (seg.start < cursor) continue;
        if (seg.start > cursor) {
          children.push({ type: 'text', value: node.value.slice(cursor, seg.start) });
        }
        children.push(markElement(seg.id, node.value.slice(seg.start, seg.end)));
        cursor = seg.end;
      }
      if (cursor < node.value.length) {
        children.push({ type: 'text', value: node.value.slice(cursor) });
      }
      replacements.push({ parent: node.parent, index: node.index, children });
    }

    replacements.sort((a, b) => b.index - a.index);
    for (const { parent, index, children } of replacements) {
      if (!parent?.children) continue;
      parent.children.splice(index, 1, ...children);
    }
  };
}
