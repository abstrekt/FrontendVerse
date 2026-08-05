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

/**
 * `score` and `answered` are derived, never stored independently.
 *
 * They used to be free-running counters, which meant archiving an answered
 * question shrank `passTotal` without shrinking `score` — producing session
 * percentages of up to 500%. Deriving them from id lists that are themselves
 * scoped to the queue makes that class of drift impossible.
 */
function buildQueueState({
  pendingIds = [],
  seenIds = [],
  skippedIds = [],
  answeredIds = [],
  correctIds = [],
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
  const answered = uniqueIds(answeredIds).filter((id) => queueSet.has(id));
  const answeredSet = new Set(answered);
  const correct = uniqueIds(correctIds).filter((id) => answeredSet.has(id));

  return {
    queueIds,
    pendingIds: pending,
    seenIds: seen,
    skippedIds: skipped,
    remaining: pending.length,
    passTotal: queueIds.length,
    score: correct.length,
    answered: answered.length,
    answeredIds: answered,
    correctIds: correct,
    mode,
    selectedTopics,
    selectedDifficulties,
  };
}

/**
 * Legacy states stored `score`/`answered` as counters with no record of *which*
 * answers were right. Approximate `correctIds` from the counter so an in-flight
 * pass keeps a consistent score across the upgrade.
 */
function inferCorrectIds(state, answeredIds) {
  if (Array.isArray(state?.correctIds)) return state.correctIds;
  const score = Number.isFinite(state?.score) ? state.score : 0;
  return uniqueIds(answeredIds).slice(0, Math.max(0, score));
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
    answeredIds = [],
    correctIds = [],
    skippedIds = [],
    resetPass = true,
  } = {}
) {
  return buildQueueState({
    pendingIds: toQuestionIds(pool),
    seenIds: [],
    skippedIds,
    answeredIds: resetPass ? [] : answeredIds,
    correctIds: resetPass ? [] : correctIds,
    mode,
    selectedTopics: topics,
    selectedDifficulties: difficulties,
  });
}

export function normalizePracticeQueue(state) {
  if (!state) return state;

  const legacy = !state.pendingIds && !state.seenIds;
  const { pendingIds, seenIds } = legacy
    ? splitLegacyQueue(state)
    : { pendingIds: state.pendingIds ?? [], seenIds: state.seenIds ?? [] };
  const answeredIds = state.answeredIds ?? [];

  return buildQueueState({
    pendingIds,
    seenIds,
    skippedIds: state.skippedIds ?? [],
    answeredIds,
    correctIds: inferCorrectIds(state, answeredIds),
    mode: state.mode ?? 'all',
    selectedTopics: state.selectedTopics ?? [],
    selectedDifficulties: state.selectedDifficulties ?? [],
  });
}

/** Record an answer. Idempotent: answering the same question twice is a no-op. */
export function recordAnswerInQueue(state, id, correct) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized || normalized.answeredIds.includes(id)) return normalized;

  return buildQueueState({
    ...normalized,
    answeredIds: [...normalized.answeredIds, id],
    correctIds: correct ? [...normalized.correctIds, id] : normalized.correctIds,
  });
}

/** Upgrade an already-answered question from wrong to right (a successful retry). */
export function markAnswerCorrectInQueue(state, id) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;
  if (!normalized.answeredIds.includes(id) || normalized.correctIds.includes(id)) {
    return normalized;
  }
  return buildQueueState({ ...normalized, correctIds: [...normalized.correctIds, id] });
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

/**
 * Drop queued ids that aren't in the currently visible pool.
 *
 * Without this, a filter change leaves invisible ids in `pendingIds`: they still
 * count toward `remaining`/`passTotal` but can never be rendered, so "Next"
 * appears to do nothing and the header reads e.g. "Left in pass 2/1".
 */
export function restrictQueueToPool(state, questions) {
  const normalized = normalizePracticeQueue(state);
  if (!normalized) return normalized;
  // An empty pool means the content hasn't loaded yet, not that every question
  // was filtered away — restricting here would wipe the stored pass.
  if (!questions.length) return normalized;

  const visible = new Set(questions.map((q) => q.id));
  if (normalized.queueIds.every((id) => visible.has(id))) return normalized;

  const keep = (ids) => ids.filter((id) => visible.has(id));
  return buildQueueState({
    ...normalized,
    pendingIds: keep(normalized.pendingIds),
    seenIds: keep(normalized.seenIds),
    skippedIds: keep(normalized.skippedIds),
    answeredIds: keep(normalized.answeredIds),
    correctIds: keep(normalized.correctIds),
  });
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
  const answeredIds = oldSession.answeredIds ?? [];
  return buildQueueState({
    pendingIds: oldSession.queueIds.slice(currentIndex),
    seenIds: oldSession.queueIds.slice(0, currentIndex),
    answeredIds,
    correctIds: inferCorrectIds(oldSession, answeredIds),
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
