function stripMarkdown(text) {
  return text.replace(/`([^`]+)`/g, '$1');
}

export default function LearningsPanel({
  learnings,
  selectedLearningId,
  onSelect,
}) {
  return (
    <div className="learnings-panel-body">
      <div className="panel-subheader learnings-panel-header">
        <span>Javascript learnings</span>
        <span className="learnings-count">{learnings.length}</span>
      </div>

      {learnings.length === 0 ? (
        <div className="no-filters">No learnings yet</div>
      ) : (
        <ul className="learnings-nav-list">
          {learnings.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`learning-nav-item${item.id === selectedLearningId ? ' active' : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <span className="learning-nav-id">#{item.id}</span>
                <span className="learning-nav-title">{stripMarkdown(item.title)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
