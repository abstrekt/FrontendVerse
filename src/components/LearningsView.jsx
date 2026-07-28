import { useEffect, useRef } from 'react';
import CodeBody from './CodeBody';

function stripMarkdown(text) {
  return text.replace(/`([^`]+)`/g, '$1');
}

export default function LearningsView({
  learning,
  learnings,
  selectedLearningId,
  onSelectLearning,
  highlight,
  theme,
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
      <div className="learning-mobile-picker" role="tablist" aria-label="Select learning">
        {learnings.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === selectedLearningId}
            className={`learning-mobile-chip${item.id === selectedLearningId ? ' active' : ''}`}
            onClick={() => onSelectLearning(item.id)}
          >
            #{item.id}
          </button>
        ))}
      </div>

      <div className="learning-header">
        <div className="learning-content">
          {learning.tags?.length > 0 && (
            <div className="topic-badges learning-tags">
              {learning.tags.map((tag) => (
                <span key={tag} className="topic-badge">{tag}</span>
              ))}
            </div>
          )}
          <h2 className="learning-title">{stripMarkdown(learning.title)}</h2>
        </div>
      </div>

      <div ref={scrollRef} className="learning-answer-scroll">
        <div className="learning-content learning-answer">
          <CodeBody content={learning.answer} highlight={highlight} theme={theme} />
        </div>
      </div>
    </div>
  );
}
