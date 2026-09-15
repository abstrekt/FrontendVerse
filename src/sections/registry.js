/**
 * One row per section.
 *
 * Section identity used to be spread across four places that had to be kept in
 * step by hand: the nav list and the subtitle ternary in Sidebar.jsx, the chip
 * row and the two big ternaries in App.jsx, and the setter list in
 * useAppRoute.js. This table is the single source for the parts that are
 * genuinely just data — label, badge, category, and how to count its contents.
 *
 * `inNav: false` marks a section that is routable and searchable but has no
 * sidebar entry. That was the existing behaviour for test-prep and is
 * preserved deliberately, not inherited by accident.
 */

// "entry/entries", "learning/learnings" etc. — the noun each section counts.
function counter(noun, plural) {
  return (n) => `${n} ${n === 1 ? noun : plural} available`;
}

const ENTRIES = counter('entry', 'entries');
const LEARNINGS = counter('learning', 'learnings');
const QUESTIONS = counter('question', 'questions');

export const SECTIONS = {
  // The landing view. Routable and titled, but it is the destination of
  // the brand button rather than a row in the section list.
  overview: {
    label: 'Overview',
    navIcon: 'OV',
    category: null,
    kind: 'overview',
    subtitle: null,
    inNav: false,
  },
  // Temporary — prep for the Acceldata interview. Routable via direct link
  // (/acceldata-prep), but hidden from the sidebar navigation.
  'acceldata-prep': {
    label: 'Work Experience Deep Dive',
    navIcon: 'WE',
    category: null,
    kind: 'learning',
    subtitle: ENTRIES,
    inNav: false,
  },
  mcq: { label: 'JavaScript MCQs', navIcon: 'JS', category: 'js', kind: 'mcq', subtitle: QUESTIONS },
  learnings: {
    label: 'Javascript learnings',
    navIcon: 'LR',
    category: 'js',
    kind: 'learning',
    subtitle: LEARNINGS,
  },
  browser: {
    label: 'Browser & Web Platform',
    navIcon: 'BW',
    category: 'js',
    kind: 'learning',
    subtitle: LEARNINGS,
  },
  css: { label: 'CSS', navIcon: 'CS', category: 'css', kind: 'learning', subtitle: ENTRIES },
  'ai-dev': {
    label: 'AI-Assisted Development',
    navIcon: 'AI',
    // Spans HTML, CSS, JS and the build, so it stays visible under every
    // category chip rather than hiding behind one.
    category: null,
    kind: 'learning',
    subtitle: QUESTIONS,
  },
  'web-fundamentals': {
    label: 'Web Fundamentals',
    navIcon: 'WF',
    // Spans HTML, CSS, JS and the build, so it stays visible under every
    // category chip rather than hiding behind one.
    category: null,
    kind: 'learning',
    subtitle: LEARNINGS,
  },
  'react-learnings': {
    label: 'React Learnings',
    navIcon: 'RL',
    category: 'react',
    kind: 'learning',
    subtitle: LEARNINGS,
  },
  'react-guide': {
    label: 'React Guide',
    navIcon: 'RG',
    category: 'react',
    kind: 'learning',
    subtitle: ENTRIES,
  },
  'advanced-react': {
    label: 'Advanced React',
    navIcon: 'AR',
    category: 'react',
    kind: 'learning',
    subtitle: ENTRIES,
  },
  'system-design': {
    label: 'System Design',
    navIcon: 'SD',
    // Not a JS/CSS/React/algorithms topic — it spans all of them, so it stays
    // visible under every category chip rather than hiding behind one.
    category: null,
    kind: 'learning',
    subtitle: LEARNINGS,
  },
  algorithm: {
    label: 'Algorithm',
    navIcon: 'AL',
    category: 'algo',
    kind: 'learning',
    subtitle: LEARNINGS,
  },
  blind75: {
    label: 'Blind 75',
    navIcon: '75',
    category: 'algo',
    kind: 'learning',
    subtitle: counter('problem', 'problems'),
  },
  coding: {
    label: 'Javascript coding',
    navIcon: 'CD',
    category: 'js',
    kind: 'item',
    subtitle: counter('challenge', 'challenges'),
  },
  output: {
    label: 'Javascript output',
    navIcon: 'OP',
    category: 'js',
    kind: 'item',
    subtitle: QUESTIONS,
  },
  archived: {
    label: 'Archived',
    navIcon: 'AV',
    // Not tied to one technology, so it stays visible under every category chip.
    category: null,
    kind: 'archived',
    subtitle: (n) => `${n} archived item${n === 1 ? '' : 's'}`,
  },

  // Routable and searchable, but deliberately absent from the sidebar nav.
  'test-prep': {
    label: 'Test Prep',
    navIcon: 'TP',
    category: null,
    kind: 'learning',
    subtitle: ENTRIES,
    inNav: false,
  },
};

export const NAV_SECTIONS = Object.keys(SECTIONS).filter((id) => SECTIONS[id].inNav !== false);

export function sectionLabel(id) {
  return SECTIONS[id]?.label ?? id;
}
