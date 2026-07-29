import { useState } from 'react';
import CodeBody from './CodeBody';
import DifficultyBadge from './DifficultyBadge';
import OptionList from './OptionList';
import Explanation from './Explanation';
import StarButton from './StarButton';
import CompletedButton from './CompletedButton';

export default function QuizQuestion({
  question,
  remaining,
  sessionTotal,
  score,
  answered,
  highlight,
  theme,
  onPick,
  onNext,
  onSkip,
  onArchive,
  isStarred = false,
  onToggleStar,
  isCompleted = false,
  onToggleCompleted,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selected, setSelected] = useState(null);

  const isLast = remaining === 1;
  const progressPct = sessionTotal > 0 ? ((sessionTotal - remaining) / sessionTotal) * 100 : 0;

  function handlePick(key) {
    if (selected !== null) return;
    setSelected(key);
    onPick(key === question.answer, question);
  }

  function resetQuestionView() {
    setSelected(null);
    setShowOptions(false);
    setShowExplanation(false);
  }

  function handleNext() {
    onNext();
    resetQuestionView();
  }

  function handleArchive() {
    onArchive(question);
    resetQuestionView();
  }

  function handleSkip() {
    onSkip(question);
    resetQuestionView();
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <span className="progress">Left in pass {remaining}/{sessionTotal}</span>
          <div className="quiz-header-badges">
            {isCompleted && <span className="completed-badge">Mastered</span>}
            <span className="score-badge">
              Answered {answered} · Score {score}/{answered}
            </span>
            {onToggleCompleted && (
              <CompletedButton isCompleted={isCompleted} onToggle={onToggleCompleted} />
            )}
            {onToggleStar && (
              <StarButton isStarred={isStarred} onToggle={onToggleStar} />
            )}
          </div>
        </div>
        <div className="quiz-progress-bar" aria-hidden="true">
          <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="quiz-scroll">
        <div className="quiz-question-area">
          {(question.difficulty || question.topics?.length > 0) && (
            <div className="topic-badges">
              <DifficultyBadge difficulty={question.difficulty} />
              {question.topics?.map((topic) => (
                <span key={topic} className="topic-badge">{topic}</span>
              ))}
            </div>
          )}
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
        <div className="quiz-footer-actions">
          <button type="button" className="skip-btn" onClick={handleSkip}>
            Skip
          </button>
          <button type="button" className="archive-btn" onClick={handleArchive}>
            Archive
          </button>
          <button type="button" className="next-btn" onClick={handleNext}>
            {isLast ? 'Finish quiz →' : 'Next question →'}
          </button>
        </div>
      </div>
    </div>
  );
}
