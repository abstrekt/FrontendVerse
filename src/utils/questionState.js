import {
  getPendingPracticeQueueIds,
  getPracticeQueueQuestionIds,
  getSkippedPracticeQueueIds,
} from './practiceQueue.js';

export const QUESTION_STATUS_LABELS = {
  unanswered: 'No history',
  correct: 'Correct',
  wrong: 'Wrong',
  skipped: 'Skipped',
};

export const QUESTION_STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'completed', label: 'Mastered' },
  { id: 'unanswered', label: 'No history' },
  { id: 'correct', label: 'Correct' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'skipped', label: 'Skipped' },
];

export function getHistoricalQuestionStatus(questionId, progress) {
  const entry = progress?.answers?.[String(questionId)];
  if (!entry) return 'unanswered';
  if (entry.lastCorrect === false) return 'wrong';
  if (entry.lastCorrect === true) return 'correct';
  if (entry.wrong > entry.correct) return 'wrong';
  if (entry.correct > 0) return 'correct';
  return 'unanswered';
}

export function getQuestionStatus(questionId, progress, skippedIds = []) {
  const skipped = skippedIds instanceof Set ? skippedIds : new Set(skippedIds);
  if (skipped.has(questionId)) return 'skipped';
  return getHistoricalQuestionStatus(questionId, progress);
}

export function getQuestionViewState(
  question,
  {
    progress,
    skippedIds = [],
    starredIds = [],
    completedIds = [],
    passState = null,
  } = {}
) {
  const skippedSet = skippedIds instanceof Set ? skippedIds : new Set(skippedIds);
  const starredSet = starredIds instanceof Set ? starredIds : new Set(starredIds);
  const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds);
  const queueIds = getPracticeQueueQuestionIds(passState);
  const pendingIds = getPendingPracticeQueueIds(passState);

  return {
    question,
    status: getQuestionStatus(question.id, progress, skippedSet),
    historyStatus: getHistoricalQuestionStatus(question.id, progress),
    isStarred: starredSet.has(question.id),
    isCompleted: completedSet.has(question.id),
    isInCurrentPass: queueIds.includes(question.id),
    isPendingInPass: pendingIds.includes(question.id),
  };
}

export function buildQuestionRows(questions, options = {}) {
  return questions.map((question) => getQuestionViewState(question, options));
}

export function getQuestionStatusCounts(rows) {
  const next = { all: rows.length, starred: 0, completed: 0, unanswered: 0, correct: 0, wrong: 0, skipped: 0 };

  for (const row of rows) {
    if (row.isStarred) next.starred += 1;
    if (row.isCompleted) next.completed += 1;
    next[row.status] += 1;
  }

  return next;
}

export function getPassScopeQuestions(questions, passState) {
  const queueIds = getPracticeQueueQuestionIds(passState);
  if (!queueIds.length) return questions;

  const byId = new Map(questions.map((question) => [question.id, question]));
  return queueIds.map((id) => byId.get(id)).filter(Boolean);
}

export function getSkippedQuestionIdsForPass(passState) {
  return getSkippedPracticeQueueIds(passState);
}
