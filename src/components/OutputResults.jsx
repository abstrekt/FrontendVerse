export default function OutputResults({
  score,
  totalQuestions,
  sessionCount,
  bestPct,
  missedCount,
  onRestart,
}) {
  const missed = totalQuestions - score;
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="quiz-container results output-results">
      <div className="results-scroll">
        <div className="results-hero">
          <h2 className="results-title">Output Quiz Complete!</h2>
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
            <div className="insight-row">
              <span className="insight-label">Questions to review</span>
              <span className="insight-value">{missedCount}</span>
            </div>
          </div>

          <div className="results-actions">
            <button className="restart-btn" onClick={onRestart}>Restart (reshuffle)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
