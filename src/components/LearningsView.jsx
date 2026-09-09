import { useEffect, useRef } from 'react';
import CodeBody from './CodeBody';
import LearningBadges from './LearningBadges';
import StarButton from './StarButton';
import CompletedButton from './CompletedButton';

function stripMarkdown(text) {
  return text.replace(/`([^`]+)`/g, '$1');
}

export default function LearningsView({
  learning,
  onArchive,
  isStarred = false,
  onToggleStar,
  isCompleted = false,
  onToggleCompleted,
  highlight,
  theme,
  onNavigate,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [learning?.id]);

  if (!learning) {
    return (
      <div className="quiz-container learnings-view">
        <div className="filtered-empty">
          <p>No learnings available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container learnings-view">
      <div className="learning-header">
        <div className="learning-content">
          <LearningBadges company={learning.company} tags={learning.tags} />
          <div className="learning-title-row">
            <h2 className="learning-title">{stripMarkdown(learning.title)}</h2>
            <div className="learning-title-actions">
              {isCompleted && <span className="completed-badge">Mastered</span>}
              {onToggleCompleted && <CompletedButton isCompleted={isCompleted} onToggle={onToggleCompleted} />}
              {onToggleStar && <StarButton isStarred={isStarred} onToggle={onToggleStar} />}
              <button
                type="button"
                className="archive-btn learning-archive-btn"
                onClick={() => onArchive(learning)}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="learning-answer-scroll">
        <div className="learning-content learning-answer">
          <CodeBody
            content={learning.answer}
            highlight={highlight}
            theme={theme}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}
