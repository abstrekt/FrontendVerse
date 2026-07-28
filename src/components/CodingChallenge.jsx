import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeEditor from './CodeEditor';
import DifficultyBadge from './DifficultyBadge';
import { runCodingTests } from '../utils/codingRunner';
import StarButton from './StarButton';

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

function formatValue(value) {
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
}) {
  const [code, setCode] = useState(question.template);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const isLast = remaining === 1;
  const progressPct = sessionTotal > 0 ? ((sessionTotal - remaining) / sessionTotal) * 100 : 0;

  async function handleRunTests() {
    if (checking) return;
    setChecking(true);
    try {
      const { passed, total, results } = await runCodingTests(code, question);
      setTestResults(results);
      const passedAll = passed === total;
      setAllPassed(passedAll);
      if (!checked) {
        setChecked(true);
        onCheck(passedAll, question);
      }
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    setCode(question.template);
    setTestResults(null);
    setAllPassed(false);
    setShowExplanation(false);
    onNext();
  }

  return (
    <div className="quiz-container coding-container">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <span className="progress">Remaining {remaining}/{sessionTotal}</span>
          <div className="quiz-header-badges">
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
              {onToggleStar && <StarButton isStarred={isStarred} onToggle={onToggleStar} />}
            </div>
          </div>

          <div className="coding-description">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {question.description}
            </ReactMarkdown>
          </div>

          {testResults && testResults.length > 0 && (
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.explanation}
                  </ReactMarkdown>
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
          </div>
          <CodeEditor
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
            >
              {checking ? 'Running tests...' : 'Run tests'}
            </button>
          </div>

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
                        <code className="coding-test-value">
                          {formatValue(result.expected)}
                        </code>
                      </div>
                      <div className="coding-test-row">
                        <span className="coding-test-label">Got:</span>
                        <code className="coding-test-value">
                          {formatValue(result.got)}
                        </code>
                      </div>
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
