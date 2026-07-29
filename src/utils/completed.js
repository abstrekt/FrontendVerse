import { SECTIONS } from './archive.js';

export const EMPTY_COMPLETED = {
  mcq: [],
  learnings: [],
  'react-learnings': [],
  hld: [],
  algorithm: [],
  coding: [],
  output: [],
};

export function getCompletedSet(completed, section) {
  const ids = completed?.[section] ?? [];
  return new Set(ids);
}

export function isCompleted(id, section, completed) {
  return getCompletedSet(completed, section).has(id);
}

export function markCompletedId(completed, section, id) {
  const ids = completed?.[section] ?? [];
  if (ids.includes(id)) return completed;
  return { ...completed, [section]: [...ids, id] };
}

export function unmarkCompletedId(completed, section, id) {
  const ids = completed?.[section] ?? [];
  return { ...completed, [section]: ids.filter((itemId) => itemId !== id) };
}

export function toggleCompletedId(completed, section, id) {
  if (isCompleted(id, section, completed)) {
    return unmarkCompletedId(completed, section, id);
  }
  return markCompletedId(completed, section, id);
}

export function getCompletedCount(completed, section) {
  return completed?.[section]?.length ?? 0;
}

export function getTotalCompletedCount(completed) {
  return SECTIONS.reduce((sum, section) => sum + getCompletedCount(completed, section), 0);
}

export function filterExcludedCompleted(items, section, completed) {
  const completedSet = getCompletedSet(completed, section);
  return items.filter((item) => !completedSet.has(item.id));
}

export function sortCompletedToEnd(items, section, completed) {
  const completedSet = getCompletedSet(completed, section);
  const pending = [];
  const done = [];
  for (const item of items) {
    (completedSet.has(item.id) ? done : pending).push(item);
  }
  return [...pending, ...done];
}

/** Merge correct answers from quiz progress into the completed store (one-time migration). */
export function syncCompletedFromProgress(completed, section, progress) {
  if (!progress?.answers) return completed;

  let next = completed;
  for (const [id, entry] of Object.entries(progress.answers)) {
    const numId = Number(id);
    if (Number.isNaN(numId)) continue;
    if (entry.lastCorrect === true || entry.correct > 0) {
      next = markCompletedId(next, section, numId);
    }
  }
  return next;
}

/** Sync output progress (lastCorrect only) into completed store. */
export function syncOutputCompletedFromProgress(completed, progress) {
  if (!progress?.answers) return completed;

  let next = completed;
  for (const [id, entry] of Object.entries(progress.answers)) {
    const numId = Number(id);
    if (Number.isNaN(numId)) continue;
    if (entry.lastCorrect === true) {
      next = markCompletedId(next, 'output', numId);
    }
  }
  return next;
}
