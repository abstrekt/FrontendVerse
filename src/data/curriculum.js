/**
 * Teaching order for the sections that have one.
 *
 * The learnings sections are merges of several JSON files, so the list a reader
 * sees was, until this table existed, the order the files happened to be
 * imported in — `this` inside `setTimeout` before `undefined vs null` had been
 * mentioned, and the 52 wtfjs quirks in one undifferentiated block.
 *
 * The order lives here rather than in the JSON because a module spans several
 * source files: file order cannot express it, and reshuffling 200KB of JSON to
 * fake it makes every later content diff unreadable. Ids are the URL and the
 * localStorage key for starred/completed/archived, so they are never renumbered
 * to encode position — position is this table.
 *
 * A quirk is filed under the concept it breaks, not with the other quirks:
 * `[] == ![]` sits in Coercion & Equality, "arrow functions can not be a
 * constructor" under Functions & `this`. Reading a section top to bottom should
 * introduce nothing before the thing it depends on.
 *
 * `src/data/curriculum.test.js` fails if an id is listed twice, listed but
 * absent from the data, or present in the data but unlisted.
 */

export const UNSORTED_LABEL = 'Unsorted';

export const CURRICULUM = {
  learnings: [
    {
      key: 'types',
      label: 'Types & Values',
      ids: [83, 84, 85, 51, 87, 47, 86, 46, 35, 48, 78, 42, 43],
    },
    {
      key: 'coercion',
      label: 'Coercion & Equality',
      ids: [93, 89, 91, 36, 90, 38, 71, 82, 44, 33, 37, 31, 32, 41, 39, 50, 34, 49, 69, 55],
    },
    {
      key: 'operators',
      label: 'Operators, Expressions & Control Flow',
      ids: [88, 92, 94, 131, 59, 60, 68, 70, 154],
    },
    {
      key: 'syntax',
      label: 'Syntax, ASI & Strict Mode',
      ids: [79, 67, 40, 45, 102, 80, 81, 112],
    },
    {
      key: 'execution-context',
      label: 'Execution Context, Scope & Hoisting',
      ids: [129, 99, 100, 103, 72, 6, 5, 23],
    },
    {
      key: 'closures',
      label: 'Closures',
      ids: [130, 106, 148, 111, 153],
    },
    {
      key: 'functions-this',
      label: 'Functions & this',
      ids: [107, 108, 75, 119, 118, 104, 4, 25, 64, 65, 66, 1, 144, 151, 53, 52],
    },
    {
      key: 'objects-prototypes',
      label: 'Objects, Prototypes & Classes',
      ids: [126, 125, 127, 123, 7, 10, 56, 105, 113, 61, 63, 54, 9, 150],
    },
    {
      key: 'collections',
      label: 'Arrays, Sets & Maps',
      ids: [124, 149, 155, 73, 8, 117, 58, 156],
    },
    {
      key: 'modern-syntax',
      label: 'Modern JS Syntax (ES6+)',
      ids: [115, 57, 114, 116, 62],
    },
    {
      key: 'async',
      label: 'Async & the Event Loop',
      ids: [128, 22, 145, 110, 120, 121, 3, 26, 74, 76, 77],
    },
    {
      key: 'reference',
      label: 'Reference',
      ids: [134, 135],
    },
  ],

  browser: [
    {
      key: 'dom-events',
      label: 'DOM & Events',
      ids: [95, 146, 28, 147, 97, 98, 152],
    },
    {
      key: 'rendering',
      label: 'Rendering & Performance',
      ids: [154, 155],
    },
    {
      key: 'network',
      label: 'Network & Data',
      ids: [122, 159, 157, 156],
    },
    {
      key: 'storage-security',
      label: 'Storage, Workers & Security',
      ids: [132, 133, 158],
    },
  ],
  // System design is read as a course, not browsed: the framework has to land
  // before the case studies that apply it, and the LLD round is a different
  // interview from the HLD one. Ids are blocked by source file (1-99
  // foundations, 100s building blocks, 200s cases, 300s LLD, 400s deep dives,
  // 500s playbooks) purely so a file is identifiable from an id — ids 1 and 2
  // predate the blocks and keep their numbers, because they are URLs.
  'system-design': [
    {
      key: 'framework',
      label: 'Framework & Rubrics',
      ids: [3, 4, 5, 6, 7, 2],
    },
    {
      key: 'requirements',
      label: 'Requirements & Scoping',
      ids: [8, 9, 10, 11, 12],
    },
    {
      key: 'building-blocks',
      label: 'HLD: Building Blocks',
      ids: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111],
    },
    {
      key: 'case-studies',
      label: 'HLD: Case Studies',
      ids: [
        200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216,
        217, 218, 1,
      ],
    },
    {
      key: 'component-design',
      label: 'LLD: Component Design',
      ids: [300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311],
    },
    {
      key: 'deep-dives',
      label: 'Cross-Cutting Deep Dives',
      ids: [
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
      ],
    },
    {
      key: 'playbooks',
      label: 'Interview Playbooks',
      ids: [500, 501, 502, 505],
    },
  ],

  blind75: [
    {
      key: 'pattern-blueprints',
      label: 'Pattern Blueprints',
      ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      key: 'arrays-hashing',
      label: 'Arrays & Hashing',
      ids: [11, 12, 10, 13, 14, 17, 15, 16],
    },
    {
      key: 'two-pointers',
      label: 'Two Pointers',
      ids: [20, 21, 22, 23],
    },
    {
      key: 'sliding-window',
      label: 'Sliding Window',
      ids: [18, 24, 25, 26],
    },
    {
      key: 'linked-list',
      label: 'Linked List',
      ids: [28, 29, 30, 31, 32, 33],
    },
    {
      key: 'trees',
      label: 'Trees',
      ids: [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
    },
    {
      key: 'tries',
      label: 'Tries',
      ids: [45, 46, 47],
    },
    {
      key: 'heap',
      label: 'Heap / Priority Queue',
      ids: [49, 50, 48],
    },
    {
      key: 'backtracking',
      label: 'Backtracking',
      ids: [56, 78],
    },
    {
      key: 'graphs',
      label: 'Graphs',
      ids: [68, 69, 70, 71, 72, 73],
    },
    {
      key: 'advanced-graphs',
      label: 'Advanced Graphs',
      ids: [74],
    },
    {
      key: '1d-dp',
      label: '1-D Dynamic Programming',
      ids: [51, 57, 58, 79, 62, 59, 52, 27, 55, 53],
    },
    {
      key: '2d-dp',
      label: '2-D Dynamic Programming',
      ids: [60, 54],
    },
    {
      key: 'greedy',
      label: 'Greedy',
      ids: [19, 61],
    },
    {
      key: 'intervals',
      label: 'Intervals',
      ids: [63, 64, 65, 66, 67],
    },
    {
      key: 'math-geometry',
      label: 'Math & Geometry',
      ids: [77, 76, 75],
    },
    {
      key: 'bit-manipulation',
      label: 'Bit Manipulation',
      ids: [80, 81, 82, 83, 84, 85],
    },
  ],
};

/** Sections whose panel renders module headers. */
export const GROUPED_SECTIONS = Object.keys(CURRICULUM);

/**
 * Sort `items` into curriculum order and stamp each with its module.
 *
 * Anything the table does not mention keeps its original relative order and
 * lands at the end under "Unsorted" — new content stays visible and obviously
 * unfiled rather than silently vanishing from the section.
 */
export function applyCurriculum(section, items) {
  const modules = CURRICULUM[section];
  if (!modules) return items;

  const placement = new Map();
  let rank = 0;
  for (const mod of modules) {
    for (const id of mod.ids) {
      placement.set(id, { rank: rank++, key: mod.key, label: mod.label });
    }
  }

  const unplacedRank = placement.size;

  return items
    .map((item, index) => {
      const place = placement.get(item.id);
      return {
        item: {
          ...item,
          moduleKey: place?.key ?? 'unsorted',
          module: place?.label ?? UNSORTED_LABEL,
        },
        // Unplaced entries sort among themselves by their position in the merge.
        rank: place ? place.rank : unplacedRank + index,
      };
    })
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.item);
}
