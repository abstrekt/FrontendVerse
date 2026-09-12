import { shuffle } from './shuffle.js';
import { todayKey, updateStreak } from './streak.js';

export const EMPTY_PROGRESS = {
  sessions: [],
  answers: {},
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    streakDays: 0,
    lastPlayedDate: null,
  },
};

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'advance'];

export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  advance: 'Advanced',
  hard: 'Hard',
};

export function filterQuestions(questions, { topics = [], difficulties = [] } = {}) {
  return questions.filter((q) => {
    const topicOk =
      topics.length === 0 ||
      topics.some((t) => (q.topics || []).includes(t));
    const diffOk =
      difficulties.length === 0 ||
      difficulties.includes(q.difficulty);
    return topicOk && diffOk;
  });
}

const MAX_SESSIONS = 30;
const WEAK_THRESHOLD = 70;
const MIN_TOPIC_SAMPLES = 3;

export function recordAnswer(progress, question, correct) {
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

export function recordSession(progress, sessionMeta) {
  const session = {
    ts: Date.now(),
    ...sessionMeta,
  };

  const sessions = [session, ...progress.sessions].slice(0, MAX_SESSIONS);
  return { ...progress, sessions };
}

export function getTopicCompletion(progress, questions, completedIds = null) {
  const topicMap = new Map();
  const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds ?? []);

  for (const q of questions) {
    const topics = q.topics?.length ? q.topics : ['untagged'];
    const answered = Boolean(progress?.answers?.[String(q.id)]) || completedSet.has(q.id);

    for (const topic of topics) {
      const prev = topicMap.get(topic) || { attempted: 0, total: 0 };
      topicMap.set(topic, {
        attempted: prev.attempted + (answered ? 1 : 0),
        total: prev.total + 1,
      });
    }
  }

  for (const [topic, { attempted, total }] of topicMap) {
    topicMap.set(topic, {
      attempted,
      total,
      pct: total > 0 ? Math.round((attempted / total) * 100) : 0,
    });
  }

  return topicMap;
}

export function getDifficultyCompletion(progress, questions, completedIds = null) {
  const diffMap = new Map(
    DIFFICULTY_LEVELS.map((difficulty) => [difficulty, { attempted: 0, total: 0, pct: 0 }])
  );
  const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds ?? []);

  for (const q of questions) {
    const difficulty = q.difficulty;
    if (!diffMap.has(difficulty)) continue;

    const answered = Boolean(progress?.answers?.[String(q.id)]) || completedSet.has(q.id);
    const prev = diffMap.get(difficulty);
    diffMap.set(difficulty, {
      attempted: prev.attempted + (answered ? 1 : 0),
      total: prev.total + 1,
    });
  }

  for (const [difficulty, { attempted, total }] of diffMap) {
    diffMap.set(difficulty, {
      attempted,
      total,
      pct: total > 0 ? Math.round((attempted / total) * 100) : 0,
    });
  }

  return diffMap;
}

export function getTopicAccuracy(progress, questions) {
  const topicMap = {};

  for (const q of questions) {
    const entry = progress.answers[String(q.id)];
    if (!entry) continue;

    const topics = q.topics?.length ? q.topics : ['untagged'];
    for (const topic of topics) {
      if (!topicMap[topic]) {
        topicMap[topic] = { topic, correct: 0, total: 0 };
      }
      topicMap[topic].correct += entry.correct;
      topicMap[topic].total += entry.correct + entry.wrong;
    }
  }

  return Object.values(topicMap)
    .map(({ topic, correct, total }) => ({
      topic,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total);
}

export function getWeakTopics(progress, questions, limit = 3) {
  return getTopicAccuracy(progress, questions)
    .filter((t) => t.total >= MIN_TOPIC_SAMPLES && t.pct < WEAK_THRESHOLD)
    .slice(0, limit);
}

export function getMissedQuestionIds(progress) {
  return Object.entries(progress.answers)
    .filter(([, entry]) => entry.lastCorrect === false || entry.wrong > entry.correct)
    .map(([id]) => Number(id));
}

/** @returns {'correct' | 'wrong' | 'skipped' | 'unanswered'} */
export function getQuestionStatus(questionId, progress, skippedIds = []) {
  const skipped = skippedIds instanceof Set ? skippedIds : new Set(skippedIds);
  if (skipped.has(questionId)) return 'skipped';

  const entry = progress?.answers?.[String(questionId)];
  if (!entry) return 'unanswered';
  if (entry.lastCorrect === false) return 'wrong';
  if (entry.lastCorrect === true) return 'correct';
  if (entry.wrong > entry.correct) return 'wrong';
  if (entry.correct > 0) return 'correct';
  return 'unanswered';
}

/**
 * Best session score, ignoring records without one.
 *
 * `Math.max` over a list containing a single `undefined` returns NaN,
 * which reached the sidebar as the literal string "NaN%". Sessions
 * stored before `pct` existed are still in some users' localStorage.
 */
export function getBestPct(sessions) {
  const pcts = sessions.map((s) => s.pct).filter((pct) => Number.isFinite(pct));
  if (!pcts.length) return null;
  return Math.max(...pcts);
}

export function getLifetimeAccuracy(stats) {
  if (!stats.totalAnswered) return null;
  return Math.round((stats.totalCorrect / stats.totalAnswered) * 100);
}

export function getQuestionsForWeakTopics(questions, weakTopics) {
  if (!weakTopics.length) return [];
  const weakSet = new Set(weakTopics.map((t) => t.topic));
  return questions.filter((q) =>
    (q.topics || []).some((t) => weakSet.has(t))
  );
}

export function getQuestionsForReview(questions, progress) {
  const missedIds = new Set(getMissedQuestionIds(progress));
  return questions.filter((q) => missedIds.has(q.id));
}

function questionWeight(question, progress) {
  const entry = progress.answers[String(question.id)];
  if (!entry) return 4;

  if (entry.lastCorrect === false) return 5;
  if (entry.wrong > entry.correct) return 4;

  const daysSince =
    (Date.now() - entry.lastSeen) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) return 3;
  if (daysSince > 3) return 2;

  const accuracy = entry.correct / (entry.correct + entry.wrong);
  if (accuracy < 0.5) return 3;
  if (accuracy < 0.8) return 2;
  return 1;
}

export function smartShuffle(pool, progress) {
  if (!pool.length) return [];

  const buckets = new Map();
  for (const q of pool) {
    const w = questionWeight(q, progress);
    if (!buckets.has(w)) buckets.set(w, []);
    buckets.get(w).push(q);
  }

  const weights = [...buckets.keys()].sort((a, b) => b - a);
  const result = [];

  for (const w of weights) {
    result.push(...shuffle(buckets.get(w)));
  }

  return result;
}
