import { useState } from 'react';
import Icon from './Icon';
import { themeButtonState, editorThemeButtonState } from '../utils/themeButton';

const MODE_LABELS = {
  weak: 'Weak topics',
  review: 'Review mistakes',
};

export default function MobileProgressBar({
  lifetimeAccuracy,
  sessionCount,
  bestPct,
  missedCount,
  mode = 'all',
  onReviewMistakes,
  onBackToAll,
  theme,
  onToggleTheme,
  editorTheme = 'dark',
  onToggleEditorTheme,
}) {
  const [expanded, setExpanded] = useState(false);
  const themeBtn = themeButtonState(theme);
  const editorThemeBtn = editorThemeButtonState(editorTheme);
  const hasData = sessionCount > 0 || lifetimeAccuracy !== null;
  const inSpecialMode = mode !== 'all';

  return (
    <div className={`mobile-progress${expanded ? ' expanded' : ''}`}>
      <div className="mobile-progress-bar">
        <button
          type="button"
          className="mobile-theme-btn"
          onClick={onToggleTheme}
          title={themeBtn.label}
          aria-label={themeBtn.label}
        >
          <Icon name={themeBtn.icon} size={17} />
        </button>

        {onToggleEditorTheme && (
          <button
            type="button"
            className="mobile-theme-btn"
            onClick={onToggleEditorTheme}
            title={editorThemeBtn.label}
            aria-label={editorThemeBtn.label}
          >
            <Icon name={editorThemeBtn.icon} size={17} />
          </button>
        )}

        {hasData || missedCount > 0 || inSpecialMode ? (
          <button
            type="button"
            className="mobile-progress-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="mobile-progress-summary">
              {inSpecialMode && (
                <span className="mobile-stat mobile-stat-mode">
                  <strong>{MODE_LABELS[mode] || mode}</strong>
                </span>
              )}
              {lifetimeAccuracy !== null && (
                <span className="mobile-stat">
                  <strong>{lifetimeAccuracy}%</strong> accuracy
                </span>
              )}
              {missedCount > 0 && !inSpecialMode && (
                <span className="mobile-stat mobile-stat-warn">
                  <strong>{missedCount}</strong> to review
                </span>
              )}
            </span>
            <span className="mobile-chevron"><Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} /></span>
          </button>
        ) : (
          <span className="mobile-progress-placeholder">Your progress appears here</span>
        )}
      </div>

      {expanded && (hasData || missedCount > 0 || inSpecialMode) && (
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

          <div className="mobile-progress-actions">
            {inSpecialMode ? (
              <button
                type="button"
                className="mobile-progress-btn"
                onClick={onBackToAll}
              >
                Back to all questions
              </button>
            ) : (
              <button
                type="button"
                className="mobile-progress-btn"
                onClick={onReviewMistakes}
                disabled={missedCount === 0}
              >
                Review mistakes ({missedCount})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
