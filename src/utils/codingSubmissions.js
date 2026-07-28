const STORAGE_KEY = 'js-mcq-coding-submissions';
const MAX_HISTORY = 50;

export const EMPTY_CODING_SUBMISSIONS = {
  byQuestion: {},
};

function normalizeEntry(entry) {
  return {
    draft: entry?.draft ?? '',
    history: Array.isArray(entry?.history) ? entry.history : [],
  };
}

export function loadCodingSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { ...EMPTY_CODING_SUBMISSIONS };
}

export function saveCodingSubmissions(submissions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch { /* ignore */ }
}

export function getQuestionSubmissions(submissions, questionId) {
  return normalizeEntry(submissions.byQuestion[String(questionId)]);
}

export function getInitialCode(submissions, question) {
  const entry = getQuestionSubmissions(submissions, question.id);
  if (entry.draft) return entry.draft;
  if (entry.history.length > 0) return entry.history[0].code;
  return question.template;
}

export function saveCodingDraft(submissions, questionId, code) {
  const id = String(questionId);
  const entry = getQuestionSubmissions(submissions, questionId);
  const byQuestion = {
    ...submissions.byQuestion,
    [id]: {
      ...entry,
      draft: code,
    },
  };
  const next = { ...submissions, byQuestion };
  saveCodingSubmissions(next);
  return next;
}

export function recordCodingSubmission(submissions, questionId, code, { passed, passedCount, totalCount }) {
  const id = String(questionId);
  const entry = getQuestionSubmissions(submissions, questionId);
  const submission = {
    ts: Date.now(),
    code,
    passed,
    passedCount,
    totalCount,
  };
  const history = [submission, ...entry.history].slice(0, MAX_HISTORY);
  const byQuestion = {
    ...submissions.byQuestion,
    [id]: {
      draft: code,
      history,
    },
  };
  const next = { ...submissions, byQuestion };
  saveCodingSubmissions(next);
  return next;
}
