import { SECTIONS } from './archive.js';
import { GROUPED_SECTIONS } from '../data/curriculum.js';

export const EMPTY_COMPLETED = {
  'acceldata-prep': [],
  'interview-prep': [],
  'test-prep': [],
  mcq: [],
  learnings: [],
  browser: [],
  css: [],
  'react-learnings': [],
  'react-guide': [],
  'advanced-react': [],
  'system-design': [],
  algorithm: [],
  blind75: [],
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

export function getActiveCompletedCount(completed, section, activeItems) {
  const completedSet = getCompletedSet(completed, section);
  return activeItems.filter((item) => completedSet.has(item.id)).length;
}

export function getTotalCompletedCount(completed) {
  return SECTIONS.reduce((sum, section) => sum + getCompletedCount(completed, section), 0);
}

export function filterExcludedCompleted(items, section, completed) {
  const completedSet = getCompletedSet(completed, section);
  return items.filter((item) => !completedSet.has(item.id));
}

/**
 * Sink mastered items so the next unread one is at the top.
 *
 * In a section with a teaching order (see `src/data/curriculum.js`) "the end"
 * means the end of the item's own module, not the end of the section — sending
 * a mastered item past eleven later modules would undo the ordering the reader
 * came for. `GROUPED_SECTIONS` decides which behaviour applies.
 */
export function sortCompletedToEnd(items, section, completed) {
  const completedSet = getCompletedSet(completed, section);

  if (GROUPED_SECTIONS.includes(section)) {
    const order = [];
    const buckets = new Map();
    for (const item of items) {
      const key = item.moduleKey ?? 'unsorted';
      if (!buckets.has(key)) {
        buckets.set(key, { pending: [], done: [] });
        order.push(key);
      }
      const bucket = buckets.get(key);
      (completedSet.has(item.id) ? bucket.done : bucket.pending).push(item);
    }
    return order.flatMap((key) => [...buckets.get(key).pending, ...buckets.get(key).done]);
  }

  const pending = [];
  const done = [];
  for (const item of items) {
    (completedSet.has(item.id) ? done : pending).push(item);
  }
  return [...pending, ...done];
}

/**
 * Merge correct answers from quiz progress into the completed store.
 *
 * Run once (see `utils/migrations.js`) — re-running it on every load would undo
 * the user's manual un-mastering. Keyed on `lastCorrect` only, matching
 * `syncOutputCompletedFromProgress`: a question answered right once and wrong
 * ten times since is not mastered.
 */
export function syncCompletedFromProgress(completed, section, progress) {
  if (!progress?.answers) return completed;

  let next = completed;
  for (const [id, entry] of Object.entries(progress.answers)) {
    const numId = Number(id);
    if (Number.isNaN(numId)) continue;
    if (entry.lastCorrect === true) {
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
