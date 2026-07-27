export default function Results({
  score,
  totalQuestions,
  sessionCount,
  bestPct,
  weakTopics,
  missedCount,
  onRestart,
  onPracticeWeak,
  onReviewMistakes,
}) {
  const missed = totalQuestions - score;
  const pct = Math.round((score / totalQuestions) * 100);
  const hasWeakTopics = weakTopics.length > 0;

  return (
    <div className="quiz-container results">
      <div className="results-scroll">
        <div className="results-hero">
          <h2 className="results-title">Quiz Complete!</h2>
          <div className="final-score">
            <span className="score-number">{score}</span>
            <span className="score-divider">/</span>
            <span className="score-total">{totalQuestions}</span>
          </div>
          <p className="percentage">{pct}% correct</p>
          <p className="results-sub">{missed} question{missed !== 1 ? 's' : ''} missed</p>
        </div>

        <div className="results-body">
          <div className="results-insights">
            <div className="insight-row">
              <span className="insight-label">Sessions played</span>
              <span className="insight-value">{sessionCount}</span>
            </div>
            {bestPct !== null && (
              <div className="insight-row">
                <span className="insight-label">Best score</span>
                <span className="insight-value">{bestPct}%</span>
              </div>
            )}
            <div className="insight-section">
              <span className="insight-label">Weak topics</span>
              {hasWeakTopics ? (
                <ul className="weak-topic-list">
                  {weakTopics.map((t) => (
                    <li key={t.topic}>
                      <span>{t.topic}</span>
                      <span className="weak-pct">{t.pct}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="insight-empty">Not enough data yet — keep practicing!</p>
              )}
            </div>
          </div>

          <div className="results-actions">
            <button className="restart-btn" onClick={onRestart}>Restart (reshuffle)</button>
            <button
              className="mode-btn"
              onClick={onPracticeWeak}
              disabled={!hasWeakTopics}
            >
              Practice weak topics
            </button>
            <button
              className="mode-btn secondary"
              onClick={onReviewMistakes}
              disabled={missedCount === 0}
            >
              Review mistakes ({missedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
