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
import { applyCurriculum } from './curriculum';

// The "learnings" section is a merge of five files. The order they are listed
// in no longer decides the reading order — `applyCurriculum` does, see
// `src/data/curriculum.js`.
const JS_LEARNINGS = [
  () => import('../../data/learnings.json'),
  () => import('../../data/tekion-interview-learnings.json'),
  () => import('../../data/wtfjs-learnings.json'),
  () => import('../../data/devto-interview-learnings.json'),
  () => import('../../data/senior-frontend-learnings.json'),
];

// System design is split by module rather than kept in one file: the section
// is ~80 long-form articles, and a single JSON would make every later content
// diff unreadable. Order is `applyCurriculum`, not this list.
const SYSTEM_DESIGN = [
  () => import('../../data/system-design-foundations.json'),
  () => import('../../data/system-design-hld.json'),
  () => import('../../data/system-design-cases.json'),
  () => import('../../data/system-design-lld.json'),
  () => import('../../data/system-design-deep-dives.json'),
  () => import('../../data/system-design-playbooks.json'),
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
  // Temporary — see ACCELDATA-PREP-REMOVAL.md
  'acceldata-prep': single(() => import('../../data/acceldata-prep.json')),
  learnings: merge(JS_LEARNINGS),
  browser: single(() => import('../../data/browser-platform-learnings.json')),
  css: single(() => import('../../data/css-learnings.json')),
  'react-learnings': single(() => import('../../data/react-learnings.json')),
  'react-guide': single(() => import('../../data/react-guide.json')),
  'interview-prep': single(() => import('../../data/interview-prep.json')),
  'test-prep': single(() => import('../../data/test-prep.json')),
  'advanced-react': single(() => import('../../data/advanced-react.json')),
  'system-design': merge(SYSTEM_DESIGN),
  algorithm: single(() => import('../../data/algorithm-learnings.json')),
  blind75: single(() => import('../../data/blind75-learnings.json')),
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
      loader()
        .then((items) => applyCurriculum(section, items))
        .catch((err) => {
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
