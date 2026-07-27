import { useState } from 'react';
import CodeBody from './CodeBody';
import OptionList from './OptionList';
import Explanation from './Explanation';

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  score,
  answered,
  highlight,
  theme,
  onPick,
  onNext,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selected, setSelected] = useState(null);

  const isLast = questionNumber === totalQuestions;

  function handlePick(key) {
    if (selected !== null) return;
    setSelected(key);
    onPick(key === question.answer, question);
  }

  function handleNext() {
    if (selected === null) return;
    onNext();
    setSelected(null);
    setShowOptions(false);
    setShowExplanation(false);
  }

  const progressPct = (questionNumber / totalQuestions) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <span className="progress">Question {questionNumber} of {totalQuestions}</span>
          <span className="score-badge">Score {score}/{answered}</span>
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
        </div>

        <div className="quiz-controls">
          <div className="quiz-toggles">
            <button
              type="button"
              className={`toggle-btn${showOptions ? ' open' : ''}`}
              onClick={() => setShowOptions(!showOptions)}
            >
              <span className="chevron">{showOptions ? '▾' : '▸'}</span>
              {showOptions ? 'Hide options' : 'Show options'}
            </button>

            <button
              type="button"
              className={`toggle-btn${showExplanation ? ' open' : ''}`}
              onClick={() => setShowExplanation(!showExplanation)}
            >
              <span className="chevron">{showExplanation ? '▾' : '▸'}</span>
              {showExplanation ? 'Hide explanation' : 'Show explanation'}
            </button>
          </div>

          {(showOptions || showExplanation) && (
            <div className="quiz-expandable-zone">
              {showOptions && (
                <div className="options-panel expanded">
                  <OptionList
                    options={question.options}
                    selected={selected}
                    answer={question.answer}
                    onPick={handlePick}
                  />
                </div>
              )}

              {showExplanation && (
                <div className="explanation-panel expanded">
                  <Explanation
                    content={question.explanation}
                    answer={question.answer}
                    highlight={highlight}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="quiz-footer">
        <button type="button" className="next-btn" onClick={handleNext}>
          {isLast ? 'Finish quiz →' : 'Next question →'}
        </button>
        <div className="keyboard-hint">Press <kbd>Enter</kbd> for next question</div>
      </div>
    </div>
  );
}
