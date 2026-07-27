import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import QuizQuestion from './components/QuizQuestion';
import QuestionListView from './components/QuestionListView';
import Results from './components/Results';
import MobileProgressBar from './components/MobileProgressBar';
import { useLocalStorage } from './hooks/useLocalStorage';
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
import questionsData from '../questions.json';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('quiz'); // 'quiz' | 'list'

  const [theme, setTheme] = useLocalStorage('quiz-theme', 'light');
  const [syntaxHighlight, setSyntaxHighlight] = useLocalStorage('quiz-syntax', true);
  const [progress, setProgress] = useLocalStorage('quiz-progress', EMPTY_PROGRESS);
  const [quizSession, setQuizSession] = useLocalStorage('quiz-session', EMPTY_SESSION);
  const [skippedIds, setSkippedIds] = useLocalStorage('quiz-skipped', []);

  const sessionRecordedRef = useRef(false);
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  useEffect(() => {
    const allQuestions = questionsData.questions;
    setQuestions(allQuestions);

    setQuizSession((saved) => {
      const sanitized = sanitizeSessionQueue(saved, skippedIds);
      if (isRestorableSession(sanitized, allQuestions)) {
        return sanitized;
      }
      const { queue } = shufflePool(allQuestions, new Set(), progress, new Set(skippedIds));
      return createSession({ queue, mode: 'all', topics: [], difficulties: [] });
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
    [questions, setQuizSession, setSkippedIds]
  );

  const handleClearProgress = useCallback(() => {
    if (!window.confirm('Clear all quiz progress and history?')) return;
    setProgress(EMPTY_PROGRESS);
    const { queue } = shufflePool(filteredQuestions, new Set(), EMPTY_PROGRESS);
    setQuizSession(createSession({ queue, mode: 'all', topics: [], difficulties: [] }));
    sessionRecordedRef.current = false;
  }, [shufflePool, filteredQuestions, setProgress, setQuizSession]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Enter' && !isFinished && !loading) {
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
            totalQuestions={questions.length}
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
          />
        }
        center={
          <div className="center-with-toggle">
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
            {centerContent()}
          </div>
        }
        panel={
          <div className="topics-panel">
            <FilterPanel
              questions={questions}
              progress={progress}
              selectedTopics={selectedTopics}
              selectedDifficulties={selectedDifficulties}
              onToggleTopic={handleToggleTopic}
              onToggleDifficulty={handleToggleDifficulty}
              onClear={handleClearFilters}
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              syntaxHighlight={syntaxHighlight}
              onToggleHighlight={() => setSyntaxHighlight((v) => !v)}
            />
          </div>
        }
      />
  );
}
