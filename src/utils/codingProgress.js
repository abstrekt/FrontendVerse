import { shuffle } from './shuffle.js';
import { filterExcludedCompleted } from './completed.js';
import { todayKey, updateStreak } from './streak.js';
import { reconcileStored } from '../hooks/useLocalStorage.js';

const MAX_SESSIONS = 30;

export const EMPTY_CODING_PROGRESS = {
  sessions: [],
  answers: {},
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    streakDays: 0,
    lastPlayedDate: null,
  },
};

const STORAGE_KEY = 'js-mcq-coding-progress';

export function loadCodingProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = reconcileStored(JSON.parse(raw), EMPTY_CODING_PROGRESS);
      // `stats` is nested, so the shallow merge above can still leave it stale.
      return { ...stored, stats: { ...EMPTY_CODING_PROGRESS.stats, ...stored.stats } };
    }
  } catch { /* fall through to defaults */ }
  return { ...EMPTY_CODING_PROGRESS };
}

export function saveCodingProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Could not persist coding progress to localStorage.', err);
  }
}

export function recordCodingAnswer(progress, questionId, correct) {
  const id = String(questionId);
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

export function recordCodingSession(progress, sessionMeta) {
  const session = { ts: Date.now(), ...sessionMeta };
  const sessions = [session, ...progress.sessions].slice(0, MAX_SESSIONS);
  return { ...progress, sessions };
}

export function getCodingStats(progress) {
  const lifetimeAccuracy = progress.stats.totalAnswered
    ? Math.round((progress.stats.totalCorrect / progress.stats.totalAnswered) * 100)
    : null;
  const bestPct = progress.sessions.length
    ? Math.max(...progress.sessions.map((s) => s.pct))
    : null;
  return { lifetimeAccuracy, sessionCount: progress.sessions.length, bestPct };
}

export function buildCodingQueue(pool, completed, { includeCompleted = true, section = 'coding' } = {}) {
  const source = includeCompleted
    ? pool
    : filterExcludedCompleted(pool, section, completed);
  return shuffle(source);
}
