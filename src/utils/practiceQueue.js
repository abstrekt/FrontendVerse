import { getArchivedSet } from './archive.js';
import { filterExcludedCompleted } from './completed.js';

export const EMPTY_PRACTICE_QUEUE = null;

function uniqueIds(ids = []) {
  return [...new Set(ids.filter((id) => Number.isFinite(id)))];
}

function removeId(ids, id) {
  return ids.filter((itemId) => itemId !== id);
}

function moveToFront(ids, id) {
  return [id, ...removeId(ids, id)];
}

function moveToTail(ids, id) {
  return [...removeId(ids, id), id];
}

function toQuestionIds(pool = []) {
  return pool.map((item) => (typeof item === 'number' ? item : item.id));
}

function buildQueueState({
  pendingIds = [],
  seenIds = [],
  skippedIds = [],
  score = 0,
  answered = 0,
  answeredIds = [],
  mode = 'all',
  selectedTopics = [],
  selectedDifficulties = [],
}) {
  const pending = uniqueIds(pendingIds);
  const pendingSet = new Set(pending);
  const seen = uniqueIds(seenIds).filter((id) => !pendingSet.has(id));
  const queueIds = [...pending, ...seen];
  const queueSet = new Set(queueIds);
  const skipped = uniqueIds(skippedIds).filter((id) => queueSet.has(id));

  return {
    queueIds,
    pendingIds: pending,
    seenIds: seen,
    skippedIds: skipped,
    remaining: pending.length,
    passTotal: queueIds.length,
    score,
    answered,
    answeredIds: uniqueIds(answeredIds),
    mode,
    selectedTopics,
    selectedDifficulties,
  };
}

function splitLegacyQueue(state) {
  const queueIds = uniqueIds(state?.queueIds ?? []);
  const remaining = Math.max(0, Math.min(state?.remaining ?? queueIds.length, queueIds.length));
  return {
    pendingIds: queueIds.slice(0, remaining),
    seenIds: queueIds.slice(remaining),
  };
}

export function createPracticeQueue(
  pool,
  {
    mode = 'all',
    topics = [],
    difficulties = [],
    score = 0,
    answered = 0,
    answeredIds = [],
    skippedIds = [],
    resetPass = true,
  } = {}
) {
  const pendingIds = toQuestionIds(pool);
  const len = pendingIds.length;
  return buildQueueState({
    pendingIds,
    seenIds: [],
    skippedIds,
    passTotal: len,
    score: resetPass ? 0 : score,
    answered: resetPass ? 0 : answered,
    answeredIds: resetPass ? [] : answeredIds,
    mode,
    selectedTopics: topics,
    selectedDifficulties: difficulties,
  });
}

export function normalizePracticeQueue(state) {
  if (!state) return state;
  if (state.pendingIds || state.seenIds) {
    return buildQueueState({
      pendingIds: state.pendingIds ?? [],
      seenIds: state.seenIds ?? [],
      skippedIds: state.skippedIds ?? [],
      passTotal: state.passTotal,
      score: state.score ?? 0,
      answered: state.answered ?? 0,
      answeredIds: state.answeredIds ?? [],
      mode: state.mode ?? 'all',
      selectedTopics: state.selectedTopics ?? [],
      selectedDifficulties: state.selectedDifficulties ?? [],
    });
  }

  const { pendingIds, seenIds } = splitLegacyQueue(state);
  return buildQueueState({
    pendingIds,
    seenIds,
    skippedIds: state.skippedIds ?? [],
    passTotal: state.passTotal ?? pendingIds.length + seenIds.length,
    score: state.score ?? 0,
    answered: state.answered ?? 0,
    answeredIds: state.answeredIds ?? [],
    mode: state.mode ?? 'all',
    selectedTopics: state.selectedTopics ?? [],
    selectedDifficulties: state.selectedDifficulties ?? [],
  });
}

export function getPracticeQueueQuestionIds(state) {
  return normalizePracticeQueue(state)?.queueIds ?? [];
}

export function getPendingPracticeQueueIds(state) {
  return normalizePracticeQueue(state)?.pendingIds ?? [];
}

export function getSkippedPracticeQueueIds(state) {
  return normalizePracticeQueue(state)?.skippedIds ?? [];
}

export function restorePracticeQueue(state, questions) {
  const queueIds = getPracticeQueueQuestionIds(state);
  if (!queueIds.length || !questions.length) return [];
  const byId = new Map(questions.map((q) => [q.id, q]));
  return queueIds.map((id) => byId.get(id)).filter(Boolean);
}

