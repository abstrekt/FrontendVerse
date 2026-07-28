import { shuffle } from './shuffle';

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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function updateStreak(stats) {
  const today = todayKey();
  const yesterday = yesterdayKey();
  const last = stats.lastPlayedDate;
  if (last === today) return stats.streakDays;
  if (last === yesterday) return stats.streakDays + 1;
  return 1;
}

export function loadCodingProgress() {
  try {
    const raw = localStorage.getItem('js-mcq-coding-progress');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { ...EMPTY_CODING_PROGRESS };
}

export function saveCodingProgress(progress) {
  try {
    localStorage.setItem('js-mcq-coding-progress', JSON.stringify(progress));
  } catch { /* ignore */ }
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

export function buildCodingQueue(pool) {
  return shuffle(pool);
}
