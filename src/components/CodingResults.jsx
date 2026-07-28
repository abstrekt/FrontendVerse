export default function CodingResults({
  score,
  totalQuestions,
  sessionCount,
  bestPct,
  onRestart,
}) {
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="results">
      <h2 className="results-title">Coding session complete!</h2>
      <div className="results-stats">
        <div className="result-stat">
          <span className="result-stat-value">{score}/{totalQuestions}</span>
          <span className="result-stat-label">Score</span>
        </div>
        <div className="result-stat">
          <span className="result-stat-value">{pct}%</span>
          <span className="result-stat-label">Accuracy</span>
        </div>
        {bestPct !== null && (
          <div className="result-stat">
            <span className="result-stat-value">{bestPct}%</span>
            <span className="result-stat-label">Personal best</span>
          </div>
        )}
        <div className="result-stat">
          <span className="result-stat-value">{sessionCount}</span>
          <span className="result-stat-label">Sessions</span>
        </div>
      </div>
      <div className="results-actions">
        <button type="button" className="next-btn" onClick={onRestart}>
          Start new session
        </button>
      </div>
    </div>
  );
}