export function isRestorablePracticeQueue(state, questions) {
  if (!getPracticeQueueQuestionIds(state).length) return false;
  return restorePracticeQueue(state, questions).length > 0;
}

export function advancePass(state) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized?.pendingIds.length) return normalized;

  const [currentId, ...pendingIds] = normalized.pendingIds;
  return buildQueueState({
    ...normalized,
    pendingIds,
    seenIds: [...normalized.seenIds, currentId],
  });
}

export function clampRemaining(state) {
  return normalizePracticeQueue(state);
}

export function archiveFromQueue(state, id) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;

  return buildQueueState({
    ...normalized,
    pendingIds: removeId(normalized.pendingIds, id),
    seenIds: removeId(normalized.seenIds, id),
    skippedIds: removeId(normalized.skippedIds, id),
    answeredIds: removeId(normalized.answeredIds, id),
  });
}

export function clearQuestionSkipped(state, id) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;
  return buildQueueState({
    ...normalized,
    skippedIds: removeId(normalized.skippedIds, id),
  });
}

export function skipQuestionInQueue(state, id) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;

  const isPending = normalized.pendingIds.includes(id);
  const pendingIds = isPending ? removeId(normalized.pendingIds, id) : normalized.pendingIds;
  const seenIds = normalized.seenIds.includes(id)
    ? normalized.seenIds
    : [...normalized.seenIds, id];

  return buildQueueState({
    ...normalized,
    pendingIds,
    seenIds,
    skippedIds: [...normalized.skippedIds, id],
  });
}

export function openQuestionInQueue(state, id, { clearSkipped = false } = {}) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;

  const pendingIds = moveToFront(normalized.pendingIds, id);
  const seenIds = removeId(normalized.seenIds, id);

  return buildQueueState({
    ...normalized,
    pendingIds,
    seenIds,
    skippedIds: clearSkipped ? removeId(normalized.skippedIds, id) : normalized.skippedIds,
  });
}

export function appendToQueueTail(state, id, { clearSkipped = false } = {}) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;

  const alreadyPending = normalized.pendingIds.includes(id);
  const pendingIds = alreadyPending
    ? moveToTail(normalized.pendingIds, id)
    : [...normalized.pendingIds, id];

  return buildQueueState({
    ...normalized,
    pendingIds,
    seenIds: removeId(normalized.seenIds, id),
    skippedIds: clearSkipped ? removeId(normalized.skippedIds, id) : normalized.skippedIds,
  });
}

export function mergePracticeQueueSkippedIds(state, skippedIds = []) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;
  return buildQueueState({
    ...normalized,
    skippedIds: [...normalized.skippedIds, ...skippedIds],
  });
}

export function sanitizePracticeQueue(state, section, archived) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;

  const archivedSet = getArchivedSet(archived, section);
  const filterArchived = (ids) => ids.filter((id) => !archivedSet.has(id));

  return buildQueueState({
    ...normalized,
    pendingIds: filterArchived(normalized.pendingIds),
    seenIds: filterArchived(normalized.seenIds),
    skippedIds: filterArchived(normalized.skippedIds),
    answeredIds: filterArchived(normalized.answeredIds),
  });
}

export function migrateSessionToQueue(oldSession) {
  if (!oldSession?.queueIds?.length) return null;
  const currentIndex = oldSession.currentIndex ?? 0;
  const queueLen = oldSession.queueIds.length;
  return buildQueueState({
    pendingIds: oldSession.queueIds.slice(currentIndex),
    seenIds: oldSession.queueIds.slice(0, currentIndex),
    score: oldSession.score ?? 0,
    answered: oldSession.answered ?? 0,
    answeredIds: oldSession.answeredIds ?? [],
    mode: oldSession.mode ?? 'all',
    selectedTopics: oldSession.selectedTopics ?? [],
    selectedDifficulties: oldSession.selectedDifficulties ?? [],
  });
}

export function loadPracticeQueueFromStorage(queueKey, legacySessionKey) {
  try {
    const item = localStorage.getItem(queueKey);
    if (item !== null) return JSON.parse(item);
    if (legacySessionKey) {
      const legacy = localStorage.getItem(legacySessionKey);
      if (legacy) return migrateSessionToQueue(JSON.parse(legacy));
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function filterPoolByCompleted(pool, completed, { includeCompleted = true, section } = {}) {
  if (includeCompleted) return pool;
  return filterExcludedCompleted(pool, section, completed);
}
