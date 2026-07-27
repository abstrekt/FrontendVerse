import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import QuizQuestion from './components/QuizQuestion';
import Results from './components/Results';
import MobileProgressBar from './components/MobileProgressBar';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  EMPTY_PROGRESS,
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
  const [shuffled, setShuffled] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [mode, setMode] = useState('all');

  const [theme, setTheme] = useLocalStorage('quiz-theme', 'light');
  const [syntaxHighlight, setSyntaxHighlight] = useLocalStorage('quiz-syntax', true);
  const [progress, setProgress] = useLocalStorage('quiz-progress', EMPTY_PROGRESS);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const sessionRecordedRef = useRef(false);

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

  const filteredQuestions = useMemo(() => {
    if (selectedTopics.length === 0) return questions;
    return questions.filter((q) =>
      selectedTopics.some((t) => (q.topics || []).includes(t))
    );
  }, [questions, selectedTopics]);

  const basePool = useMemo(() => {
    if (mode === 'weak') {
      const weakPool = getQuestionsForWeakTopics(questions, weakTopics);
      if (selectedTopics.length === 0) return weakPool;
      return weakPool.filter((q) =>
        selectedTopics.some((t) => (q.topics || []).includes(t))
      );
    }
    if (mode === 'review') {
      const reviewPool = getQuestionsForReview(questions, progress);
      if (selectedTopics.length === 0) return reviewPool;
      return reviewPool.filter((q) =>
        selectedTopics.some((t) => (q.topics || []).includes(t))
      );
    }
    return filteredQuestions;
  }, [mode, questions, weakTopics, progress, filteredQuestions, selectedTopics]);

  const currentQuestion = shuffled.length > 0 ? shuffled[currentIndex] : null;
  const isFinished = shuffled.length > 0 && currentIndex >= shuffled.length;

  useEffect(() => {
    setQuestions(questionsData.questions);
    setShuffled(smartShuffle(questionsData.questions, progress));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isFinished || sessionRecordedRef.current) return;
    sessionRecordedRef.current = true;

    const pct = Math.round((score / shuffled.length) * 100);
    setProgress((prev) =>
      recordSession(prev, {
        score,
        total: shuffled.length,
        pct,
        mode,
        topics: selectedTopics,
        questionIds: shuffled.map((q) => q.id),
      })
    );
  }, [isFinished, score, shuffled, mode, selectedTopics, setProgress]);

  const startQuiz = useCallback(
    (pool, nextMode = 'all') => {
      setMode(nextMode);
      setShuffled(smartShuffle(pool.length > 0 ? pool : questions, progress));
      setCurrentIndex(0);
      setScore(0);
      setAnswered(0);
      sessionRecordedRef.current = false;
    },
    [questions, progress]
  );

  const handlePick = useCallback(
    (correct, question) => {
      setAnswered((a) => a + 1);
      if (correct) setScore((s) => s + 1);
      setProgress((prev) => recordAnswer(prev, question, correct));
    },
    [setProgress]
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => i + 1);
  }, []);

  const handleRestart = useCallback(() => {
    startQuiz(basePool, mode);
  }, [basePool, mode, startQuiz]);

  const handleStartWeak = useCallback(() => {
    const pool = getQuestionsForWeakTopics(questions, weakTopics);
    startQuiz(pool, 'weak');
  }, [questions, weakTopics, startQuiz]);

  const handleStartReview = useCallback(() => {
    const pool = getQuestionsForReview(questions, progress);
    startQuiz(pool, 'review');
  }, [questions, progress, startQuiz]);

  const handleClearProgress = useCallback(() => {
    if (!window.confirm('Clear all quiz progress and history?')) return;
    setProgress(EMPTY_PROGRESS);
  }, [setProgress]);

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
    setSelectedTopics((prev) => {
      const next = prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic];
      restartWithFilters(next, questions, mode);
      return next;
    });
  }

  function handleClearTopics() {
    setSelectedTopics([]);
    restartWithFilters([], questions, mode);
  }

  function restartWithFilters(topics, allQuestions, currentMode) {
    let pool;
    if (currentMode === 'weak') {
      pool = getQuestionsForWeakTopics(allQuestions, getWeakTopics(progress, allQuestions));
    } else if (currentMode === 'review') {
      pool = getQuestionsForReview(allQuestions, progress);
    } else {
      pool =
        topics.length === 0
          ? allQuestions
          : allQuestions.filter((q) => topics.some((t) => (q.topics || []).includes(t)));
    }

    if (topics.length > 0) {
      pool = pool.filter((q) => topics.some((t) => (q.topics || []).includes(t)));
    }

    startQuiz(pool, currentMode);
  }

  const lifetimeAccuracy = getLifetimeAccuracy(progress.stats);
  const bestPct = getBestPct(progress.sessions);

  function centerContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (basePool.length === 0) {
      const emptyMessage =
        mode === 'weak'
          ? 'Not enough data for weak-topic practice yet. Answer more questions first.'
          : mode === 'review'
            ? 'No missed questions to review. Great job!'
            : 'No questions match the selected topics.';

      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>{emptyMessage}</p>
            {mode !== 'all' ? (
              <button onClick={() => startQuiz(filteredQuestions, 'all')}>Back to all questions</button>
            ) : (
              <button onClick={handleClearTopics}>Clear filters</button>
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
            totalQuestions={shuffled.length}
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
          questionNumber={currentIndex + 1}
          totalQuestions={shuffled.length}
          score={score}
          answered={answered}
          highlight={syntaxHighlight}
          theme={theme}
          onPick={handlePick}
          onNext={handleNext}
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
          onPracticeWeak={handleStartWeak}
          onReviewMistakes={handleStartReview}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
      }
      sidebar={
          <Sidebar
            totalQuestions={questions.length}
            filteredCount={
              selectedTopics.length > 0 ? filteredQuestions.length : questions.length
            }
            lifetimeAccuracy={lifetimeAccuracy}
            sessionCount={progress.sessions.length}
            bestPct={bestPct}
            weakTopics={weakTopics}
            missedCount={missedCount}
            onPracticeWeak={handleStartWeak}
            onReviewMistakes={handleStartReview}
            onClearProgress={handleClearProgress}
          />
        }
        center={centerContent()}
        panel={
          <FilterPanel
            questions={questions}
            selectedTopics={selectedTopics}
            onToggleTopic={handleToggleTopic}
            onClear={handleClearTopics}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            syntaxHighlight={syntaxHighlight}
            onToggleHighlight={() => setSyntaxHighlight((v) => !v)}
          />
        }
      />
  );
}
