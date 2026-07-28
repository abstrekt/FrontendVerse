import { useState } from 'react';
import CodeBody from './CodeBody';
import { runOutputCode } from '../utils/jsRunner';
import { compareOutputAnswer, formatExpectedOutput } from '../utils/outputCompare';

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
}) {
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [runtimeOutput, setRuntimeOutput] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

  const isLast = remaining === 1;
  const progressPct = sessionTotal > 0 ? ((sessionTotal - remaining) / sessionTotal) * 100 : 0;

  async function handleCheck() {
    if (checking) return;

    setChecking(true);
    try {
      const runtimeResult = await runOutputCode(question.code, { async: question.async });
      const comparison = compareOutputAnswer(answer, runtimeResult, question.expectedLines);
      const actualOutput = formatExpectedOutput(runtimeResult.lines, runtimeResult.error);

      setRuntimeOutput(actualOutput);
      setCorrect(comparison.correct);
      if (!checked) {
        setChecked(true);
        onCheck(comparison.correct, question);
      }
    } finally {
      setChecking(false);
    }
  }

  function resetQuestionView() {
    setAnswer('');
    setChecked(false);
    setChecking(false);
    setCorrect(false);
    setRuntimeOutput('');
    setShowExplanation(false);
  }

  function handleNext() {
    onNext();
    resetQuestionView();
  }

  return (
    <div className="quiz-container output-quiz">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <span className="progress">Remaining {remaining}/{sessionTotal}</span>
          <div className="quiz-header-badges">
            {isCompleted && <span className="completed-badge">Completed</span>}
            <span className="score-badge">
              Answered {answered}
              {answered > 0 ? ` · Score ${score}/${answered}` : ''}
            </span>
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
              disabled={checked}
              spellCheck={false}
            />
            <p className="output-answer-hint">
              For multiple lines, separate values with commas or new lines.
            </p>
          </div>

          {checked && (
            <div className={`output-result ${correct ? 'correct' : 'incorrect'}`}>
              <p className="output-result-title">
                {correct ? 'Correct!' : 'Not quite'}
              </p>
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
                  <p>{question.explanation}</p>
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
              {checking ? 'Running code...' : 'Check answer'}
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
