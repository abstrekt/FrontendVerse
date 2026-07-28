import { useMemo } from 'react';
import { DIFFICULTY_LEVELS, DIFFICULTY_LABELS, getDifficultyCompletion, getTopicCompletion } from '../utils/progress';
import StarredFilterToggle from './StarredFilterToggle';

export default function FilterPanel({
  questions,
  progress,
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
    () => getTopicCompletion(progress, questions),
    [progress, questions]
  );

  const difficultyCompletion = useMemo(
    () => getDifficultyCompletion(progress, questions),
    [progress, questions]
  );

  const topicRows = useMemo(() => {
    return [...topicCompletion.entries()]
      .map(([topic, { solved, total, pct }]) => ({ topic, solved, total, pct }))
      .sort((a, b) => b.total - a.total);
  }, [topicCompletion]);

  const difficultyRows = useMemo(() => {
    return DIFFICULTY_LEVELS.map((difficulty) => {
      const { solved, total, pct } = difficultyCompletion.get(difficulty) || {
        solved: 0,
        total: 0,
        pct: 0,
      };
      return { difficulty, label: DIFFICULTY_LABELS[difficulty], solved, total, pct };
    });
  }, [difficultyCompletion]);

  const hasActiveFilters =
    selectedTopics.length > 0 || selectedDifficulties.length > 0 || starredOnly;

  return (
    <>
      <StarredFilterToggle
        checked={starredOnly}
        count={starredCount}
        onChange={onStarredOnlyChange}
        hint={starredOnly ? 'Only starred questions appear in quiz and list.' : 'All active questions are included.'}
      />

      <div className="difficulty-panel">
        <div className="panel-subheader">
          <span>Difficulty</span>
          <button
            type="button"
            className={`clear-btn${hasActiveFilters ? '' : ' hidden'}`}
            onClick={onClear}
            disabled={!hasActiveFilters}
            aria-hidden={!hasActiveFilters}
          >
            Clear all
          </button>
        </div>

        <ul className="filter-list difficulty-filter-list">
          {difficultyRows.map(({ difficulty, label, solved, total, pct }) => (
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
                <span className="filter-count">{solved}/{total}</span>
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
          {topicRows.map(({ topic, solved, total, pct }) => (
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
                <span className="filter-count">{solved}/{total}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
