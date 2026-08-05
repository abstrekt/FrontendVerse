import { useState } from 'react';
import CodeBody from './CodeBody';
import { runOutputCodeSafely } from '../utils/sandboxClient';
import { compareOutputAnswer, formatExpectedOutput } from '../utils/outputCompare';
import StarButton from './StarButton';
import CompletedButton from './CompletedButton';
import { clampPct } from '../utils/passProgress';

export default function OutputQuizQuestion({
  question,
  remaining,
  sessionTotal,
  score,
  answered,
  isCompleted = false,
  highlight,
  theme,
  sourceUrl,
  onCheck,
  onNext,
  onSkip,
  onArchive,
  isStarred = false,
  onToggleStar,
  onToggleCompleted,
}) {
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [caseMismatch, setCaseMismatch] = useState(false);
  const [runtimeOutput, setRuntimeOutput] = useState('');
  const [runError, setRunError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isLast = remaining === 1;
  const progressPct = clampPct(sessionTotal, remaining);

  async function handleCheck() {
    if (checking) return;

    setChecking(true);
    setRunError(null);
    try {
      const runtimeResult = await runOutputCodeSafely(question.code, { async: question.async });
      const comparison = compareOutputAnswer(answer, runtimeResult, question.expectedLines);

      setRuntimeOutput(formatExpectedOutput(runtimeResult.lines, runtimeResult.error));
      setCorrect(comparison.correct);
      setCaseMismatch(Boolean(comparison.caseMismatch));
      // Only the first check counts toward the score; later ones let you
      // compare a revised guess without being penalised twice.
      if (!checked) {
        setChecked(true);
        onCheck(comparison.correct, question);
      }
    } catch (err) {
      setRunError(err?.message || 'Could not run this snippet.');
    } finally {
      setChecking(false);
    }
  }

  function resetQuestionView() {
    setAnswer('');
    setChecked(false);
    setChecking(false);
    setCorrect(false);
    setCaseMismatch(false);
    setRuntimeOutput('');
    setRunError(null);
    setShowExplanation(false);
  }

  function handleSkip() {
    onSkip?.(question);
    resetQuestionView();
  }

  function handleNext() {
    onNext();
    resetQuestionView();
  }

  return (
    <div className="quiz-container output-quiz">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <span className="progress">Left in pass {remaining}/{sessionTotal}</span>
          <div className="quiz-header-badges">
            {isCompleted && <span className="completed-badge">Mastered</span>}
            <span className="score-badge">
              Answered {answered}
              {answered > 0 ? ` · Score ${score}/${answered}` : ''}
            </span>
            {onToggleCompleted && (
              <CompletedButton isCompleted={isCompleted} onToggle={onToggleCompleted} />
            )}
            {onToggleStar && <StarButton isStarred={isStarred} onToggle={onToggleStar} />}
          </div>
        </div>
        <div className="quiz-progress-bar" aria-hidden="true">
          <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="quiz-scroll">
        <div className="quiz-question-area">
          <h2 className="question-text">{question.question}</h2>
          {question.body && (
            <CodeBody content={question.body} highlight={highlight} theme={theme} />
          )}

          <div className="output-answer-section">
            <label className="output-answer-label" htmlFor={`output-answer-${question.id}`}>
              Your predicted output
            </label>
            <textarea
              id={`output-answer-${question.id}`}
              className="output-answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type the console output (e.g. 10, true, ReferenceError: ...)"
              rows={4}
              spellCheck={false}
            />
            <p className="output-answer-hint">
              Case matters. For multiple lines, separate values with commas or new lines.
            </p>
          </div>

          {runError && (
            <p className="output-run-error" role="alert">
              {runError}
            </p>
          )}

          {checked && (
            <div className={`output-result ${correct ? 'correct' : 'incorrect'}`} role="status">
              <p className="output-result-title">
                {correct ? 'Correct!' : 'Not quite'}
              </p>
              {caseMismatch && (
                <p className="output-result-hint">
                  That is right apart from capitalisation — in JavaScript, case is
                  often the whole answer.
                </p>
              )}
              <p className="output-result-text">
                Runtime output: <code className="output-runtime-output">{runtimeOutput || '(no output)'}</code>
              </p>
            </div>
          )}

          {question.explanation && (
            <div className="quiz-controls output-explanation-controls">
              <button
                type="button"
                className={`toggle-btn${showExplanation ? ' open' : ''}`}
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="chevron">{showExplanation ? '▾' : '▸'}</span>
                {showExplanation ? 'Hide explanation' : 'Show explanation'}
              </button>

              {showExplanation && (
                <div className="explanation-panel expanded output-explanation-panel">
                  <CodeBody content={question.explanation} highlight={highlight} theme={theme} />
                </div>
              )}
            </div>
          )}

          <div className="output-quiz-actions">
            <button
              type="button"
              className="output-check-btn"
              onClick={handleCheck}
              disabled={checking}
            >
              {checking ? 'Running code...' : checked ? 'Check again' : 'Check answer'}
            </button>
            {onSkip && (
              <button type="button" className="skip-btn" onClick={handleSkip}>
                Skip
              </button>
            )}
            <button type="button" className="archive-btn" onClick={() => onArchive(question)}>
              Archive
            </button>
            <button
              type="button"
              className="next-btn"
              onClick={handleNext}
            >
              {isLast ? 'Finish quiz →' : 'Next question →'}
            </button>
          </div>
        </div>
      </div>

      <div className="quiz-footer output-quiz-footer">
        <div className="output-attribution">
          Questions from{' '}
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            Javascript-Output-Based-Questions
          </a>
        </div>
      </div>
    </div>
  );
}
