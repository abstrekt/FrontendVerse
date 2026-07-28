export const EMPTY_ARCHIVED = {
  mcq: [],
  learnings: [],
  'react-learnings': [],
  hld: [],
  coding: [],
  output: [],
};

export const SECTIONS = ['mcq', 'learnings', 'react-learnings', 'hld', 'coding', 'output'];

export const SECTION_LABELS = {
  mcq: 'MCQ',
  learnings: 'Learnings',
  'react-learnings': 'React Learnings',
  hld: 'HLD',
  coding: 'Coding',
  output: 'Output',
};

export function getArchivedSet(archived, section) {
  const ids = archived?.[section] ?? [];
  return new Set(ids);
}

export function filterActive(items, section, archived) {
  const archivedSet = getArchivedSet(archived, section);
  return items.filter((item) => !archivedSet.has(item.id));
}

export function filterArchived(items, section, archived) {
  const archivedSet = getArchivedSet(archived, section);
  return items.filter((item) => archivedSet.has(item.id));
}

export function isArchived(id, section, archived) {
  return getArchivedSet(archived, section).has(id);
}

export function archiveId(archived, section, id) {
  const ids = archived?.[section] ?? [];
  if (ids.includes(id)) return archived;
  return { ...archived, [section]: [...ids, id] };
}

export function unarchiveId(archived, section, id) {
  const ids = archived?.[section] ?? [];
  return { ...archived, [section]: ids.filter((itemId) => itemId !== id) };
}

export function getArchivedCount(archived) {
  return SECTIONS.reduce((sum, section) => sum + (archived?.[section]?.length ?? 0), 0);
}

export function sanitizeQueueIds(queueIds, section, archived) {
  const archivedSet = getArchivedSet(archived, section);
  return queueIds.filter((id) => !archivedSet.has(id));
}
