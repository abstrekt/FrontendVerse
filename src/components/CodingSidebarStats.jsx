import IncludeCompletedToggle from './IncludeCompletedToggle';

export default function CodingSidebarStats({
  sessionCount,
  bestPct,
  completedCount,
  includeCompleted,
  onIncludeCompletedChange,
  onRestart,
}) {
  const hasData = sessionCount > 0 || completedCount > 0;

  return (
    <div className="sidebar-card progress-panel coding-progress-panel">
      <div className="sidebar-header">Coding progress</div>

      {!hasData ? (
        <p className="progress-empty">Pass coding challenges to build your profile.</p>
      ) : (
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="progress-stat-value">{sessionCount}</span>
            <span className="progress-stat-label">sessions</span>
          </div>
          {bestPct !== null && (
            <div className="progress-stat">
              <span className="progress-stat-value">{bestPct}%</span>
              <span className="progress-stat-label">best</span>
            </div>
          )}
          <div className="progress-stat">
            <span className="progress-stat-value">{completedCount}</span>
            <span className="progress-stat-label">completed</span>
          </div>
        </div>
      )}

      <IncludeCompletedToggle checked={includeCompleted} onChange={onIncludeCompletedChange} />

      <div className="progress-actions">
        <button type="button" className="progress-btn" onClick={onRestart}>
          Restart quiz
        </button>
      </div>
    </div>
  );
}
