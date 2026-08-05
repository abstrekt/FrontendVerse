import { useMemo } from 'react';
import { DIFFICULTY_LEVELS, DIFFICULTY_LABELS, getDifficultyCompletion, getTopicCompletion } from '../utils/progress';
import StarredFilterToggle from './StarredFilterToggle';

export default function FilterPanel({
  questions,
  progress,
  completedIds = [],
  selectedTopics,
  selectedDifficulties,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onToggleTopic,
  onToggleDifficulty,
  onClear,
}) {
  const topicCompletion = useMemo(
    () => getTopicCompletion(progress, questions, completedIds),
    [progress, questions, completedIds]
  );

  const difficultyCompletion = useMemo(
    () => getDifficultyCompletion(progress, questions, completedIds),
    [progress, questions, completedIds]
  );

  const topicRows = useMemo(() => {
    return [...topicCompletion.entries()]
      .map(([topic, { attempted, total, pct }]) => ({ topic, attempted, total, pct }))
      .sort((a, b) => b.total - a.total);
  }, [topicCompletion]);

  const difficultyRows = useMemo(() => {
    return DIFFICULTY_LEVELS.map((difficulty) => {
      const { attempted, total, pct } = difficultyCompletion.get(difficulty) || {
        attempted: 0,
        total: 0,
        pct: 0,
      };
      return { difficulty, label: DIFFICULTY_LABELS[difficulty], attempted, total, pct };
    });
  }, [difficultyCompletion]);

  const hasActiveFilters =
    selectedTopics.length > 0 || selectedDifficulties.length > 0 || starredOnly;

  return (
    <div className="learnings-panel-body filters-panel-body">
      <div className="panel-subheader learnings-panel-header">
        <span>Javascript MCQs</span>
        <span className="learnings-count">{questions.length}</span>
      </div>

      <StarredFilterToggle
        checked={starredOnly}
        count={starredCount}
        onChange={onStarredOnlyChange}
        hint={starredOnly ? 'Only starred questions appear in quiz and list.' : 'All active questions are included.'}
      />

      <div className="difficulty-panel">
        <div className="panel-subheader">
          <span>Difficulty</span>
          {/* Conditionally rendered rather than hidden: aria-hidden on a
              focusable button is a well-known antipattern. */}
          {hasActiveFilters && (
            <button type="button" className="clear-btn" onClick={onClear}>
              Clear all
            </button>
          )}
        </div>

        <ul className="filter-list difficulty-filter-list">
          {difficultyRows.map(({ difficulty, label, attempted, total, pct }) => (
            <li key={difficulty}>
              <label
                className={`filter-item difficulty-${difficulty}${selectedDifficulties.includes(difficulty) ? ' selected' : ''}${pct === 100 ? ' complete' : ''}`}
                style={{ '--topic-progress': `${pct}%` }}
              >
                <span className="filter-item-progress" aria-hidden="true" />
                <input
                  type="checkbox"
                  checked={selectedDifficulties.includes(difficulty)}
                  onChange={() => onToggleDifficulty(difficulty)}
                />
                <span className="filter-topic-name">{label}</span>
                <span className="filter-count" title="Attempted / total">{attempted}/{total}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel-subheader topics-subheader">
        <span>Topics</span>
      </div>

      {topicRows.length === 0 ? (
        <div className="no-filters">No topics available</div>
      ) : (
        <ul className="filter-list">
          {topicRows.map(({ topic, attempted, total, pct }) => (
            <li key={topic}>
              <label
                className={`filter-item${selectedTopics.includes(topic) ? ' selected' : ''}${pct === 100 ? ' complete' : ''}`}
                style={{ '--topic-progress': `${pct}%` }}
              >
                <span className="filter-item-progress" aria-hidden="true" />
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => onToggleTopic(topic)}
                />
                <span className="filter-topic-name">{topic}</span>
                <span className="filter-count" title="Attempted / total">{attempted}/{total}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
