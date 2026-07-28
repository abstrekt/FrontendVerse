import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import LearningsView from './components/LearningsView';
import LearningsPanel from './components/LearningsPanel';
import QuizQuestion from './components/QuizQuestion';
import QuestionListView from './components/QuestionListView';
import Results from './components/Results';
import MobileProgressBar from './components/MobileProgressBar';
import OutputQuizQuestion from './components/OutputQuizQuestion';
import OutputResults from './components/OutputResults';
import CodingChallenge from './components/CodingChallenge';
import CodingResults from './components/CodingResults';
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
  getOutputCompletedCount,
  isOutputQuestionCompleted,
} from './utils/outputProgress';
import questionsData from '../questions.json';
import learningsData from '../data/learnings.json';
import polyfillLearningsData from '../data/polyfill-learnings.json';
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

export default function App() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [outputQuestions, setOutputQuestions] = useState([]);
  const [outputSourceUrl, setOutputSourceUrl] = useState('');
  const { route, navigate, setSection, setViewMode, setLearningId } = useAppRoute();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('layout-sidebar-collapsed', false);
  const [panelCollapsed, setPanelCollapsed] = useLocalStorage('layout-panel-collapsed', false);
  const [codingProgress, setCodingProgress] = useState(() => loadCodingProgress());
  const [codingSession, setCodingSession] = useLocalStorage('coding-quiz-session', null);
  const [codingQuestions, setCodingQuestions] = useState([]);

  const sessionRecordedRef = useRef(false);
  const outputSessionRecordedRef = useRef(false);
  const codingSessionRecordedRef = useRef(false);
  const skippedIdSet = useMemo(() => new Set(skippedIds), [skippedIds]);

  const shuffled = useMemo(
    () => restoreQueue(quizSession, questions),
    [quizSession, questions]
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
    () => restoreOutputQueue(outputSession, outputQuestions),
    [outputSession, outputQuestions]
  );
  const outputScore = outputSession?.score ?? 0;
  const outputAnswered = outputSession?.answered ?? 0;
  const outputCurrentIndex = outputSession?.currentIndex ?? 0;
  const outputSessionTotal = outputSession?.sessionTotal ?? 0;
  const outputRemaining = outputShuffled.length - outputCurrentIndex;
  const currentOutputQuestion = outputShuffled.length > 0 ? outputShuffled[outputCurrentIndex] : null;
  const isOutputFinished = outputShuffled.length > 0 && outputCurrentIndex >= outputShuffled.length;
  const outputSessionCaughtUp =
    outputQuestions.length > 0 && outputShuffled.length === 0;

  const codingShuffled = useMemo(
    () => {
      if (!codingSession?.queueIds || !codingQuestions.length) return [];
      const byId = new Map(codingQuestions.map((q) => [q.id, q]));
      return codingSession.queueIds.map((id) => byId.get(id)).filter(Boolean);
    },
    [codingSession, codingQuestions]
  );
  const codingScore = codingSession?.score ?? 0;
  const codingAnswered = codingSession?.answered ?? 0;
  const codingCurrentIndex = codingSession?.currentIndex ?? 0;
  const codingSessionTotal = codingSession?.sessionTotal ?? 0;
  const codingRemaining = codingShuffled.length - codingCurrentIndex;
  const currentCodingQuestion = codingShuffled.length > 0 ? codingShuffled[codingCurrentIndex] : null;
  const isCodingFinished = codingShuffled.length > 0 && codingCurrentIndex >= codingShuffled.length;

  const selectedLearning = useMemo(() => {
    if (activeSection !== 'learnings') return null;
    if (route.learningId) {
      return learnings.find((item) => item.id === route.learningId) ?? learnings[0] ?? null;
    }
    return learnings[0] ?? null;
  }, [learnings, route.learningId, activeSection]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      navigate('/mcq', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (activeSection !== 'learnings' || !learnings.length) return;
    if (route.learningId && !learnings.some((item) => item.id === route.learningId)) {
      setLearningId(learnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, learnings, setLearningId]);

  const weakTopics = useMemo(
    () => getWeakTopics(progress, questions),
    [progress, questions]
  );

  const missedCount = useMemo(
    () => getMissedQuestionIds(progress).length,
    [progress]
  );

  const filteredQuestions = useMemo(
    () => filterQuestions(questions, { topics: selectedTopics, difficulties: selectedDifficulties }),
    [questions, selectedTopics, selectedDifficulties]
  );

  const basePool = useMemo(() => {
    if (mode === 'weak') {
      const weakPool = getQuestionsForWeakTopics(questions, weakTopics);
      return filterQuestions(weakPool, { topics: selectedTopics, difficulties: selectedDifficulties });
    }
    if (mode === 'review') {
      const reviewPool = getQuestionsForReview(questions, progress);
      return filterQuestions(reviewPool, { topics: selectedTopics, difficulties: selectedDifficulties });
    }
    return filteredQuestions;
  }, [mode, questions, weakTopics, progress, filteredQuestions, selectedTopics, selectedDifficulties]);

  const currentQuestion = shuffled.length > 0 ? shuffled[currentIndex] : null;
  const isFinished = shuffled.length > 0 && currentIndex >= shuffled.length;
  const sessionCaughtUp =
    basePool.length > 0 && shuffled.length === 0 && sessionAnsweredIds.size > 0;

  const shufflePool = useCallback(
    (pool, answeredIds, progressOverride = progress, excludedIds = skippedIdSet) => {
      const source = pool.length > 0 ? pool : questions;
      const excluded = new Set([...answeredIds, ...excludedIds]);
      const unanswered = filterExcludedQuestions(source, excluded);
      return {
        queue: unanswered.length > 0 ? smartShuffle(unanswered, progressOverride) : [],
        allAnswered: source.length > 0 && unanswered.length === 0,
      };
    },
    [questions, progress, skippedIdSet]
  );

  const buildOutputQuizQueue = useCallback(
    (pool, progressOverride = outputProgress, includeCompleted = outputIncludeCompleted) => {
      const source = pool.length > 0 ? pool : outputQuestions;
      return buildOutputQueue(source, progressOverride, { includeCompleted });
    },
    [outputQuestions, outputProgress, outputIncludeCompleted]
  );

  useEffect(() => {
    const allQuestions = questionsData.questions;
    const allLearnings = [...learningsData.learnings, ...polyfillLearningsData.learnings];
    const allOutputQuestions = [
      ...outputQuestionsData.questions,
      ...scopeOutputQuestionsData.questions,
    ];
    const allCodingQuestions = codingQuestionsData.questions;
    setQuestions(allQuestions);
    setLearnings(allLearnings);
    setOutputQuestions(allOutputQuestions);
    setOutputSourceUrl(outputQuestionsData.source);
    setCodingQuestions(allCodingQuestions);

    setQuizSession((saved) => {
      const sanitized = sanitizeSessionQueue(saved, skippedIds);
      if (isRestorableSession(sanitized, allQuestions)) {
        return sanitized;
      }
      const { queue } = shufflePool(allQuestions, new Set(), progress, new Set(skippedIds));
      return createSession({ queue, mode: 'all', topics: [], difficulties: [] });
    });

    setOutputSession((saved) => {
      if (isRestorableOutputSession(saved, allOutputQuestions)) {
        return saved;
      }
      const queue = buildOutputQueue(allOutputQuestions, outputProgress, {
        includeCompleted: outputIncludeCompleted,
      });
      return createOutputSession({ queue });
    });

    setCodingSession((saved) => {
      if (saved?.queueIds?.length && allCodingQuestions.length) {
        const byId = new Map(allCodingQuestions.map((q) => [q.id, q]));
        const restored = saved.queueIds.map((id) => byId.get(id)).filter(Boolean);
        if (restored.length > 0 && saved.currentIndex < restored.length) return saved;
      }
      const queue = buildCodingQueue(allCodingQuestions);
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
      setProgress((prev) => recordAnswer(prev, question, correct));
      setQuizSession((session) => {
        if (!session) return session;
        const answeredIds = session.answeredIds.includes(question.id)
          ? session.answeredIds
          : [...session.answeredIds, question.id];
        return {
          ...session,
          answeredIds,
          answered: session.answered + 1,
          score: session.score + (correct ? 1 : 0),
        };
      });
    },
    [setProgress, setQuizSession]
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
        const currentIndex = Math.min(session.currentIndex, Math.max(queueIds.length, 0));
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
    const pool = getQuestionsForWeakTopics(questions, weakTopics);
    startQuiz(pool, 'weak', { resetSession: true, topics: [], difficulties: [] });
  }, [questions, weakTopics, startQuiz]);

  const handleStartReview = useCallback(() => {
    const pool = getQuestionsForReview(questions, progress);
    startQuiz(pool, 'review', { resetSession: true, topics: [], difficulties: [] });
  }, [questions, progress, startQuiz]);

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

        const question = questions.find((q) => q.id === questionId);
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
    [questions, setQuizSession, setSkippedIds, setViewMode]
  );

  const handleClearProgress = useCallback(() => {
    if (!window.confirm('Clear all quiz progress and history?')) return;
    setProgress(EMPTY_PROGRESS);
    const { queue } = shufflePool(filteredQuestions, new Set(), EMPTY_PROGRESS);
    setQuizSession(createSession({ queue, mode: 'all', topics: [], difficulties: [] }));
    sessionRecordedRef.current = false;
  }, [shufflePool, filteredQuestions, setProgress, setQuizSession]);

  const startOutputQuiz = useCallback(
    ({ resetSession = false, includeCompleted: includeCompletedOverride } = {}) => {
      const includeCompleted = includeCompletedOverride ?? outputIncludeCompleted;
      const nextScore = resetSession ? 0 : (outputSession?.score ?? 0);
      const nextAnswered = resetSession ? 0 : (outputSession?.answered ?? 0);
      const nextSessionTotal = resetSession ? undefined : outputSession?.sessionTotal;

      const queue = buildOutputQuizQueue(outputQuestions, outputProgress, includeCompleted);

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
    [buildOutputQuizQueue, outputQuestions, outputProgress, outputIncludeCompleted, outputSession, setOutputSession]
  );

  const handleOutputCheck = useCallback(
    (correct, question) => {
      setOutputProgress((prev) => recordOutputAnswer(prev, question, correct));
      setOutputSession((session) => {
        if (!session) return session;
        const answeredIds = session.answeredIds.includes(question.id)
          ? session.answeredIds
          : [...session.answeredIds, question.id];
        return {
          ...session,
          answeredIds,
          answered: session.answered + 1,
          score: session.score + (correct ? 1 : 0),
        };
      });
    },
    [setOutputProgress, setOutputSession]
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
    const queue = buildOutputQuizQueue(outputQuestions, EMPTY_OUTPUT_PROGRESS);
    setOutputSession(createOutputSession({ queue }));
    outputSessionRecordedRef.current = false;
  }, [buildOutputQuizQueue, outputQuestions, setOutputProgress, setOutputSession]);

  const handleCodingCheck = useCallback(
    (correct, question) => {
      setCodingProgress((prev) => {
        const updated = recordCodingAnswer(prev, question.id, correct);
        saveCodingProgress(updated);
        return updated;
      });
      setCodingSession((session) => {
        if (!session) return session;
        const answeredIds = session.answeredIds.includes(question.id)
          ? session.answeredIds
          : [...session.answeredIds, question.id];
        return {
          ...session,
          answeredIds,
          answered: session.answered + 1,
          score: session.score + (correct ? 1 : 0),
        };
      });
    },
    [setCodingProgress, setCodingSession]
  );

  const handleCodingNext = useCallback(() => {
    setCodingSession((session) => {
      if (!session) return session;
      return { ...session, currentIndex: session.currentIndex + 1 };
    });
  }, [setCodingSession]);

  const handleCodingRestart = useCallback(() => {
    const queue = buildCodingQueue(codingQuestions);
    setCodingSession({
      answeredIds: [],
      score: 0,
      answered: 0,
      currentIndex: 0,
      queueIds: queue.map((q) => q.id),
      sessionTotal: queue.length,
    });
    codingSessionRecordedRef.current = false;
  }, [codingQuestions, setCodingSession]);

  const codingStats = useMemo(() => getCodingStats(codingProgress), [codingProgress]);

  useEffect(() => {
    function onKeyDown(e) {
      const target = e.target;
      const isEditable =
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.isContentEditable ||
        target?.closest?.('.monaco-editor');

      if (e.key === 'Enter' && !isFinished && !loading && !isEditable) {
        e.preventDefault();
        const btn = document.querySelector('.next-btn');
        if (btn) btn.click();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFinished, loading]);

  function handleToggleTopic(topic) {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    restartWithFilters(next, selectedDifficulties, questions, mode);
  }

  function handleToggleDifficulty(difficulty) {
    const next = selectedDifficulties.includes(difficulty)
      ? selectedDifficulties.filter((d) => d !== difficulty)
      : [...selectedDifficulties, difficulty];
    restartWithFilters(selectedTopics, next, questions, mode);
  }

  function handleClearFilters() {
    restartWithFilters([], [], questions, mode);
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
  const outputCompletedCount = getOutputCompletedCount(outputProgress);

  function outputContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (outputSessionCaughtUp) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {outputIncludeCompleted
                ? 'No output questions available in this session. Start a new quiz to continue.'
                : 'All output questions are completed. Turn on "Include completed questions" to keep practicing.'}
            </p>
            <button onClick={handleOutputRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (outputQuestions.length === 0) {
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
          key={outputCurrentIndex}
          question={currentOutputQuestion}
          remaining={outputRemaining}
          sessionTotal={outputSessionTotal}
          score={outputScore}
          answered={outputAnswered}
          isCompleted={isOutputQuestionCompleted(outputProgress, currentOutputQuestion.id)}
          highlight={syntaxHighlight}
          theme={theme}
          sourceUrl={outputSourceUrl}
          onCheck={handleOutputCheck}
          onNext={handleOutputNext}
        />
      );
    }

    return null;
  }

  function codingContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (codingQuestions.length === 0) {
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
          key={codingCurrentIndex}
          question={currentCodingQuestion}
          remaining={codingRemaining}
          sessionTotal={codingSessionTotal}
          score={codingScore}
          answered={codingAnswered}
          highlight={syntaxHighlight}
          theme={theme}
          onCheck={handleCodingCheck}
          onNext={handleCodingNext}
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
            <p>You&apos;ve answered all questions in this session. Start a new quiz to continue.</p>
            <button onClick={handleRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (basePool.length === 0) {
      const emptyMessage =
        mode === 'weak'
          ? 'Not enough data for weak-topic practice yet. Answer more questions first.'
          : mode === 'review'
            ? 'No missed questions to review. Great job!'
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
          key={currentIndex}
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
        />
      );
    }

    return null;
  }

  return (
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
            totalQuestions={questions.length}
            learningsCount={learnings.length}
            outputQuestionsCount={outputQuestions.length}
            codingQuestionsCount={codingQuestions.length}
            filteredCount={
              selectedTopics.length > 0 || selectedDifficulties.length > 0
                ? filteredQuestions.length
                : questions.length
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
                learnings={learnings}
                selectedLearningId={selectedLearning?.id ?? null}
                onSelectLearning={setLearningId}
                highlight={syntaxHighlight}
                theme={theme}
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
          activeSection === 'learnings' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                learnings={learnings}
                selectedLearningId={selectedLearning?.id ?? null}
                onSelect={setLearningId}
              />
            </div>
          ) : activeSection === 'coding' ? (
            <div className="topics-panel coding-panel">
              <div className="panel-subheader">
                <span>Javascript Coding</span>
                <span className="learnings-count">{codingQuestions.length}</span>
              </div>
              <p className="output-panel-copy">
                Solve algorithm and data structure problems by writing JavaScript code. Test cases validate your solution.
              </p>
            </div>
          ) : activeSection === 'output' ? (
            <div className="topics-panel output-panel">
              <div className="panel-subheader output-panel-header">
                <span>Javascript output</span>
                <span className="learnings-count">{outputQuestions.length}</span>
              </div>
              <p className="output-panel-copy">
                Predict console output for each snippet. Answers are validated by running the code in your browser.
              </p>
            </div>
          ) : (
            <div className="topics-panel">
              <FilterPanel
                questions={questions}
                progress={progress}
                selectedTopics={selectedTopics}
                selectedDifficulties={selectedDifficulties}
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
  );
}
