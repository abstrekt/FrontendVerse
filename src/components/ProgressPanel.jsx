import IncludeCompletedToggle from './IncludeCompletedToggle';

const MODE_LABELS = {
  weak: 'Practicing weak topics',
  review: 'Reviewing mistakes',
};

export default function ProgressPanel({
  lifetimeAccuracy,
  sessionCount,
  bestPct,
  missedCount,
  mode = 'all',
  onReviewMistakes,
  onBackToAll,
  onClearProgress,
  completedCount = 0,
  includeCompleted = true,
  onIncludeCompletedChange,
}) {
  const hasData = sessionCount > 0 || lifetimeAccuracy !== null || completedCount > 0;
  const inSpecialMode = mode !== 'all';

  return (
    <div className="sidebar-card progress-panel">
      <div className="sidebar-header">Progress</div>

      {inSpecialMode && (
        <div className="mode-banner">
          <span className="mode-banner-label">{MODE_LABELS[mode] || mode}</span>
          <button type="button" className="mode-banner-exit" onClick={onBackToAll}>
            Back to all
          </button>
        </div>
      )}

      {!hasData ? (
        <p className="progress-empty">Answer questions to build your study profile.</p>
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
        </div>
      )}

      {onIncludeCompletedChange && (
        <IncludeCompletedToggle
          checked={includeCompleted}
          onChange={onIncludeCompletedChange}
        />
      )}

      <div className="progress-actions">
        {inSpecialMode ? (
          <button className="progress-btn" onClick={onBackToAll}>
            Back to all questions
          </button>
        ) : (
          <button
            className="progress-btn"
            onClick={onReviewMistakes}
            disabled={missedCount === 0}
          >
            Review mistakes ({missedCount})
          </button>
        )}
        {hasData && (
          <button className="progress-clear" onClick={onClearProgress}>
            Clear answer history
          </button>
        )}
      </div>
    </div>
  );
}
