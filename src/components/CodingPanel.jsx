import DifficultyBadge from './DifficultyBadge';
import StarredFilterToggle from './StarredFilterToggle';
import Icon from './Icon';

export default function CodingPanel({
  questions,
  starredIds = [],
  completedIds = [],
  selectedQuestionId,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onSelect,
  title = 'Javascript Coding',
}) {
  const starredSet = new Set(starredIds);
  const completedSet = new Set(completedIds);

  return (
    <div className="learnings-panel-body">
      <div className="panel-subheader learnings-panel-header">
        <span>{title}</span>
        <span className="learnings-count">{questions.length}</span>
      </div>

      {onStarredOnlyChange && (
        <StarredFilterToggle
          checked={starredOnly}
          count={starredCount}
          onChange={onStarredOnlyChange}
          hint={starredOnly ? 'Only starred challenges appear in the quiz.' : 'All active challenges are shown.'}
        />
      )}

      {questions.length === 0 ? (
        <div className="no-filters">
          {starredOnly ? 'No starred challenges yet.' : 'No challenges yet'}
        </div>
      ) : (
        <ul className="learnings-nav-list">
          {questions.map((question) => (
            <li key={question.id}>
              <button
                type="button"
                className={`learning-nav-item${question.id === selectedQuestionId ? ' active' : ''}`}
                onClick={() => onSelect(question.id)}
              >
                <span className="learning-nav-meta">
                  <span className="learning-nav-id">#{question.id}</span>
                  {starredSet.has(question.id) && (
                    <span className="learning-nav-star">
                      <Icon name="star" size={12} filled />
                      <span className="sr-only">Starred</span>
                    </span>
                  )}
                  {completedSet.has(question.id) && (
                    <span className="learning-nav-completed">
                      <Icon name="check" size={12} />
                      <span className="sr-only">Mastered</span>
                    </span>
                  )}
                  <DifficultyBadge difficulty={question.difficulty} />
                </span>
                <span className="learning-nav-title">{question.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
