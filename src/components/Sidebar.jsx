import ProgressPanel from './ProgressPanel';

export default function Sidebar({
  totalQuestions,
  filteredCount,
  lifetimeAccuracy,
  sessionCount,
  bestPct,
  weakTopics,
  missedCount,
  onPracticeWeak,
  onReviewMistakes,
  onClearProgress,
}) {
  const count = filteredCount ?? totalQuestions;

  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-header">Categories</div>
        <p className="sidebar-subtitle">{count} question{count !== 1 ? 's' : ''} available</p>
        <ul className="sidebar-nav">
          <li>
            <a className="active">
              <span className="nav-icon">JS</span>
              <span>JavaScript MCQs</span>
              <span className="nav-count">{count}</span>
            </a>
          </li>
        </ul>
      </div>

      <div className="sidebar-divider" />

      <ProgressPanel
        lifetimeAccuracy={lifetimeAccuracy}
        sessionCount={sessionCount}
        bestPct={bestPct}
        weakTopics={weakTopics}
        missedCount={missedCount}
        onPracticeWeak={onPracticeWeak}
        onReviewMistakes={onReviewMistakes}
        onClearProgress={onClearProgress}
      />
    </>
  );
}
