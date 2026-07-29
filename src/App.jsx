import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import LearningsView from './components/LearningsView';
import LearningsPanel from './components/LearningsPanel';
import CodingPanel from './components/CodingPanel';
import QuizQuestion from './components/QuizQuestion';
import QuestionListView from './components/QuestionListView';
import Results from './components/Results';
import MobileProgressBar from './components/MobileProgressBar';
import OutputQuizQuestion from './components/OutputQuizQuestion';
import OutputResults from './components/OutputResults';
import CodingChallenge from './components/CodingChallenge';
import CodingResults from './components/CodingResults';
import ArchivedView from './components/ArchivedView';
import CommandPalette from './components/CommandPalette';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAppRoute } from './hooks/useAppRoute';
import {
  EMPTY_PROGRESS,
  EMPTY_SESSION,
  createSession,
  restoreQueue,
  isRestorableSession,
  sanitizeSessionQueue,
  filterExcludedQuestions,
  filterQuestions,
  recordAnswer,
  recordSession,
  getWeakTopics,
  getMissedQuestionIds,
  getQuestionsForWeakTopics,
  getQuestionsForReview,
  getBestPct,
  getLifetimeAccuracy,
  smartShuffle,
} from './utils/progress';
import {
  EMPTY_OUTPUT_PROGRESS,
  EMPTY_OUTPUT_SESSION,
  createOutputSession,
  restoreOutputQueue,
  isRestorableOutputSession,
  buildOutputQueue,
  recordOutputAnswer,
  recordOutputSession,
  getOutputBestPct,
  getOutputLifetimeAccuracy,
  getOutputMissedCount,
} from './utils/outputProgress';
import questionsData from '../questions.json';
import learningsData from '../data/learnings.json';
import polyfillLearningsData from '../data/polyfill-learnings.json';
import tekionInterviewLearningsData from '../data/tekion-interview-learnings.json';
import wtfjsLearningsData from '../data/wtfjs-learnings.json';
import reactLearningsData from '../data/react-learnings.json';
import hldLearningsData from '../data/hld-learnings.json';
import algorithmLearningsData from '../data/algorithm-learnings.json';
import devtoInterviewLearningsData from '../data/devto-interview-learnings.json';
import seniorFrontendLearningsData from '../data/senior-frontend-learnings.json';
import outputQuestionsData from '../data/output-questions.json';
import scopeOutputQuestionsData from '../data/scope-output-questions.json';
import codingQuestionsData from '../data/coding-questions.json';
import {
  EMPTY_CODING_PROGRESS,
  loadCodingProgress,
  saveCodingProgress,
  recordCodingAnswer,
  recordCodingSession,
  getCodingStats,
  buildCodingQueue,
} from './utils/codingProgress';
import {
  EMPTY_ARCHIVED,
  filterActive,
  archiveId,
  unarchiveId,
  getArchivedSet,
  getArchivedCount,
  sanitizeQueueIds,
} from './utils/archive';
import {
  EMPTY_STARRED,
  EMPTY_STARRED_FILTER,
  filterStarred,
  isStarred,
  toggleStarId,
  getStarredCount,
} from './utils/starred';
import {
  EMPTY_COMPLETED,
  isCompleted,
  markCompletedId,
  toggleCompletedId,
  getCompletedCount,
  getCompletedSet,
  syncCompletedFromProgress,
  syncOutputCompletedFromProgress,
} from './utils/completed';
import StarredFilterToggle from './components/StarredFilterToggle';
import { buildSearchIndex } from './utils/searchIndex';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [reactLearnings, setReactLearnings] = useState([]);
  const [hldLearnings, setHldLearnings] = useState([]);
  const [algorithmLearnings, setAlgorithmLearnings] = useState([]);
  const [outputQuestions, setOutputQuestions] = useState([]);
  const [outputSourceUrl, setOutputSourceUrl] = useState('');
  const { route, navigate, setSection, setViewMode, setLearningId, setReactLearningId, setHldLearningId, setAlgorithmLearningId } = useAppRoute();
  const activeSection = route.section;
  const viewMode = route.viewMode;

  const [theme, setTheme] = useLocalStorage('quiz-theme', 'light');
  const [syntaxHighlight, setSyntaxHighlight] = useLocalStorage('quiz-syntax', true);
  const [progress, setProgress] = useLocalStorage('quiz-progress', EMPTY_PROGRESS);
  const [quizSession, setQuizSession] = useLocalStorage('quiz-session', EMPTY_SESSION);
  const [skippedIds, setSkippedIds] = useLocalStorage('quiz-skipped', []);
  const [outputProgress, setOutputProgress] = useLocalStorage('output-quiz-progress', EMPTY_OUTPUT_PROGRESS);
  const [outputSession, setOutputSession] = useLocalStorage('output-quiz-session', EMPTY_OUTPUT_SESSION);
  const [outputIncludeCompleted, setOutputIncludeCompleted] = useLocalStorage('output-quiz-include-completed', true);
  const [mcqIncludeCompleted, setMcqIncludeCompleted] = useLocalStorage('mcq-include-completed', true);
  const [codingIncludeCompleted, setCodingIncludeCompleted] = useLocalStorage('coding-include-completed', true);
  const [completed, setCompleted] = useLocalStorage('quiz-completed', EMPTY_COMPLETED);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('layout-sidebar-collapsed', false);
  const [panelCollapsed, setPanelCollapsed] = useLocalStorage('layout-panel-collapsed', false);
  const [codingProgress, setCodingProgress] = useState(() => loadCodingProgress());
  const [codingSession, setCodingSession] = useLocalStorage('coding-quiz-session', null);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [archived, setArchived] = useLocalStorage('quiz-archived', EMPTY_ARCHIVED);
  const [starred, setStarred] = useLocalStorage('quiz-starred', EMPTY_STARRED);
  const [starredFilter, setStarredFilter] = useLocalStorage('quiz-starred-filter', EMPTY_STARRED_FILTER);
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const completedSyncedRef = useRef(false);

  const activeQuestions = useMemo(
    () => filterActive(questions, 'mcq', archived),
    [questions, archived]
  );
  const activeLearnings = useMemo(
    () => filterActive(learnings, 'learnings', archived),
    [learnings, archived]
  );
  const activeReactLearnings = useMemo(
    () => filterActive(reactLearnings, 'react-learnings', archived),
    [reactLearnings, archived]
  );
  const activeHldLearnings = useMemo(
    () => filterActive(hldLearnings, 'hld', archived),
    [hldLearnings, archived]
  );
  const activeAlgorithmLearnings = useMemo(
    () => filterActive(algorithmLearnings, 'algorithm', archived),
    [algorithmLearnings, archived]
  );
  const activeCodingQuestions = useMemo(
    () => filterActive(codingQuestions, 'coding', archived),
    [codingQuestions, archived]
  );
  const activeOutputQuestions = useMemo(
    () => filterActive(outputQuestions, 'output', archived),
    [outputQuestions, archived]
  );
  const archivedCount = useMemo(() => getArchivedCount(archived), [archived]);
  const archivedMcqSet = useMemo(() => getArchivedSet(archived, 'mcq'), [archived]);
  const mcqExcludedSet = useMemo(
    () => new Set([...skippedIds, ...archivedMcqSet]),
    [skippedIds, archivedMcqSet]
  );

  const starredActiveQuestions = useMemo(
    () => (starredFilter.mcq ? filterStarred(activeQuestions, 'mcq', starred) : activeQuestions),
    [activeQuestions, starredFilter.mcq, starred]
  );
  const starredActiveLearnings = useMemo(
    () => (starredFilter.learnings ? filterStarred(activeLearnings, 'learnings', starred) : activeLearnings),
    [activeLearnings, starredFilter.learnings, starred]
  );
  const starredActiveReactLearnings = useMemo(
    () => (starredFilter['react-learnings'] ? filterStarred(activeReactLearnings, 'react-learnings', starred) : activeReactLearnings),
    [activeReactLearnings, starredFilter, starred]
  );
  const starredActiveHldLearnings = useMemo(
    () => (starredFilter.hld ? filterStarred(activeHldLearnings, 'hld', starred) : activeHldLearnings),
    [activeHldLearnings, starredFilter.hld, starred]
  );
  const starredActiveAlgorithmLearnings = useMemo(
    () => (starredFilter.algorithm ? filterStarred(activeAlgorithmLearnings, 'algorithm', starred) : activeAlgorithmLearnings),
    [activeAlgorithmLearnings, starredFilter.algorithm, starred]
  );
  const starredActiveCodingQuestions = useMemo(
    () => (starredFilter.coding ? filterStarred(activeCodingQuestions, 'coding', starred) : activeCodingQuestions),
    [activeCodingQuestions, starredFilter.coding, starred]
  );
  const starredActiveOutputQuestions = useMemo(
    () => (starredFilter.output ? filterStarred(activeOutputQuestions, 'output', starred) : activeOutputQuestions),
    [activeOutputQuestions, starredFilter.output, starred]
  );
  const mcqStarredCount = useMemo(() => getStarredCount(starred, 'mcq'), [starred]);
  const mcqCompletedCount = useMemo(() => getCompletedCount(completed, 'mcq'), [completed]);
  const codingCompletedCount = useMemo(() => getCompletedCount(completed, 'coding'), [completed]);
  const outputCompletedCount = useMemo(() => getCompletedCount(completed, 'output'), [completed]);
  const learningsStarredCount = useMemo(() => getStarredCount(starred, 'learnings'), [starred]);
  const reactLearningsStarredCount = useMemo(() => getStarredCount(starred, 'react-learnings'), [starred]);
  const hldStarredCount = useMemo(() => getStarredCount(starred, 'hld'), [starred]);
  const algorithmStarredCount = useMemo(() => getStarredCount(starred, 'algorithm'), [starred]);
  const codingStarredCount = useMemo(() => getStarredCount(starred, 'coding'), [starred]);
  const outputStarredCount = useMemo(() => getStarredCount(starred, 'output'), [starred]);

  const searchDocs = useMemo(
    () =>
      buildSearchIndex({
        mcq: activeQuestions,
        learnings: activeLearnings,
        reactLearnings: activeReactLearnings,
        hld: activeHldLearnings,
        algorithm: activeAlgorithmLearnings,
        coding: activeCodingQuestions,
        output: activeOutputQuestions,
      }),
    [
      activeQuestions,
      activeLearnings,
      activeReactLearnings,
      activeHldLearnings,
      activeAlgorithmLearnings,
      activeCodingQuestions,
      activeOutputQuestions,
    ]
  );

  const sessionRecordedRef = useRef(false);
  const outputSessionRecordedRef = useRef(false);
  const codingSessionRecordedRef = useRef(false);

  const shuffled = useMemo(
    () => restoreQueue(quizSession, starredActiveQuestions),
    [quizSession, starredActiveQuestions]
  );
  const sessionAnsweredIds = useMemo(
    () => new Set(quizSession?.answeredIds ?? []),
    [quizSession]
  );
  const score = quizSession?.score ?? 0;
  const answered = quizSession?.answered ?? 0;
  const currentIndex = quizSession?.currentIndex ?? 0;
  const mode = quizSession?.mode ?? 'all';
  const selectedTopics = quizSession?.selectedTopics ?? [];
  const selectedDifficulties = quizSession?.selectedDifficulties ?? [];
  const sessionTotal = quizSession?.sessionTotal ?? 0;
  const remaining = shuffled.length - currentIndex;

  const outputShuffled = useMemo(
    () => restoreOutputQueue(outputSession, starredActiveOutputQuestions),
    [outputSession, starredActiveOutputQuestions]
  );
  const outputScore = outputSession?.score ?? 0;
  const outputAnswered = outputSession?.answered ?? 0;
  const outputCurrentIndex = outputSession?.currentIndex ?? 0;
  const outputSessionTotal = outputSession?.sessionTotal ?? 0;
  const outputRemaining = outputShuffled.length - outputCurrentIndex;
  const currentOutputQuestion = outputShuffled.length > 0 ? outputShuffled[outputCurrentIndex] : null;
  const isOutputFinished = outputShuffled.length > 0 && outputCurrentIndex >= outputShuffled.length;
  const outputSessionCaughtUp =
    starredActiveOutputQuestions.length > 0 && outputShuffled.length === 0;

  const codingShuffled = useMemo(
    () => {
      if (!codingSession?.queueIds || !starredActiveCodingQuestions.length) return [];
      const byId = new Map(starredActiveCodingQuestions.map((q) => [q.id, q]));
      return codingSession.queueIds.map((id) => byId.get(id)).filter(Boolean);
    },
    [codingSession, starredActiveCodingQuestions]
  );
  const codingScore = codingSession?.score ?? 0;
  const codingAnswered = codingSession?.answered ?? 0;
  const codingCurrentIndex = codingSession?.currentIndex ?? 0;
  const codingSessionTotal = codingSession?.sessionTotal ?? 0;
  const codingRemaining = codingShuffled.length - codingCurrentIndex;
  const currentCodingQuestion = codingShuffled.length > 0 ? codingShuffled[codingCurrentIndex] : null;
  const isCodingFinished = codingShuffled.length > 0 && codingCurrentIndex >= codingShuffled.length;
  const codingSessionCaughtUp =
    starredActiveCodingQuestions.length > 0 && codingShuffled.length === 0;

  const selectedLearning = useMemo(() => {
    if (activeSection !== 'learnings') return null;
    if (route.learningId) {
      return starredActiveLearnings.find((item) => item.id === route.learningId) ?? starredActiveLearnings[0] ?? null;
    }
    return starredActiveLearnings[0] ?? null;
  }, [starredActiveLearnings, route.learningId, activeSection]);

  const selectedReactLearning = useMemo(() => {
    if (activeSection !== 'react-learnings') return null;
    if (route.learningId) {
      return starredActiveReactLearnings.find((item) => item.id === route.learningId) ?? starredActiveReactLearnings[0] ?? null;
    }
    return starredActiveReactLearnings[0] ?? null;
  }, [starredActiveReactLearnings, route.learningId, activeSection]);

  const selectedHldLearning = useMemo(() => {
    if (activeSection !== 'hld') return null;
    if (route.learningId) {
      return starredActiveHldLearnings.find((item) => item.id === route.learningId) ?? starredActiveHldLearnings[0] ?? null;
    }
    return starredActiveHldLearnings[0] ?? null;
  }, [starredActiveHldLearnings, route.learningId, activeSection]);

  const selectedAlgorithmLearning = useMemo(() => {
    if (activeSection !== 'algorithm') return null;
    if (route.learningId) {
      return starredActiveAlgorithmLearnings.find((item) => item.id === route.learningId) ?? starredActiveAlgorithmLearnings[0] ?? null;
    }
    return starredActiveAlgorithmLearnings[0] ?? null;
  }, [starredActiveAlgorithmLearnings, route.learningId, activeSection]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      navigate('/mcq', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (activeSection !== 'learnings' || !starredActiveLearnings.length) return;
    if (route.learningId && !starredActiveLearnings.some((item) => item.id === route.learningId)) {
      setLearningId(starredActiveLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, starredActiveLearnings, setLearningId]);

  useEffect(() => {
    if (activeSection !== 'react-learnings' || !starredActiveReactLearnings.length) return;
    if (route.learningId && !starredActiveReactLearnings.some((item) => item.id === route.learningId)) {
      setReactLearningId(starredActiveReactLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, starredActiveReactLearnings, setReactLearningId]);

  useEffect(() => {
    if (activeSection !== 'hld' || !starredActiveHldLearnings.length) return;
    if (route.learningId && !starredActiveHldLearnings.some((item) => item.id === route.learningId)) {
      setHldLearningId(starredActiveHldLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, starredActiveHldLearnings, setHldLearningId]);

  useEffect(() => {
    if (activeSection !== 'algorithm' || !starredActiveAlgorithmLearnings.length) return;
    if (route.learningId && !starredActiveAlgorithmLearnings.some((item) => item.id === route.learningId)) {
      setAlgorithmLearningId(starredActiveAlgorithmLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, starredActiveAlgorithmLearnings, setAlgorithmLearningId]);

  const weakTopics = useMemo(
    () => getWeakTopics(progress, activeQuestions),
    [progress, activeQuestions]
  );

  const missedCount = useMemo(
    () => getMissedQuestionIds(progress).length,
    [progress]
  );

  const filteredQuestions = useMemo(
    () => filterQuestions(starredActiveQuestions, { topics: selectedTopics, difficulties: selectedDifficulties }),
    [starredActiveQuestions, selectedTopics, selectedDifficulties]
  );

  const basePool = useMemo(() => {
    if (mode === 'weak') {
      const weakPool = getQuestionsForWeakTopics(starredActiveQuestions, weakTopics);
      return filterQuestions(weakPool, { topics: selectedTopics, difficulties: selectedDifficulties });
    }
    if (mode === 'review') {
      const reviewPool = getQuestionsForReview(starredActiveQuestions, progress);
      return filterQuestions(reviewPool, { topics: selectedTopics, difficulties: selectedDifficulties });
    }
    return filteredQuestions;
  }, [mode, starredActiveQuestions, weakTopics, progress, filteredQuestions, selectedTopics, selectedDifficulties]);

  const currentQuestion = shuffled.length > 0 ? shuffled[currentIndex] : null;
  const isFinished = shuffled.length > 0 && currentIndex >= shuffled.length;
  const sessionCaughtUp =
    basePool.length > 0 && shuffled.length === 0 && sessionAnsweredIds.size > 0;

  const shufflePool = useCallback(
    (pool, answeredIds, progressOverride = progress, excludedIds = mcqExcludedSet, includeCompleted = mcqIncludeCompleted) => {
      const source = pool.length > 0 ? pool : starredActiveQuestions;
      const completedExcluded = includeCompleted
        ? []
        : [...getCompletedSet(completed, 'mcq')];
      const excluded = new Set([...answeredIds, ...excludedIds, ...completedExcluded]);
      const unanswered = filterExcludedQuestions(source, excluded);
      return {
        queue: unanswered.length > 0 ? smartShuffle(unanswered, progressOverride) : [],
        allAnswered: source.length > 0 && unanswered.length === 0,
      };
    },
    [starredActiveQuestions, progress, mcqExcludedSet, mcqIncludeCompleted, completed]
  );

  const buildOutputQuizQueue = useCallback(
    (pool, includeCompleted = outputIncludeCompleted) => {
      const source = pool.length > 0 ? pool : starredActiveOutputQuestions;
      return buildOutputQueue(source, completed, { includeCompleted });
    },
    [starredActiveOutputQuestions, completed, outputIncludeCompleted]
  );

  const removeFromSessionQueue = useCallback((session, id) => {
    if (!session) return session;
    const queueIds = session.queueIds.filter((qid) => qid !== id);
    const currentIndex = Math.min(session.currentIndex, Math.max(queueIds.length - 1, 0));
    return { ...session, queueIds, currentIndex };
  }, []);

  useEffect(() => {
    const allQuestions = questionsData.questions;
    const allLearnings = [
      ...learningsData.learnings,
      ...polyfillLearningsData.learnings,
      ...tekionInterviewLearningsData.learnings,
      ...wtfjsLearningsData.learnings,
      ...devtoInterviewLearningsData.learnings,
      ...seniorFrontendLearningsData.learnings,
    ];
    const allOutputQuestions = [
      ...outputQuestionsData.questions,
      ...scopeOutputQuestionsData.questions,
    ];
    const allCodingQuestions = codingQuestionsData.questions;
    setQuestions(allQuestions);
    setLearnings(allLearnings);
    setReactLearnings(reactLearningsData.learnings);
    setHldLearnings(hldLearningsData.learnings);
    setAlgorithmLearnings(algorithmLearningsData.learnings);
    setOutputQuestions(allOutputQuestions);
    setOutputSourceUrl(outputQuestionsData.source);
    setCodingQuestions(allCodingQuestions);

    const activeMcq = filterActive(allQuestions, 'mcq', archived);
    const activeOutput = filterActive(allOutputQuestions, 'output', archived);
    const activeCoding = filterActive(allCodingQuestions, 'coding', archived);
    const starredMcq = starredFilter.mcq ? filterStarred(activeMcq, 'mcq', starred) : activeMcq;
    const starredOutput = starredFilter.output ? filterStarred(activeOutput, 'output', starred) : activeOutput;
    const starredCoding = starredFilter.coding ? filterStarred(activeCoding, 'coding', starred) : activeCoding;

    setQuizSession((saved) => {
      let sanitized = sanitizeSessionQueue(saved, skippedIds);
      if (sanitized?.queueIds) {
        const queueIds = sanitizeQueueIds(sanitized.queueIds, 'mcq', archived);
        const currentIndex = Math.min(sanitized.currentIndex, Math.max(queueIds.length - 1, 0));
        sanitized = { ...sanitized, queueIds, currentIndex };
      }
      if (isRestorableSession(sanitized, starredMcq)) {
        return sanitized;
      }
      const { queue } = shufflePool(starredMcq, new Set(), progress, mcqExcludedSet);
      return createSession({ queue, mode: 'all', topics: [], difficulties: [] });
    });

    setOutputSession((saved) => {
      let session = saved;
      if (session?.queueIds) {
        const queueIds = sanitizeQueueIds(session.queueIds, 'output', archived);
        const currentIndex = Math.min(session.currentIndex, Math.max(queueIds.length - 1, 0));
        session = { ...session, queueIds, currentIndex };
      }
      if (isRestorableOutputSession(session, starredOutput)) {
        return session;
      }
      const queue = buildOutputQueue(starredOutput, completed, {
        includeCompleted: outputIncludeCompleted,
      });
      return createOutputSession({ queue });
    });

    setCodingSession((saved) => {
      let session = saved;
      if (session?.queueIds) {
        const queueIds = sanitizeQueueIds(session.queueIds, 'coding', archived);
        const currentIndex = Math.min(session.currentIndex, Math.max(queueIds.length - 1, 0));
        session = { ...session, queueIds, currentIndex };
      }
      if (session?.queueIds?.length && starredCoding.length) {
        const byId = new Map(starredCoding.map((q) => [q.id, q]));
        const restored = session.queueIds.map((id) => byId.get(id)).filter(Boolean);
        if (restored.length > 0 && session.currentIndex < restored.length) return session;
      }
      const queue = buildCodingQueue(starredCoding, completed, {
        includeCompleted: codingIncludeCompleted,
      });
      return {
        answeredIds: [],
        score: 0,
        answered: 0,
        currentIndex: 0,
        queueIds: queue.map((q) => q.id),
        sessionTotal: queue.length,
      };
    });

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (completedSyncedRef.current) return;
    completedSyncedRef.current = true;
    setCompleted((prev) => {
      let next = syncOutputCompletedFromProgress(prev, outputProgress);
      next = syncCompletedFromProgress(next, 'mcq', progress);
      next = syncCompletedFromProgress(next, 'coding', codingProgress);
      return next;
    });
  }, [outputProgress, progress, codingProgress, setCompleted]);

  useEffect(() => {
    if (!isFinished || sessionRecordedRef.current) return;
    sessionRecordedRef.current = true;

    const pct = sessionTotal > 0 ? Math.round((score / sessionTotal) * 100) : 0;
    setProgress((prev) =>
      recordSession(prev, {
        score,
        total: sessionTotal,
        pct,
        mode,
        topics: selectedTopics,
        difficulties: selectedDifficulties,
        questionIds: quizSession?.queueIds ?? [],
      })
    );
  }, [isFinished, score, sessionTotal, mode, selectedTopics, selectedDifficulties, quizSession, setProgress]);

  useEffect(() => {
    if (!isOutputFinished || outputSessionRecordedRef.current) return;
    outputSessionRecordedRef.current = true;

    const pct = outputSessionTotal > 0 ? Math.round((outputScore / outputSessionTotal) * 100) : 0;
    setOutputProgress((prev) =>
      recordOutputSession(prev, {
        score: outputScore,
        total: outputSessionTotal,
        pct,
        questionIds: outputSession?.queueIds ?? [],
      })
    );
  }, [isOutputFinished, outputScore, outputSessionTotal, outputSession, setOutputProgress]);

  useEffect(() => {
    if (!isCodingFinished || codingSessionRecordedRef.current) return;
    codingSessionRecordedRef.current = true;

    const pct = codingSessionTotal > 0 ? Math.round((codingScore / codingSessionTotal) * 100) : 0;
    setCodingProgress((prev) => {
      const updated = recordCodingSession(prev, {
        score: codingScore,
        total: codingSessionTotal,
        pct,
        questionIds: codingSession?.queueIds ?? [],
      });
      saveCodingProgress(updated);
      return updated;
    });
  }, [isCodingFinished, codingScore, codingSessionTotal, codingSession, setCodingProgress]);

  const applySession = useCallback(
    (pool, nextMode, topics, difficulties, { resetSession = false } = {}) => {
      const answeredIds = resetSession
        ? new Set()
        : new Set(quizSession?.answeredIds ?? []);
      const nextScore = resetSession ? 0 : (quizSession?.score ?? 0);
      const nextAnswered = resetSession ? 0 : (quizSession?.answered ?? 0);
      const nextSessionTotal = resetSession ? undefined : quizSession?.sessionTotal;

      const { queue } = shufflePool(pool, answeredIds);

      setQuizSession(
        createSession({
          queue,
          mode: nextMode,
          topics,
          difficulties,
          score: nextScore,
          answered: nextAnswered,
          answeredIds: [...answeredIds],
          currentIndex: 0,
          sessionTotal: resetSession ? queue.length : nextSessionTotal,
        })
      );
      sessionRecordedRef.current = false;
    },
    [shufflePool, quizSession]
  );

  const startQuiz = useCallback(
    (pool, nextMode = 'all', { resetSession = false, topics = selectedTopics, difficulties = selectedDifficulties } = {}) => {
      applySession(pool, nextMode, topics, difficulties, { resetSession });
    },
    [applySession, selectedTopics, selectedDifficulties]
  );

  const handlePick = useCallback(
    (correct, question) => {
      setQuizSession((session) => {
        if (!session || session.answeredIds.includes(question.id)) return session;
        setProgress((prev) => recordAnswer(prev, question, correct));
        if (correct) {
          setCompleted((prev) => markCompletedId(prev, 'mcq', question.id));
        }
        return {
          ...session,
          answeredIds: [...session.answeredIds, question.id],
          answered: session.answered + 1,
          score: session.score + (correct ? 1 : 0),
        };
      });
    },
    [setProgress, setQuizSession, setCompleted]
  );

  const handleNext = useCallback(() => {
    setQuizSession((session) => {
      if (!session) return session;
      return { ...session, currentIndex: session.currentIndex + 1 };
    });
  }, [setQuizSession]);

  const handleSkip = useCallback(
    (question) => {
      setSkippedIds((ids) => (ids.includes(question.id) ? ids : [...ids, question.id]));
      setQuizSession((session) => {
        if (!session) return session;
        const queueIds = session.queueIds.filter((id) => id !== question.id);
        const currentIndex = Math.min(session.currentIndex, Math.max(queueIds.length - 1, 0));
        return { ...session, queueIds, currentIndex };
      });
    },
    [setSkippedIds, setQuizSession]
  );

  const handleUnskip = useCallback(
    (questionId) => {
      setSkippedIds((ids) => ids.filter((id) => id !== questionId));
      setQuizSession((session) => {
        if (!session) return session;
        if (session.answeredIds.includes(questionId)) return session;
        if (session.queueIds.includes(questionId)) return session;
        return { ...session, queueIds: [...session.queueIds, questionId] };
      });
    },
    [setSkippedIds, setQuizSession]
  );

  const handleRestart = useCallback(() => {
    startQuiz(basePool, mode, { resetSession: true });
  }, [basePool, mode, startQuiz]);

  const handleStartWeak = useCallback(() => {
    const pool = getQuestionsForWeakTopics(starredActiveQuestions, weakTopics);
    startQuiz(pool, 'weak', { resetSession: true, topics: [], difficulties: [] });
  }, [starredActiveQuestions, weakTopics, startQuiz]);

  const handleStartReview = useCallback(() => {
    const pool = getQuestionsForReview(starredActiveQuestions, progress);
    startQuiz(pool, 'review', { resetSession: true, topics: [], difficulties: [] });
  }, [starredActiveQuestions, progress, startQuiz]);

  const handleBackToAll = useCallback(() => {
    startQuiz(filteredQuestions, 'all', { resetSession: true, topics: selectedTopics, difficulties: selectedDifficulties });
  }, [filteredQuestions, selectedTopics, selectedDifficulties, startQuiz]);

  const handleOpenQuestion = useCallback(
    (questionId) => {
      setViewMode('quiz');
      setSkippedIds((ids) => ids.filter((id) => id !== questionId));
      setQuizSession((session) => {
        if (!session) return session;

        const existingIndex = session.queueIds.indexOf(questionId);
        if (existingIndex >= 0) {
          return { ...session, currentIndex: existingIndex };
        }

        const question = starredActiveQuestions.find((q) => q.id === questionId);
        if (!question) return session;

        const insertAt = Math.min(session.currentIndex, session.queueIds.length);
        const queueIds = [
          ...session.queueIds.slice(0, insertAt),
          questionId,
          ...session.queueIds.slice(insertAt),
        ];

        return {
          ...session,
          queueIds,
          currentIndex: insertAt,
          sessionTotal: Math.max(session.sessionTotal, queueIds.length),
        };
      });
    },
    [starredActiveQuestions, setQuizSession, setSkippedIds, setViewMode]
  );

  const jumpToSessionItem = useCallback((setSession, pool, itemId, createSessionFromIds) => {
    setSession((session) => {
      const existingIndex = session?.queueIds?.indexOf(itemId) ?? -1;
      if (existingIndex >= 0) {
        return { ...session, currentIndex: existingIndex };
      }

      const item = pool.find((entry) => entry.id === itemId);
      if (!item) return session;

      if (!session?.queueIds?.length) {
        return createSessionFromIds([itemId]);
      }

      const insertAt = Math.min(session.currentIndex, session.queueIds.length);
      const queueIds = [
        ...session.queueIds.slice(0, insertAt),
        itemId,
        ...session.queueIds.slice(insertAt),
      ];

      return {
        ...session,
        queueIds,
        currentIndex: insertAt,
        sessionTotal: Math.max(session.sessionTotal ?? queueIds.length, queueIds.length),
      };
    });
  }, []);

  const handleOpenCodingQuestion = useCallback(
    (questionId) => {
      jumpToSessionItem(
        setCodingSession,
        activeCodingQuestions,
        questionId,
        (queueIds) => ({
          answeredIds: [],
          score: 0,
          answered: 0,
          currentIndex: 0,
          queueIds,
          sessionTotal: queueIds.length,
        })
      );
    },
    [activeCodingQuestions, jumpToSessionItem, setCodingSession]
  );

  const handleOpenOutputQuestion = useCallback(
    (questionId) => {
      jumpToSessionItem(
        setOutputSession,
        activeOutputQuestions,
        questionId,
        (queueIds) => createOutputSession({ queue: activeOutputQuestions.filter((q) => queueIds.includes(q.id)) })
      );
    },
    [activeOutputQuestions, jumpToSessionItem, setOutputSession]
  );

  const handleSearchSelect = useCallback(
    (result) => {
      const { section, id } = result;

      if (section === 'learnings') {
        setSection('learnings', { learningId: id });
        return;
      }
      if (section === 'react-learnings') {
        setSection('react-learnings', { learningId: id });
        return;
      }
      if (section === 'hld') {
        setSection('hld', { learningId: id });
        return;
      }
      if (section === 'algorithm') {
        setSection('algorithm', { learningId: id });
        return;
      }
      if (section === 'mcq') {
        setSection('mcq');
        setViewMode('quiz');
        setSkippedIds((ids) => ids.filter((skippedId) => skippedId !== id));
        jumpToSessionItem(
          setQuizSession,
          activeQuestions,
          id,
          (queueIds) =>
            createSession({
              queue: activeQuestions.filter((question) => queueIds.includes(question.id)),
              mode: 'all',
              topics: [],
              difficulties: [],
            })
        );
        return;
      }
      if (section === 'coding') {
        setSection('coding');
        handleOpenCodingQuestion(id);
        return;
      }
      if (section === 'output') {
        setSection('output');
        handleOpenOutputQuestion(id);
      }
    },
    [
      activeQuestions,
      handleOpenCodingQuestion,
      handleOpenOutputQuestion,
      jumpToSessionItem,
      setQuizSession,
      setSection,
      setSkippedIds,
      setViewMode,
    ]
  );

  const handleToggleStar = useCallback(
    (section, id) => {
      setStarred((prev) => toggleStarId(prev, section, id));
    },
    [setStarred]
  );

  const handleToggleCompleted = useCallback(
    (section, id) => {
      setCompleted((prev) => toggleCompletedId(prev, section, id));
    },
    [setCompleted]
  );

  const getMcqPoolForMode = useCallback(
    (source, currentMode, topics, difficulties) => {
      let pool;
      if (currentMode === 'weak') {
        pool = getQuestionsForWeakTopics(source, getWeakTopics(progress, source));
      } else if (currentMode === 'review') {
        pool = getQuestionsForReview(source, progress);
      } else {
        pool = filterQuestions(source, { topics, difficulties });
      }
      return filterQuestions(pool, { topics, difficulties });
    },
    [progress]
  );

  const handleMcqStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, mcq: value }));
      const source = value ? filterStarred(activeQuestions, 'mcq', starred) : activeQuestions;
      const pool = getMcqPoolForMode(source, mode, selectedTopics, selectedDifficulties);
      startQuiz(pool, mode, { resetSession: true, topics: selectedTopics, difficulties: selectedDifficulties });
    },
    [
      setStarredFilter,
      activeQuestions,
      starred,
      getMcqPoolForMode,
      mode,
      selectedTopics,
      selectedDifficulties,
      startQuiz,
    ]
  );

  const handleLearningsStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, learnings: value }));
      if (value) {
        const nextStarredLearnings = filterStarred(activeLearnings, 'learnings', starred);
        if (
          route.learningId &&
          !nextStarredLearnings.some((item) => item.id === route.learningId) &&
          nextStarredLearnings.length > 0
        ) {
          setLearningId(nextStarredLearnings[0].id);
        }
      }
    },
    [setStarredFilter, activeLearnings, starred, route.learningId, setLearningId]
  );

  const handleReactLearningsStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'react-learnings': value }));
      if (value) {
        const nextStarred = filterStarred(activeReactLearnings, 'react-learnings', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setReactLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeReactLearnings, starred, route.learningId, setReactLearningId]
  );

  const handleHldStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, hld: value }));
      if (value) {
        const nextStarred = filterStarred(activeHldLearnings, 'hld', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setHldLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeHldLearnings, starred, route.learningId, setHldLearningId]
  );

  const handleAlgorithmStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, algorithm: value }));
      if (value) {
        const nextStarred = filterStarred(activeAlgorithmLearnings, 'algorithm', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setAlgorithmLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeAlgorithmLearnings, starred, route.learningId, setAlgorithmLearningId]
  );

  const handleCodingStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, coding: value }));
      const pool = value ? filterStarred(activeCodingQuestions, 'coding', starred) : activeCodingQuestions;
      const queue = buildCodingQueue(pool, completed, { includeCompleted: codingIncludeCompleted });
      setCodingSession({
        answeredIds: [],
        score: 0,
        answered: 0,
        currentIndex: 0,
        queueIds: queue.map((q) => q.id),
        sessionTotal: queue.length,
      });
      codingSessionRecordedRef.current = false;
    },
    [setStarredFilter, activeCodingQuestions, starred, completed, codingIncludeCompleted, setCodingSession]
  );

  const handleOutputStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, output: value }));
      const pool = value ? filterStarred(activeOutputQuestions, 'output', starred) : activeOutputQuestions;
      const queue = buildOutputQueue(pool, completed, { includeCompleted: outputIncludeCompleted });
      setOutputSession(createOutputSession({ queue }));
      outputSessionRecordedRef.current = false;
    },
    [setStarredFilter, activeOutputQuestions, starred, completed, outputIncludeCompleted, setOutputSession]
  );

  const handleArchiveMcq = useCallback(
    (question) => {
      setArchived((prev) => archiveId(prev, 'mcq', question.id));
      setSkippedIds((ids) => ids.filter((id) => id !== question.id));
      setQuizSession((session) => removeFromSessionQueue(session, question.id));
    },
    [setArchived, setSkippedIds, setQuizSession, removeFromSessionQueue]
  );

  const handleArchiveOutput = useCallback(
    (question) => {
      setArchived((prev) => archiveId(prev, 'output', question.id));
      setOutputSession((session) => removeFromSessionQueue(session, question.id));
    },
    [setArchived, setOutputSession, removeFromSessionQueue]
  );

  const handleArchiveCoding = useCallback(
    (question) => {
      setArchived((prev) => archiveId(prev, 'coding', question.id));
      setCodingSession((session) => removeFromSessionQueue(session, question.id));
    },
    [setArchived, setCodingSession, removeFromSessionQueue]
  );

  const handleArchiveLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'learnings', learning.id));
      const nextArchived = archiveId(archived, 'learnings', learning.id);
      const nextActive = filterActive(learnings, 'learnings', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, learnings, route.learningId, setLearningId]
  );

  const handleArchiveReactLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'react-learnings', learning.id));
      const nextArchived = archiveId(archived, 'react-learnings', learning.id);
      const nextActive = filterActive(reactLearnings, 'react-learnings', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setReactLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, reactLearnings, route.learningId, setReactLearningId]
  );

  const handleArchiveHldLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'hld', learning.id));
      const nextArchived = archiveId(archived, 'hld', learning.id);
      const nextActive = filterActive(hldLearnings, 'hld', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setHldLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, hldLearnings, route.learningId, setHldLearningId]
  );

  const handleArchiveAlgorithmLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'algorithm', learning.id));
      const nextArchived = archiveId(archived, 'algorithm', learning.id);
      const nextActive = filterActive(algorithmLearnings, 'algorithm', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setAlgorithmLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, algorithmLearnings, route.learningId, setAlgorithmLearningId]
  );

  const handleUnarchive = useCallback(
    (section, id) => {
      setArchived((prev) => unarchiveId(prev, section, id));
      if (section === 'mcq') {
        setQuizSession((session) => {
          if (!session) return session;
          if (session.answeredIds.includes(id)) return session;
          if (session.queueIds.includes(id)) return session;
          return { ...session, queueIds: [...session.queueIds, id] };
        });
      }
    },
    [setArchived, setQuizSession]
  );

  const handleClearProgress = useCallback(() => {
    if (!window.confirm('Clear all quiz progress and history?')) return;
    setProgress(EMPTY_PROGRESS);
    const { queue } = shufflePool(filteredQuestions, new Set(), EMPTY_PROGRESS);
    setQuizSession(createSession({ queue, mode: 'all', topics: [], difficulties: [] }));
    sessionRecordedRef.current = false;
  }, [shufflePool, filteredQuestions, setProgress, setQuizSession]);

  const startOutputQuiz = useCallback(
    ({ resetSession = false, includeCompleted: includeCompletedOverride, pool: poolOverride } = {}) => {
      const includeCompleted = includeCompletedOverride ?? outputIncludeCompleted;
      const nextScore = resetSession ? 0 : (outputSession?.score ?? 0);
      const nextAnswered = resetSession ? 0 : (outputSession?.answered ?? 0);
      const nextSessionTotal = resetSession ? undefined : outputSession?.sessionTotal;

      const queue = buildOutputQuizQueue(
        poolOverride ?? starredActiveOutputQuestions,
        includeCompleted
      );

      setOutputSession(
        createOutputSession({
          queue,
          score: nextScore,
          answered: nextAnswered,
          answeredIds: resetSession ? [] : [...(outputSession?.answeredIds ?? [])],
          currentIndex: 0,
          sessionTotal: resetSession ? queue.length : nextSessionTotal,
        })
      );
      outputSessionRecordedRef.current = false;
    },
    [buildOutputQuizQueue, starredActiveOutputQuestions, outputIncludeCompleted, outputSession, setOutputSession]
  );

  const handleOutputCheck = useCallback(
    (correct, question) => {
      setOutputSession((session) => {
        if (!session || session.answeredIds.includes(question.id)) return session;
        setOutputProgress((prev) => recordOutputAnswer(prev, question, correct));
        if (correct) {
          setCompleted((prev) => markCompletedId(prev, 'output', question.id));
        }
        return {
          ...session,
          answeredIds: [...session.answeredIds, question.id],
          answered: session.answered + 1,
          score: session.score + (correct ? 1 : 0),
        };
      });
    },
    [setOutputProgress, setOutputSession, setCompleted]
  );

  const handleOutputNext = useCallback(() => {
    setOutputSession((session) => {
      if (!session) return session;
      return { ...session, currentIndex: session.currentIndex + 1 };
    });
  }, [setOutputSession]);

  const handleOutputRestart = useCallback(() => {
    startOutputQuiz({ resetSession: true });
  }, [startOutputQuiz]);

  const handleOutputIncludeCompletedChange = useCallback(
    (value) => {
      setOutputIncludeCompleted(value);
      startOutputQuiz({ resetSession: true, includeCompleted: value });
    },
    [setOutputIncludeCompleted, startOutputQuiz]
  );

  const handleOutputClearProgress = useCallback(() => {
    if (!window.confirm('Clear all output quiz progress and history?')) return;
    setOutputProgress(EMPTY_OUTPUT_PROGRESS);
    const queue = buildOutputQuizQueue(starredActiveOutputQuestions);
    setOutputSession(createOutputSession({ queue }));
    outputSessionRecordedRef.current = false;
  }, [buildOutputQuizQueue, starredActiveOutputQuestions, setOutputProgress, setOutputSession]);

  const handleMcqIncludeCompletedChange = useCallback(
    (value) => {
      setMcqIncludeCompleted(value);
      const { queue } = shufflePool(basePool, new Set(), progress, mcqExcludedSet, value);
      setQuizSession(createSession({
        queue,
        mode,
        topics: selectedTopics,
        difficulties: selectedDifficulties,
      }));
      sessionRecordedRef.current = false;
    },
    [setMcqIncludeCompleted, shufflePool, basePool, progress, mcqExcludedSet, mode, selectedTopics, selectedDifficulties, setQuizSession]
  );

  const handleCodingIncludeCompletedChange = useCallback(
    (value) => {
      setCodingIncludeCompleted(value);
      const queue = buildCodingQueue(starredActiveCodingQuestions, completed, { includeCompleted: value });
      setCodingSession({
        answeredIds: [],
        score: 0,
        answered: 0,
        currentIndex: 0,
        queueIds: queue.map((q) => q.id),
        sessionTotal: queue.length,
      });
      codingSessionRecordedRef.current = false;
    },
    [setCodingIncludeCompleted, starredActiveCodingQuestions, completed, setCodingSession]
  );

  const handleCodingCheck = useCallback(
    (correct, question, { isRetry = false } = {}) => {
      if (isRetry) {
        if (!correct) return;
        setCodingSession((session) => {
          if (!session || !session.answeredIds.includes(question.id)) return session;
          return { ...session, score: session.score + 1 };
        });
        setCodingProgress((prev) => {
          const updated = recordCodingAnswer(prev, question.id, true);
          saveCodingProgress(updated);
          return updated;
        });
        setCompleted((prev) => markCompletedId(prev, 'coding', question.id));
        return;
      }

      setCodingSession((session) => {
        if (!session || session.answeredIds.includes(question.id)) return session;
        setCodingProgress((prev) => {
          const updated = recordCodingAnswer(prev, question.id, correct);
          saveCodingProgress(updated);
          return updated;
        });
        if (correct) {
          setCompleted((prev) => markCompletedId(prev, 'coding', question.id));
        }
        return {
          ...session,
          answeredIds: [...session.answeredIds, question.id],
          answered: session.answered + 1,
          score: session.score + (correct ? 1 : 0),
        };
      });
    },
    [setCodingProgress, setCodingSession, setCompleted]
  );

  const handleCodingNext = useCallback(() => {
    setCodingSession((session) => {
      if (!session) return session;
      return { ...session, currentIndex: session.currentIndex + 1 };
    });
  }, [setCodingSession]);

  const handleCodingRestart = useCallback(() => {
    const queue = buildCodingQueue(starredActiveCodingQuestions, completed, {
      includeCompleted: codingIncludeCompleted,
    });
    setCodingSession({
      answeredIds: [],
      score: 0,
      answered: 0,
      currentIndex: 0,
      queueIds: queue.map((q) => q.id),
      sessionTotal: queue.length,
    });
    codingSessionRecordedRef.current = false;
  }, [starredActiveCodingQuestions, completed, codingIncludeCompleted, setCodingSession]);

  const codingStats = useMemo(() => getCodingStats(codingProgress), [codingProgress]);

  useEffect(() => {
    function onKeyDown(e) {
      const target = e.target;
      const isEditable =
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.isContentEditable ||
        target?.closest?.('.monaco-editor');

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchPaletteOpen((open) => !open);
        return;
      }

      if (searchPaletteOpen) return;

      if (e.key === 'Enter' && !isFinished && !loading && !isEditable) {
        e.preventDefault();
        const btn = document.querySelector('.next-btn');
        if (btn) btn.click();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFinished, loading, searchPaletteOpen]);

  function handleToggleTopic(topic) {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    restartWithFilters(next, selectedDifficulties, starredActiveQuestions, mode);
  }

  function handleToggleDifficulty(difficulty) {
    const next = selectedDifficulties.includes(difficulty)
      ? selectedDifficulties.filter((d) => d !== difficulty)
      : [...selectedDifficulties, difficulty];
    restartWithFilters(selectedTopics, next, starredActiveQuestions, mode);
  }

  function handleClearFilters() {
    restartWithFilters([], [], starredActiveQuestions, mode);
  }

  function restartWithFilters(topics, difficulties, allQuestions, currentMode) {
    let pool;
    if (currentMode === 'weak') {
      pool = getQuestionsForWeakTopics(allQuestions, getWeakTopics(progress, allQuestions));
    } else if (currentMode === 'review') {
      pool = getQuestionsForReview(allQuestions, progress);
    } else {
      pool = filterQuestions(allQuestions, { topics, difficulties });
    }

    pool = filterQuestions(pool, { topics, difficulties });

    startQuiz(pool, currentMode, { resetSession: false, topics, difficulties });
  }

  const lifetimeAccuracy = getLifetimeAccuracy(progress.stats);
  const bestPct = getBestPct(progress.sessions);
  const outputLifetimeAccuracy = getOutputLifetimeAccuracy(outputProgress.stats);
  const outputBestPct = getOutputBestPct(outputProgress.sessions);
  const outputMissedCount = getOutputMissedCount(outputProgress);

  function outputContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (outputSessionCaughtUp) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.output && starredActiveOutputQuestions.length === 0
                ? 'No starred output questions yet.'
                : outputIncludeCompleted
                  ? 'No output questions available in this session. Start a new quiz to continue.'
                  : 'All output questions are completed. Turn on "Include completed questions" to keep practicing.'}
            </p>
            <button onClick={handleOutputRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (starredActiveOutputQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.output
                ? 'No starred output questions yet.'
                : 'No output questions available.'}
            </p>
          </div>
        </div>
      );
    }

    if (activeOutputQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>No output questions available.</p>
          </div>
        </div>
      );
    }

    if (isOutputFinished) {
      return (
        <div className="quiz-container">
          <OutputResults
            score={outputScore}
            totalQuestions={outputSessionTotal}
            sessionCount={outputProgress.sessions.length}
            bestPct={outputBestPct}
            missedCount={outputMissedCount}
            onRestart={handleOutputRestart}
          />
        </div>
      );
    }

    if (currentOutputQuestion) {
      return (
        <OutputQuizQuestion
          key={currentOutputQuestion.id}
          question={currentOutputQuestion}
          remaining={outputRemaining}
          sessionTotal={outputSessionTotal}
          score={outputScore}
          answered={outputAnswered}
          isCompleted={isCompleted(currentOutputQuestion.id, 'output', completed)}
          highlight={syntaxHighlight}
          theme={theme}
          sourceUrl={outputSourceUrl}
          onCheck={handleOutputCheck}
          onNext={handleOutputNext}
          onArchive={handleArchiveOutput}
          isStarred={isStarred(currentOutputQuestion.id, 'output', starred)}
          onToggleStar={() => handleToggleStar('output', currentOutputQuestion.id)}
          onToggleCompleted={() => handleToggleCompleted('output', currentOutputQuestion.id)}
        />
      );
    }

    return null;
  }

  function codingContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (codingSessionCaughtUp) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.coding && starredActiveCodingQuestions.length === 0
                ? 'No starred coding challenges yet.'
                : codingIncludeCompleted
                  ? 'No coding challenges available in this session. Start a new quiz to continue.'
                  : 'All coding challenges are completed. Turn on "Include completed questions" to keep practicing.'}
            </p>
            <button onClick={handleCodingRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (starredActiveCodingQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.coding
                ? 'No starred coding challenges yet.'
                : 'No coding questions available.'}
            </p>
          </div>
        </div>
      );
    }

    if (activeCodingQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>No coding questions available.</p>
          </div>
        </div>
      );
    }

    if (isCodingFinished) {
      return (
        <div className="quiz-container">
          <CodingResults
            score={codingScore}
            totalQuestions={codingSessionTotal}
            sessionCount={codingProgress.sessions.length}
            bestPct={codingStats.bestPct}
            onRestart={handleCodingRestart}
          />
        </div>
      );
    }

    if (currentCodingQuestion) {
      return (
        <CodingChallenge
          key={currentCodingQuestion.id}
          question={currentCodingQuestion}
          remaining={codingRemaining}
          sessionTotal={codingSessionTotal}
          score={codingScore}
          answered={codingAnswered}
          highlight={syntaxHighlight}
          theme={theme}
          onCheck={handleCodingCheck}
          onNext={handleCodingNext}
          onArchive={handleArchiveCoding}
          isStarred={isStarred(currentCodingQuestion.id, 'coding', starred)}
          onToggleStar={() => handleToggleStar('coding', currentCodingQuestion.id)}
          isCompleted={isCompleted(currentCodingQuestion.id, 'coding', completed)}
          onToggleCompleted={() => handleToggleCompleted('coding', currentCodingQuestion.id)}
        />
      );
    }

    return null;
  }

  function centerContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (viewMode === 'list') {
      return (
        <QuestionListView
          questions={filteredQuestions}
          progress={progress}
          skippedIds={skippedIds}
          starredIds={starred.mcq}
          completedIds={completed.mcq}
          currentQuestionId={currentQuestion?.id ?? null}
          onOpenQuestion={handleOpenQuestion}
          onUnskip={handleUnskip}
        />
      );
    }

    if (sessionCaughtUp) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {mcqIncludeCompleted
                ? "You've answered all questions in this session. Start a new quiz to continue."
                : 'All questions are completed. Turn on "Include completed questions" to keep practicing.'}
            </p>
            <button onClick={handleRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (basePool.length === 0) {
      const emptyMessage =
        starredFilter.mcq && starredActiveQuestions.length === 0
          ? 'No starred questions yet.'
          : mode === 'weak'
            ? 'Not enough data for weak-topic practice yet. Answer more questions first.'
            : mode === 'review'
              ? 'No missed questions to review. Great job!'
              : starredFilter.mcq
                ? 'No starred questions match the selected filters.'
                : 'No questions match the selected filters.';

      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>{emptyMessage}</p>
            {mode !== 'all' ? (
              <button onClick={handleBackToAll}>
                Back to all questions
              </button>
            ) : (
              <button onClick={handleClearFilters}>Clear filters</button>
            )}
          </div>
        </div>
      );
    }

    if (isFinished) {
      return (
        <div className="quiz-container">
          <Results
            score={score}
            totalQuestions={sessionTotal}
            sessionCount={progress.sessions.length}
            bestPct={bestPct}
            weakTopics={weakTopics}
            missedCount={missedCount}
            onRestart={handleRestart}
            onPracticeWeak={handleStartWeak}
            onReviewMistakes={handleStartReview}
          />
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <QuizQuestion
          key={currentQuestion.id}
          question={currentQuestion}
          remaining={remaining}
          sessionTotal={sessionTotal}
          score={score}
          answered={answered}
          highlight={syntaxHighlight}
          theme={theme}
          onPick={handlePick}
          onNext={handleNext}
          onSkip={handleSkip}
          onArchive={handleArchiveMcq}
          isStarred={isStarred(currentQuestion.id, 'mcq', starred)}
          onToggleStar={() => handleToggleStar('mcq', currentQuestion.id)}
          isCompleted={isCompleted(currentQuestion.id, 'mcq', completed)}
          onToggleCompleted={() => handleToggleCompleted('mcq', currentQuestion.id)}
        />
      );
    }

    return null;
  }

  return (
    <>
      <CommandPalette
        open={searchPaletteOpen}
        docs={searchDocs}
        onClose={() => setSearchPaletteOpen(false)}
        onSelect={handleSearchSelect}
      />
      <Layout
      mobileProgress={
        <MobileProgressBar
          lifetimeAccuracy={lifetimeAccuracy}
          sessionCount={progress.sessions.length}
          bestPct={bestPct}
          weakTopics={weakTopics}
          missedCount={missedCount}
          mode={mode}
          onPracticeWeak={handleStartWeak}
          onReviewMistakes={handleStartReview}
          onBackToAll={handleBackToAll}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
      }
      sidebar={
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setSection}
            totalQuestions={activeQuestions.length}
            learningsCount={activeLearnings.length}
            reactLearningsCount={activeReactLearnings.length}
            hldLearningsCount={activeHldLearnings.length}
            algorithmLearningsCount={activeAlgorithmLearnings.length}
            outputQuestionsCount={activeOutputQuestions.length}
            codingQuestionsCount={activeCodingQuestions.length}
            archivedCount={archivedCount}
            filteredCount={
              selectedTopics.length > 0 || selectedDifficulties.length > 0 || starredFilter.mcq
                ? filteredQuestions.length
                : activeQuestions.length
            }
            lifetimeAccuracy={lifetimeAccuracy}
            sessionCount={progress.sessions.length}
            bestPct={bestPct}
            weakTopics={weakTopics}
            missedCount={missedCount}
            mode={mode}
            onPracticeWeak={handleStartWeak}
            onReviewMistakes={handleStartReview}
            onBackToAll={handleBackToAll}
            onClearProgress={handleClearProgress}
            mcqCompletedCount={mcqCompletedCount}
            mcqIncludeCompleted={mcqIncludeCompleted}
            onMcqIncludeCompletedChange={handleMcqIncludeCompletedChange}
            codingSessionCount={codingProgress.sessions.length}
            codingBestPct={codingStats.bestPct}
            codingCompletedCount={codingCompletedCount}
            codingIncludeCompleted={codingIncludeCompleted}
            onCodingIncludeCompletedChange={handleCodingIncludeCompletedChange}
            onCodingRestart={handleCodingRestart}
            outputLifetimeAccuracy={outputLifetimeAccuracy}
            outputSessionCount={outputProgress.sessions.length}
            outputBestPct={outputBestPct}
            outputMissedCount={outputMissedCount}
            outputCompletedCount={outputCompletedCount}
            outputIncludeCompleted={outputIncludeCompleted}
            onOutputIncludeCompletedChange={handleOutputIncludeCompletedChange}
            onOutputRestart={handleOutputRestart}
            onOutputClearProgress={handleOutputClearProgress}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            syntaxHighlight={syntaxHighlight}
            onToggleHighlight={() => setSyntaxHighlight((v) => !v)}
            onOpenSearch={() => setSearchPaletteOpen(true)}
          />
        }
        center={
          <div className="center-with-toggle">
            <div className="section-toggle" role="tablist" aria-label="Section">
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'mcq'}
                className={`section-toggle-btn${activeSection === 'mcq' ? ' active' : ''}`}
                onClick={() => setSection('mcq', { viewMode })}
              >
                MCQs
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'learnings'}
                className={`section-toggle-btn${activeSection === 'learnings' ? ' active' : ''}`}
                onClick={() => setSection('learnings')}
              >
                Learnings
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'react-learnings'}
                className={`section-toggle-btn${activeSection === 'react-learnings' ? ' active' : ''}`}
                onClick={() => setSection('react-learnings')}
              >
                React
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'hld'}
                className={`section-toggle-btn${activeSection === 'hld' ? ' active' : ''}`}
                onClick={() => setSection('hld')}
              >
                HLD
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'algorithm'}
                className={`section-toggle-btn${activeSection === 'algorithm' ? ' active' : ''}`}
                onClick={() => setSection('algorithm')}
              >
                Algorithm
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'coding'}
                className={`section-toggle-btn${activeSection === 'coding' ? ' active' : ''}`}
                onClick={() => setSection('coding')}
              >
                Coding
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'output'}
                className={`section-toggle-btn${activeSection === 'output' ? ' active' : ''}`}
                onClick={() => setSection('output')}
              >
                Output
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === 'archived'}
                className={`section-toggle-btn${activeSection === 'archived' ? ' active' : ''}`}
                onClick={() => setSection('archived')}
              >
                Archived
              </button>
            </div>

            {activeSection === 'mcq' && (
              <div className="view-toggle" role="tablist" aria-label="View mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'quiz'}
                  className={`view-toggle-btn${viewMode === 'quiz' ? ' active' : ''}`}
                  onClick={() => setViewMode('quiz')}
                >
                  Quiz
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            )}

            {activeSection === 'learnings' ? (
              <LearningsView
                learning={selectedLearning}
                learnings={starredActiveLearnings}
                selectedLearningId={selectedLearning?.id ?? null}
                onSelectLearning={setLearningId}
                onArchive={handleArchiveLearning}
                isStarred={selectedLearning ? isStarred(selectedLearning.id, 'learnings', starred) : false}
                onToggleStar={() => selectedLearning && handleToggleStar('learnings', selectedLearning.id)}
                isCompleted={selectedLearning ? isCompleted(selectedLearning.id, 'learnings', completed) : false}
                onToggleCompleted={() => selectedLearning && handleToggleCompleted('learnings', selectedLearning.id)}
                highlight={syntaxHighlight}
                theme={theme}
              />
            ) : activeSection === 'react-learnings' ? (
              <LearningsView
                learning={selectedReactLearning}
                learnings={starredActiveReactLearnings}
                selectedLearningId={selectedReactLearning?.id ?? null}
                onSelectLearning={setReactLearningId}
                onArchive={handleArchiveReactLearning}
                isStarred={selectedReactLearning ? isStarred(selectedReactLearning.id, 'react-learnings', starred) : false}
                onToggleStar={() => selectedReactLearning && handleToggleStar('react-learnings', selectedReactLearning.id)}
                isCompleted={selectedReactLearning ? isCompleted(selectedReactLearning.id, 'react-learnings', completed) : false}
                onToggleCompleted={() => selectedReactLearning && handleToggleCompleted('react-learnings', selectedReactLearning.id)}
                highlight={syntaxHighlight}
                theme={theme}
              />
            ) : activeSection === 'hld' ? (
              <LearningsView
                learning={selectedHldLearning}
                learnings={starredActiveHldLearnings}
                selectedLearningId={selectedHldLearning?.id ?? null}
                onSelectLearning={setHldLearningId}
                onArchive={handleArchiveHldLearning}
                isStarred={selectedHldLearning ? isStarred(selectedHldLearning.id, 'hld', starred) : false}
                onToggleStar={() => selectedHldLearning && handleToggleStar('hld', selectedHldLearning.id)}
                isCompleted={selectedHldLearning ? isCompleted(selectedHldLearning.id, 'hld', completed) : false}
                onToggleCompleted={() => selectedHldLearning && handleToggleCompleted('hld', selectedHldLearning.id)}
                highlight={syntaxHighlight}
                theme={theme}
              />
            ) : activeSection === 'algorithm' ? (
              <LearningsView
                learning={selectedAlgorithmLearning}
                learnings={starredActiveAlgorithmLearnings}
                selectedLearningId={selectedAlgorithmLearning?.id ?? null}
                onSelectLearning={setAlgorithmLearningId}
                onArchive={handleArchiveAlgorithmLearning}
                isStarred={selectedAlgorithmLearning ? isStarred(selectedAlgorithmLearning.id, 'algorithm', starred) : false}
                onToggleStar={() => selectedAlgorithmLearning && handleToggleStar('algorithm', selectedAlgorithmLearning.id)}
                isCompleted={selectedAlgorithmLearning ? isCompleted(selectedAlgorithmLearning.id, 'algorithm', completed) : false}
                onToggleCompleted={() => selectedAlgorithmLearning && handleToggleCompleted('algorithm', selectedAlgorithmLearning.id)}
                highlight={syntaxHighlight}
                theme={theme}
              />
            ) : activeSection === 'archived' ? (
              <ArchivedView
                archived={archived}
                questions={questions}
                learnings={learnings}
                reactLearnings={reactLearnings}
                hldLearnings={hldLearnings}
                algorithmLearnings={algorithmLearnings}
                codingQuestions={codingQuestions}
                outputQuestions={outputQuestions}
                onUnarchive={handleUnarchive}
              />
            ) : activeSection === 'coding' ? (
              codingContent()
            ) : activeSection === 'output' ? (
              outputContent()
            ) : (
              centerContent()
            )}
          </div>
        }
        panel={
          activeSection === 'archived' ? (
            <div className="topics-panel archived-panel">
              <div className="panel-subheader">
                <span>Archived</span>
                <span className="learnings-count">{archivedCount}</span>
              </div>
              <p className="output-panel-copy">
                Archived items are hidden from quizzes and lists until you unarchive them.
              </p>
            </div>
          ) : activeSection === 'learnings' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                learnings={starredActiveLearnings}
                starredIds={starred.learnings}
                completedIds={completed.learnings}
                selectedLearningId={selectedLearning?.id ?? null}
                starredOnly={starredFilter.learnings}
                starredCount={learningsStarredCount}
                onStarredOnlyChange={handleLearningsStarredFilterChange}
                onSelect={setLearningId}
                title="Javascript learnings"
              />
            </div>
          ) : activeSection === 'react-learnings' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                learnings={starredActiveReactLearnings}
                starredIds={starred['react-learnings']}
                completedIds={completed['react-learnings']}
                selectedLearningId={selectedReactLearning?.id ?? null}
                starredOnly={starredFilter['react-learnings']}
                starredCount={reactLearningsStarredCount}
                onStarredOnlyChange={handleReactLearningsStarredFilterChange}
                onSelect={setReactLearningId}
                title="React learnings"
              />
            </div>
          ) : activeSection === 'hld' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                learnings={starredActiveHldLearnings}
                starredIds={starred.hld}
                completedIds={completed.hld}
                selectedLearningId={selectedHldLearning?.id ?? null}
                starredOnly={starredFilter.hld}
                starredCount={hldStarredCount}
                onStarredOnlyChange={handleHldStarredFilterChange}
                onSelect={setHldLearningId}
                title="HLD"
              />
            </div>
          ) : activeSection === 'algorithm' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                learnings={starredActiveAlgorithmLearnings}
                starredIds={starred.algorithm}
                completedIds={completed.algorithm}
                selectedLearningId={selectedAlgorithmLearning?.id ?? null}
                starredOnly={starredFilter.algorithm}
                starredCount={algorithmStarredCount}
                onStarredOnlyChange={handleAlgorithmStarredFilterChange}
                onSelect={setAlgorithmLearningId}
                title="Algorithm"
              />
            </div>
          ) : activeSection === 'coding' ? (
            <div className="topics-panel coding-panel">
              <CodingPanel
                questions={starredActiveCodingQuestions}
                starredIds={starred.coding}
                completedIds={completed.coding}
                selectedQuestionId={currentCodingQuestion?.id ?? null}
                starredOnly={starredFilter.coding}
                starredCount={codingStarredCount}
                onStarredOnlyChange={handleCodingStarredFilterChange}
                onSelect={handleOpenCodingQuestion}
                title="Javascript Coding"
              />
            </div>
          ) : activeSection === 'output' ? (
            <div className="topics-panel output-panel">
              <div className="panel-subheader output-panel-header">
                <span>Javascript output</span>
                <span className="learnings-count">
                  {starredFilter.output ? starredActiveOutputQuestions.length : activeOutputQuestions.length}
                </span>
              </div>
              <p className="output-panel-copy">
                Predict console output for each snippet. Answers are validated by running the code in your browser.
              </p>
              <StarredFilterToggle
                checked={starredFilter.output}
                count={outputStarredCount}
                onChange={handleOutputStarredFilterChange}
                hint={starredFilter.output ? 'Only starred questions appear in the quiz.' : 'All active questions are included.'}
              />
            </div>
          ) : (
            <div className="topics-panel">
              <FilterPanel
                questions={starredFilter.mcq ? starredActiveQuestions : activeQuestions}
                progress={progress}
                completedIds={completed.mcq}
                selectedTopics={selectedTopics}
                selectedDifficulties={selectedDifficulties}
                starredOnly={starredFilter.mcq}
                starredCount={mcqStarredCount}
                onStarredOnlyChange={handleMcqStarredFilterChange}
                onToggleTopic={handleToggleTopic}
                onToggleDifficulty={handleToggleDifficulty}
                onClear={handleClearFilters}
              />
            </div>
          )
        }
        sidebarCollapsed={sidebarCollapsed}
        panelCollapsed={panelCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        onTogglePanel={() => setPanelCollapsed((v) => !v)}
      />
    </>
  );
}
