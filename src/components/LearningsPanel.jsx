import StarredFilterToggle from './StarredFilterToggle';

function stripMarkdown(text) {
  return text.replace(/`([^`]+)`/g, '$1');
}

export default function LearningsPanel({
  learnings,
  starredIds = [],
  selectedLearningId,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onSelect,
  title = 'Javascript learnings',
}) {
  const starredSet = new Set(starredIds);

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
          {learnings.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`learning-nav-item${item.id === selectedLearningId ? ' active' : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <span className="learning-nav-meta">
                  <span className="learning-nav-id">#{item.id}</span>
                  {starredSet.has(item.id) && <span className="learning-nav-star" aria-label="Starred">★</span>}
                </span>
                <span className="learning-nav-title">{stripMarkdown(item.title)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
