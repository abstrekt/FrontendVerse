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
            <span className="progress-stat-label">completed</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-value">{missedCount}</span>
            <span className="progress-stat-label">to review</span>
          </div>
        </div>
      )}

      <label className="output-setting-toggle">
        <input
          type="checkbox"
          checked={includeCompleted}
          onChange={(e) => onIncludeCompletedChange(e.target.checked)}
        />
        <span className="output-setting-toggle-label">Include completed questions</span>
      </label>
      <p className="output-setting-hint">
        {includeCompleted
          ? 'Completed questions stay in the random shuffle and show a badge.'
          : 'Only unanswered or incorrect questions are shuffled.'}
      </p>

      <div className="progress-actions">
        <button type="button" className="progress-btn" onClick={onRestart}>
          Restart quiz
        </button>
        {hasData && (
          <button type="button" className="progress-clear" onClick={onClearProgress}>
            Clear output progress
          </button>
        )}
      </div>
    </div>
  );
}
