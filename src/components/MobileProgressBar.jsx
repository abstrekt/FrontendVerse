import { useState } from 'react';

export default function MobileProgressBar({
  lifetimeAccuracy,
  sessionCount,
  bestPct,
  weakTopics,
  missedCount,
  onPracticeWeak,
  onReviewMistakes,
  theme,
  onToggleTheme,
}) {
  const [expanded, setExpanded] = useState(false);
  const hasWeakTopics = weakTopics.length > 0;
  const hasData = sessionCount > 0 || lifetimeAccuracy !== null;

  return (
    <div className={`mobile-progress${expanded ? ' expanded' : ''}`}>
      <div className="mobile-progress-bar">
        <button
          type="button"
          className="mobile-theme-btn"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === 'light' ? '☽' : '☀'}
        </button>

        {hasData || missedCount > 0 ? (
          <button
            type="button"
            className="mobile-progress-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="mobile-progress-summary">
              {lifetimeAccuracy !== null && (
                <span className="mobile-stat">
                  <strong>{lifetimeAccuracy}%</strong> accuracy
                </span>
              )}
              {missedCount > 0 && (
                <span className="mobile-stat mobile-stat-warn">
                  <strong>{missedCount}</strong> to review
                </span>
              )}
            </span>
            <span className="mobile-chevron">{expanded ? '▾' : '▸'}</span>
          </button>
        ) : (
          <span className="mobile-progress-placeholder">Your progress appears here</span>
        )}
      </div>

      {expanded && (hasData || missedCount > 0) && (
        <div className="mobile-progress-drawer">
          <div className="mobile-progress-stats">
            {lifetimeAccuracy !== null && (
              <div className="mobile-progress-stat">
                <span className="mobile-progress-value">{lifetimeAccuracy}%</span>
                <span className="mobile-progress-label">accuracy</span>
              </div>
            )}
            <div className="mobile-progress-stat">
              <span className="mobile-progress-value">{sessionCount}</span>
              <span className="mobile-progress-label">sessions</span>
            </div>
            {bestPct !== null && (
              <div className="mobile-progress-stat">
                <span className="mobile-progress-value">{bestPct}%</span>
                <span className="mobile-progress-label">best</span>
              </div>
            )}
          </div>

          {hasWeakTopics && (
            <ul className="mobile-weak-list">
              {weakTopics.slice(0, 3).map((t) => (
                <li key={t.topic}>
                  <span>{t.topic}</span>
                  <span className="mobile-weak-pct">{t.pct}%</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mobile-progress-actions">
            <button
              type="button"
              className="mobile-progress-btn"
              onClick={onPracticeWeak}
              disabled={!hasWeakTopics}
            >
              Practice weak topics
            </button>
            <button
              type="button"
              className="mobile-progress-btn secondary"
              onClick={onReviewMistakes}
              disabled={missedCount === 0}
            >
              Review mistakes ({missedCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
