import { SECTIONS } from './archive';

export const EMPTY_STARRED = {
  'test-prep': [],
  mcq: [],
  learnings: [],
  css: [],
  'react-learnings': [],
  'react-guide': [],
  'advanced-react': [],
  hld: [],
  algorithm: [],
  coding: [],
  output: [],
};

export const EMPTY_STARRED_FILTER = {
  'test-prep': false,
  mcq: false,
  learnings: false,
  css: false,
  'react-learnings': false,
  'react-guide': false,
  'advanced-react': false,
  hld: false,
  algorithm: false,
  coding: false,
  output: false,
};

export function getStarredSet(starred, section) {
  const ids = starred?.[section] ?? [];
  return new Set(ids);
}

export function filterStarred(items, section, starred) {
  const starredSet = getStarredSet(starred, section);
  return items.filter((item) => starredSet.has(item.id));
}

export function isStarred(id, section, starred) {
  return getStarredSet(starred, section).has(id);
}

export function starId(starred, section, id) {
  const ids = starred?.[section] ?? [];
  if (ids.includes(id)) return starred;
  return { ...starred, [section]: [...ids, id] };
}

export function unstarId(starred, section, id) {
  const ids = starred?.[section] ?? [];
  return { ...starred, [section]: ids.filter((itemId) => itemId !== id) };
}

export function toggleStarId(starred, section, id) {
  if (isStarred(id, section, starred)) {
    return unstarId(starred, section, id);
  }
  return starId(starred, section, id);
}

export function getStarredCount(starred, section) {
  return starred?.[section]?.length ?? 0;
}

export function getTotalStarredCount(starred) {
  return SECTIONS.reduce((sum, section) => sum + getStarredCount(starred, section), 0);
}
