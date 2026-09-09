import { useEffect, useMemo, useRef, useState } from 'react';
import CodeBody from './CodeBody';
import DifficultyBadge from './DifficultyBadge';
import OptionList from './OptionList';
import Explanation from './Explanation';
import StarButton from './StarButton';
import CompletedButton from './CompletedButton';
import { clampPct } from '../utils/passProgress';
import { presentOptions } from '../utils/optionOrder';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Icon from './Icon';

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
  const headingRef = useRef(null);

  const isLast = remaining === 1;
  const progressPct = clampPct(sessionTotal, remaining);

  // Options are presented in a stable, id-seeded order so the correct answer
  // is not disproportionately B. `answer` is the *displayed* key.
  const { options, answer } = useMemo(
    () => presentOptions(question.options, question.answer, question.id),
    [question.options, question.answer, question.id]
  );

  // Move focus to the question when a new one appears, so a screen-reader user
  // pressing Next lands on the new content instead of losing their place.
  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  function handlePick(key) {
    if (selected !== null) return;
    setSelected(key);
    onPick(key === answer, question);
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

  function pickByIndex(index) {
    const option = options[index];
    if (!option) return;
    setShowOptions(true);
    handlePick(option.key);
  }

  const shortcuts = useMemo(() => {
    const map = {
      Enter: handleNext,
      n: handleNext,
      ArrowRight: handleNext,
      s: handleSkip,
      o: () => setShowOptions((open) => !open),
      e: () => setShowExplanation((open) => !open),
    };
    // 1-4 and a-d pick an option, matching what is on screen.
    options.forEach((option, index) => {
      map[String(index + 1)] = () => pickByIndex(index);
      map[option.key.toLowerCase()] = () => pickByIndex(index);
    });
    return map;
  }, [options, selected, question.id]);

  useKeyboardShortcuts(shortcuts);

  const answeredResult = selected === null ? null : selected === answer;

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
          <h1 className="question-text" tabIndex={-1} ref={headingRef}>
            {question.question}
          </h1>
          {question.body && (
            <CodeBody content={question.body} highlight={highlight} theme={theme} />
          )}
        </div>

        {/* Correct/incorrect is otherwise conveyed only by colour and an icon. */}
        <p className="sr-only" role="status" aria-live="polite">
          {answeredResult === null
            ? ''
            : answeredResult
              ? `Correct. The answer is ${answer}.`
              : `Incorrect. You chose ${selected}. The answer is ${answer}.`}
        </p>

        <div className="quiz-controls">
          <div className="quiz-toggles">
            <button
              type="button"
              className={`toggle-btn${showOptions ? ' open' : ''}`}
              aria-expanded={showOptions}
              onClick={() => setShowOptions(!showOptions)}
            >
              <span className="chevron"><Icon name={showOptions ? 'chevron-down' : 'chevron-right'} size={14} /></span>
              {showOptions ? 'Hide options' : 'Show options'}
              <kbd className="shortcut-hint">O</kbd>
            </button>

            <button
              type="button"
              className={`toggle-btn${showExplanation ? ' open' : ''}`}
              aria-expanded={showExplanation}
              onClick={() => setShowExplanation(!showExplanation)}
            >
              <span className="chevron"><Icon name={showExplanation ? 'chevron-down' : 'chevron-right'} size={14} /></span>
              {showExplanation ? 'Hide explanation' : 'Show explanation'}
              <kbd className="shortcut-hint">E</kbd>
            </button>
          </div>

          {(showOptions || showExplanation) && (
            <div className="quiz-expandable-zone">
              {showOptions && (
                <div className="options-panel expanded">
                  <OptionList
                    options={options}
                    selected={selected}
                    answer={answer}
                    onPick={handlePick}
                  />
                </div>
              )}

              {showExplanation && (
                <div className="explanation-panel expanded">
                  <Explanation
                    content={question.explanation}
                    answer={answer}
                    revealAnswer={selected !== null}
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
            {isLast ? 'Finish quiz' : 'Next question'}
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
