import { shuffle } from './shuffle';
import { filterExcludedCompleted } from './completed';
import { todayKey, updateStreak } from './streak';

export const EMPTY_OUTPUT_PROGRESS = {
  sessions: [],
  answers: {},
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    streakDays: 0,
    lastPlayedDate: null,
  },
};

export function filterExcludedOutputQuestions(pool, excludedIds) {
  const excluded = excludedIds instanceof Set ? excludedIds : new Set(excludedIds);
  return pool.filter((q) => !excluded.has(q.id));
}

export function isOutputQuestionCompleted(progress, questionId) {
  return progress.answers[String(questionId)]?.lastCorrect === true;
}

export function getOutputCompletedIds(progress) {
  return Object.entries(progress.answers)
    .filter(([, entry]) => entry.lastCorrect === true)
    .map(([id]) => Number(id));
}

export function getOutputCompletedCount(progress) {
  return getOutputCompletedIds(progress).length;
}

export function buildOutputQueue(pool, completed, { includeCompleted = true, section = 'output' } = {}) {
  const source = includeCompleted
    ? pool
    : filterExcludedCompleted(pool, section, completed);
  return shuffle(source);
}

const MAX_SESSIONS = 30;

export function recordOutputAnswer(progress, question, correct) {
  const id = String(question.id);
  const prev = progress.answers[id] || {
    correct: 0,
    wrong: 0,
    lastSeen: 0,
    lastCorrect: null,
  };

  const now = Date.now();
  const answers = {
    ...progress.answers,
    [id]: {
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      lastSeen: now,
      lastCorrect: correct,
    },
  };

  const stats = {
    ...progress.stats,
    totalAnswered: progress.stats.totalAnswered + 1,
    totalCorrect: progress.stats.totalCorrect + (correct ? 1 : 0),
    lastPlayedDate: todayKey(),
    streakDays: updateStreak(progress.stats),
  };

  return { ...progress, answers, stats };
}

export function recordOutputSession(progress, sessionMeta) {
  const session = {
    ts: Date.now(),
    ...sessionMeta,
  };

  const sessions = [session, ...progress.sessions].slice(0, MAX_SESSIONS);
  return { ...progress, sessions };
}

export function getOutputBestPct(sessions) {
  if (!sessions.length) return null;
  return Math.max(...sessions.map((s) => s.pct));
}

export function getOutputLifetimeAccuracy(stats) {
  if (!stats.totalAnswered) return null;
  return Math.round((stats.totalCorrect / stats.totalAnswered) * 100);
}

export function getOutputMissedCount(progress) {
  return Object.entries(progress.answers)
    .filter(([, entry]) => entry.lastCorrect === false || entry.wrong > entry.correct)
    .length;
}
