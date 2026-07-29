import IncludeCompletedToggle from './IncludeCompletedToggle';

export default function OutputSidebarStats({
  lifetimeAccuracy,
  sessionCount,
  bestPct,
  missedCount,
  completedCount,
  includeCompleted,
  onIncludeCompletedChange,
  onRestart,
  onClearProgress,
}) {
  const hasData =
    sessionCount > 0 ||
    lifetimeAccuracy !== null ||
    completedCount > 0 ||
    missedCount > 0;

  return (
    <div className="sidebar-card progress-panel output-progress-panel">
      <div className="sidebar-header">Output progress</div>

      {!hasData ? (
        <p className="progress-empty">Answer output questions to build your profile.</p>
      ) : (
        <div className="progress-stats">
          {lifetimeAccuracy !== null && (
            <div className="progress-stat progress-stat-primary">
              <span className="progress-stat-value">{lifetimeAccuracy}%</span>
              <span className="progress-stat-label">accuracy</span>
            </div>
          )}
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
            <span className="progress-stat-label">mastered</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-value">{missedCount}</span>
            <span className="progress-stat-label">to review</span>
          </div>
        </div>
      )}

      <IncludeCompletedToggle checked={includeCompleted} onChange={onIncludeCompletedChange} />

      <div className="progress-actions">
        <button type="button" className="progress-btn" onClick={onRestart}>
          Restart quiz
        </button>
        {hasData && (
          <button type="button" className="progress-clear" onClick={onClearProgress}>
            Clear output history
          </button>
        )}
      </div>
    </div>
  );
}
