/**
 * Lazily-loaded learning datasets.
 *
 * These nine sections account for roughly half a megabyte of JSON that was
 * previously imported statically into App.jsx and therefore shipped in the
 * entry chunk, whether or not the reader ever opened a learnings page. Vite
 * emits each dynamic import as its own chunk.
 *
 * The MCQ, output and coding banks are deliberately NOT here. They feed the
 * practice-queue restore path, which sanitises saved localStorage queues
 * against the full question pool in a single mount effect. Making those pools
 * async would require gating that effect on readiness, and getting it wrong
 * corrupts saved progress rather than failing loudly.
 */

// The "learnings" section is a merge of seven files.
const JS_LEARNINGS = [
  () => import('../../data/learnings.json'),
  () => import('../../data/polyfill-learnings.json'),
  () => import('../../data/tekion-interview-learnings.json'),
  () => import('../../data/wtfjs-learnings.json'),
  () => import('../../data/devto-interview-learnings.json'),
  () => import('../../data/senior-frontend-learnings.json'),
  () => import('../../data/browser-learnings.json'),
];

function merge(loaders) {
  return () =>
    Promise.all(loaders.map((load) => load())).then((mods) =>
      mods.flatMap((mod) => mod.default.learnings),
    );
}

function single(load) {
  return () => load().then((mod) => mod.default.learnings);
}

export const LEARNING_LOADERS = {
  learnings: merge(JS_LEARNINGS),
  css: single(() => import('../../data/css-learnings.json')),
  'react-learnings': single(() => import('../../data/react-learnings.json')),
  'react-guide': single(() => import('../../data/react-guide.json')),
  'interview-prep': single(() => import('../../data/interview-prep.json')),
  'test-prep': single(() => import('../../data/test-prep.json')),
  'advanced-react': single(() => import('../../data/advanced-react.json')),
  hld: single(() => import('../../data/hld-learnings.json')),
  algorithm: single(() => import('../../data/algorithm-learnings.json')),
};

// Returning to a section should be instant, and the search index asks for
// everything at once — so results are cached per section for the session.
const cache = new Map();

export function loadLearningSection(section) {
  if (!cache.has(section)) {
    const loader = LEARNING_LOADERS[section];
    if (!loader) return Promise.resolve([]);
    // Cache the promise, not the result: two callers racing on the same
    // section must not trigger two downloads.
    cache.set(
      section,
      loader().catch((err) => {
        // A failed chunk must not be cached as permanently broken.
        cache.delete(section);
        throw err;
      }),
    );
  }
  return cache.get(section);
}

export function loadAllLearningSections() {
  const sections = Object.keys(LEARNING_LOADERS);
  return Promise.all(sections.map((s) => loadLearningSection(s))).then((lists) =>
    Object.fromEntries(sections.map((s, i) => [s, lists[i]])),
  );
}
