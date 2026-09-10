import { useEffect, useRef } from 'react';
import StarredFilterToggle from './StarredFilterToggle';
import Icon from './Icon';

function stripMarkdown(text) {
  return (text || '').replace(/`([^`]+)`/g, '$1');
}

export default function LearningsPanel({
  learnings,
  starredIds = [],
  completedIds = [],
  selectedLearningId,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onSelect,
  title = 'Javascript learnings',
}) {
  const activeItemRef = useRef(null);
  const starredSet = new Set(starredIds);
  const completedSet = new Set(completedIds);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedLearningId]);

  return (
    <div className="learnings-panel-body">
      <div className="panel-subheader learnings-panel-header">
        <span>{title}</span>
        <span className="learnings-count">{learnings.length}</span>
      </div>

      {onStarredOnlyChange && (
        <StarredFilterToggle
          checked={starredOnly}
          count={starredCount}
          onChange={onStarredOnlyChange}
          hint={starredOnly ? 'Only starred items appear in the list.' : 'All active learnings are shown.'}
        />
      )}

      {learnings.length === 0 ? (
        <div className="no-filters">
          {starredOnly ? 'No starred learnings yet.' : 'No learnings yet'}
        </div>
      ) : (
        <ul className="learnings-nav-list">
          {learnings.map((item) => {
            const isSelected = item.id === selectedLearningId;
            return (
              <li key={item.id} ref={isSelected ? activeItemRef : null}>
                <button
                  type="button"
                  className={`learning-nav-item${isSelected ? ' active' : ''}`}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="learning-nav-meta">
                    <span className="learning-nav-id">#{item.id}</span>
                    {starredSet.has(item.id) && (
                      <span className="learning-nav-star">
                        <Icon name="star" size={12} filled />
                        <span className="sr-only">Starred</span>
                      </span>
                    )}
                    {completedSet.has(item.id) && (
                      <span className="learning-nav-completed">
                        <Icon name="check" size={12} />
                        <span className="sr-only">Mastered</span>
                      </span>
                    )}
                  </span>
                  <span className="learning-nav-title">{stripMarkdown(item.title)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
