import { useMemo } from 'react';

export default function FilterPanel({
  questions,
  selectedTopics,
  onToggleTopic,
  onClear,
  theme,
  onToggleTheme,
  syntaxHighlight,
  onToggleHighlight,
}) {
  const topicCounts = useMemo(() => {
    const counts = {};
    for (const q of questions) {
      for (const t of q.topics || []) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [questions]);

  return (
    <>
      <div className="panel-floating-controls">
        <button
          className={`panel-control-btn${syntaxHighlight ? ' active' : ''}`}
          onClick={onToggleHighlight}
          title="Toggle syntax highlighting"
        >
          {'{ }'}
        </button>
        <button
          className="panel-control-btn"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === 'light' ? '☽' : '☀'}
        </button>
      </div>

      <div className="panel-header">
        <span>Topics</span>
        <button
          type="button"
          className={`clear-btn${selectedTopics.length === 0 ? ' hidden' : ''}`}
          onClick={onClear}
          disabled={selectedTopics.length === 0}
          aria-hidden={selectedTopics.length === 0}
        >
          Clear all
        </button>
      </div>

      {topicCounts.length === 0 ? (
        <div className="no-filters">No topics available</div>
      ) : (
        <ul className="filter-list">
          {topicCounts.map(([topic, count]) => (
            <li key={topic}>
              <label className={`filter-item${selectedTopics.includes(topic) ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => onToggleTopic(topic)}
                />
                <span className="filter-topic-name">{topic}</span>
                <span className="filter-count">{count}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
