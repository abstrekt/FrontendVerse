import { useState, useEffect, useRef } from 'react';
import CodeBody from './CodeBody';
import CodeEditor from './CodeEditor';
import DifficultyBadge from './DifficultyBadge';
import { runCodingTestsSafely } from '../utils/sandboxClient';
import {
  loadCodingSubmissions,
  saveCodingDraft,
  recordCodingSubmission,
  getInitialCode,
} from '../utils/codingSubmissions';
import StarButton from './StarButton';
import { clampPct } from '../utils/passProgress';
import CompletedButton from './CompletedButton';

function formatTestCase(tc) {
  if (tc.input?.promises !== undefined) {
    return `promises = ${JSON.stringify(tc.input.promises)}\norder = ${JSON.stringify(tc.input.order)}`;
  }
  const lines = [];
  if (tc.setup) lines.push(tc.setup);
  if (tc.code) lines.push(`// => ${tc.code}`);
  if (tc.calls?.length) {
    lines.push('// timer calls:');
    tc.calls.forEach((c) => lines.push(`  ${c.expr ?? ''}${c.advance ? ` (advance ${c.advance}ms)` : ''}`));
  }
  return lines.join('\n') || JSON.stringify(tc, null, 2);
}

function formatSubmissionTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CodingChallenge({
  question,
  remaining,
  sessionTotal,
  score,
  answered,
  highlight,
  theme,
  onCheck,
  onNext,
  onArchive,
  isStarred = false,
  onToggleStar,
  isCompleted = false,
  onToggleCompleted,
}) {
  // Lazy initialiser: passing the call directly re-parsed the entire
  // submission store on every render, including every keystroke in the editor.
  const submissionsRef = useRef(null);
  if (submissionsRef.current === null) submissionsRef.current = loadCodingSubmissions();
  const questionIdRef = useRef(question.id);
  const codeRef = useRef('');
  const [code, setCode] = useState(() => getInitialCode(submissionsRef.current, question));
  const [submissionHistory, setSubmissionHistory] = useState(
    () => submissionsRef.current.byQuestion[String(question.id)]?.history ?? []
  );
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [runError, setRunError] = useState(null);

  const isLast = remaining === 1;
  const progressPct = clampPct(sessionTotal, remaining);

  useEffect(() => {
    questionIdRef.current = question.id;
  }, [question.id]);

  useEffect(() => {
    submissionsRef.current = loadCodingSubmissions();
    setCode(getInitialCode(submissionsRef.current, question));
    setSubmissionHistory(submissionsRef.current.byQuestion[String(question.id)]?.history ?? []);
    setChecked(false);
    setTestResults(null);
    setAllPassed(false);
    setRunError(null);
    setShowSubmissions(false);
  }, [question.id]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Debounced draft autosave.
  useEffect(() => {
    const questionId = questionIdRef.current;
    const timer = setTimeout(() => {
      submissionsRef.current = saveCodingDraft(submissionsRef.current, questionId, code);
    }, 400);
    return () => clearTimeout(timer);
  }, [code]);

  // Flush the pending draft when leaving the question. Without this, typing and
  // switching away inside the 400ms window discarded the edit: the debounce
  // cleanup cancelled the timer and nothing ever wrote it.
  useEffect(() => {
    const questionId = question.id;
    return () => {
      submissionsRef.current = saveCodingDraft(submissionsRef.current, questionId, codeRef.current);
    };
  }, [question.id]);

  async function handleRunTests() {
    if (checking) return;
    setChecking(true);
    setRunError(null);
    try {
      const { passed, total, results } = await runCodingTestsSafely(code, question);
      setTestResults(results);
      const passedAll = passed === total;

      submissionsRef.current = recordCodingSubmission(submissionsRef.current, question.id, code, {
        passed: passedAll,
        passedCount: passed,
        totalCount: total,
      });
      setSubmissionHistory(submissionsRef.current.byQuestion[String(question.id)]?.history ?? []);

      if (!checked) setChecked(true);
      onCheck(passedAll, question);
      setAllPassed(passedAll);
    } catch (err) {
      // Timeouts and worker crashes land here. Without this the spinner just
      // stopped and the UI sat there with no explanation.
      setRunError(err?.message || 'Could not run your code.');
      setTestResults(null);
      setAllPassed(false);
    } finally {
      setChecking(false);
    }
  }

  function handleLoadSubmission(submission) {
    setCode(submission.code);
    setTestResults(null);
    setAllPassed(false);
  }

  function handleNext() {
    setTestResults(null);
    setAllPassed(false);
    setShowExplanation(false);
    onNext();
  }

  return (
    <div className="quiz-container coding-container">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <span className="progress">Left in pass {remaining}/{sessionTotal}</span>
          <div className="quiz-header-badges">
            {isCompleted && <span className="completed-badge">Mastered</span>}
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

      <div className="coding-split">
        <div className="coding-problem">
          <div className="coding-problem-header">
            <h2 className="coding-title">{question.title}</h2>
            <div className="coding-badges">
              <DifficultyBadge difficulty={question.difficulty} />
              {question.topics?.map((topic) => (
                <span key={topic} className="topic-badge">{topic}</span>
              ))}
              {onToggleCompleted && <CompletedButton isCompleted={isCompleted} onToggle={onToggleCompleted} />}
              {onToggleStar && <StarButton isStarred={isStarred} onToggle={onToggleStar} />}
            </div>
          </div>

          <div className="coding-description">
            <CodeBody content={question.description} highlight={highlight} theme={theme} />
          </div>

          {question.testCases?.length > 0 && (
            <div className="coding-sample-cases">
              <h3 className="coding-sample-heading">Sample Cases</h3>
              {question.testCases.map((tc, i) => (
                <div key={i} className="coding-sample-case">
                  <p className="coding-sample-label">Test {i + 1}</p>
                  <pre className="coding-sample-pre">
                    {formatTestCase(tc)}
                  </pre>
                  <p className="coding-sample-label">Expected</p>
                  <pre className="coding-sample-pre">
                    {JSON.stringify(tc.expected ?? tc.input?.expected, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {question.explanation && (
            <div className="quiz-controls coding-explanation-controls">
              <button
                type="button"
                className={`toggle-btn${showExplanation ? ' open' : ''}`}
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="chevron">{showExplanation ? '\u25BE' : '\u25B8'}</span>
                {showExplanation ? 'Hide explanation' : 'Show explanation'}
              </button>

              {showExplanation && (
                <div className="explanation-panel expanded coding-explanation-panel">
                  <CodeBody content={question.explanation} highlight={highlight} theme={theme} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="coding-editor-panel">
          <div className="coding-editor-header">
            <label className="coding-editor-label" htmlFor={`coding-editor-${question.id}`}>
              Code
            </label>
            {submissionHistory.length > 0 && (
              <button
                type="button"
                className={`toggle-btn coding-submissions-toggle${showSubmissions ? ' open' : ''}`}
                onClick={() => setShowSubmissions(!showSubmissions)}
              >
                <span className="chevron">{showSubmissions ? '\u25BE' : '\u25B8'}</span>
                {submissionHistory.length} previous submission{submissionHistory.length === 1 ? '' : 's'}
              </button>
            )}
          </div>

          {showSubmissions && submissionHistory.length > 0 && (
            <ul className="coding-submissions-list">
              {submissionHistory.map((submission, i) => (
                <li key={submission.ts} className="coding-submission-item">
                  <div className="coding-submission-meta">
                    <span className="coding-submission-time">{formatSubmissionTime(submission.ts)}</span>
                    <span className={submission.passed ? 'test-pass' : 'test-fail'}>
                      {submission.passed
                        ? 'All passed'
                        : `${submission.passedCount}/${submission.totalCount} passed`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="coding-submission-load-btn"
                    onClick={() => handleLoadSubmission(submission)}
                    disabled={code === submission.code}
                  >
                    {code === submission.code ? 'In editor' : 'Load'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <CodeEditor
            key={question.id}
            id={`coding-editor-${question.id}`}
            value={code}
            onChange={setCode}
            theme={theme}
          />

          <div className="coding-actions">
            <button
              type="button"
              className="output-check-btn coding-run-btn"
              onClick={handleRunTests}
              disabled={checking}
              aria-busy={checking}
            >
              {checking ? 'Running tests...' : 'Run tests'}
            </button>
          </div>

          {/* The pass/fail list below is visual only. Always mounted so the
              text change is what gets announced. */}
          <p className="sr-only" role="status" aria-live="polite">
            {checking
              ? 'Running tests.'
              : testResults
                ? (() => {
                    const passed = testResults.filter((r) => r.passed).length;
                    const failed = testResults
                      .map((r, i) => (r.passed ? null : i + 1))
                      .filter(Boolean);
                    return `${passed} of ${testResults.length} tests passed.${
                      failed.length ? ` Failed: test ${failed.join(', test ')}.` : ''
                    }`;
                  })()
                : ''}
          </p>

          {runError && (
            <p className="coding-run-error" role="alert">
              {runError}
            </p>
          )}

          {testResults && (
            <div className="coding-results">
              <div className="coding-results-header">
                <span>
                  Test cases: {testResults.filter((r) => r.passed).length}/{testResults.length} passed
                </span>
                {allPassed && <span className="coding-all-passed">All passed</span>}
              </div>
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`coding-test-case ${result.passed ? 'passed' : 'failed'}`}
                >
                  <div className="coding-test-case-header">
                    <span>Test Case {i + 1}</span>
                    <span className={result.passed ? 'test-pass' : 'test-fail'}>
                      {result.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  {!result.passed && (
                    <div className="coding-test-detail">
                      <div className="coding-test-row">
                        <span className="coding-test-label">Expected:</span>
                        <code className="coding-test-value">{result.expectedDisplay}</code>
                      </div>
                      <div className="coding-test-row">
                        <span className="coding-test-label">Got:</span>
                        <code className="coding-test-value">{result.gotDisplay}</code>
                      </div>
                    </div>
                  )}
                  {result.logs?.length > 0 && (
                    <div className="coding-test-logs">
                      <span className="coding-test-label">console:</span>
                      <pre className="coding-test-log-lines">{result.logs.join('\n')}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="coding-footer-actions">
            <button type="button" className="archive-btn" onClick={() => onArchive(question)}>
              Archive
            </button>
            <button
              type="button"
              className="next-btn"
              onClick={handleNext}
            >
              {isLast ? 'Finish quiz \u2192' : 'Next question \u2192'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
