import ProgressPanel from "./ProgressPanel";
import OutputSidebarStats from "./OutputSidebarStats";

export default function Sidebar({
  activeSection,
  onSectionChange,
  totalQuestions,
  filteredCount,
  learningsCount,
  outputQuestionsCount,
  codingQuestionsCount,
  lifetimeAccuracy,
  sessionCount,
  bestPct,
  weakTopics,
  missedCount,
  mode,
  onPracticeWeak,
  onReviewMistakes,
  onBackToAll,
  onClearProgress,
  outputLifetimeAccuracy,
  outputSessionCount,
  outputBestPct,
  outputMissedCount,
  outputCompletedCount,
  outputIncludeCompleted,
  onOutputIncludeCompletedChange,
  onOutputRestart,
  onOutputClearProgress,
  theme,
  onToggleTheme,
  syntaxHighlight,
  onToggleHighlight,
}) {
  const count = filteredCount ?? totalQuestions;

  const subtitle =
    activeSection === "mcq"
      ? `${count} question${count !== 1 ? "s" : ""} available`
      : activeSection === "learnings"
        ? `${learningsCount} learning${learningsCount !== 1 ? "s" : ""} available`
        : activeSection === "coding"
          ? `${codingQuestionsCount} challenge${codingQuestionsCount !== 1 ? "s" : ""} available`
          : `${outputQuestionsCount} question${outputQuestionsCount !== 1 ? "s" : ""} available`;

  return (
    <div className="sidebar-inner">
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-header">Sections</div>
          <p className="sidebar-subtitle">{subtitle}</p>
          <ul className="sidebar-nav">
            <li>
              <button
                type="button"
                className={activeSection === "mcq" ? "active" : ""}
                onClick={() => onSectionChange("mcq")}
              >
                <span className="nav-icon">JS</span>
                <span>JavaScript MCQs</span>
                <span className="nav-count">{count}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={activeSection === "learnings" ? "active" : ""}
                onClick={() => onSectionChange("learnings")}
              >
                <span className="nav-icon">LR</span>
                <span>Javascript learnings</span>
                <span className="nav-count">{learningsCount}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={activeSection === "coding" ? "active" : ""}
                onClick={() => onSectionChange("coding")}
              >
                <span className="nav-icon">CD</span>
                <span>Javascript coding</span>
                <span className="nav-count">{codingQuestionsCount}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={activeSection === "output" ? "active" : ""}
                onClick={() => onSectionChange("output")}
              >
                <span className="nav-icon">OP</span>
                <span>Javascript output</span>
                <span className="nav-count">{outputQuestionsCount}</span>
              </button>
            </li>
          </ul>
        </div>

        {activeSection === "mcq" && (
          <>
            <div className="sidebar-divider" />

            <ProgressPanel
              lifetimeAccuracy={lifetimeAccuracy}
              sessionCount={sessionCount}
              bestPct={bestPct}
              weakTopics={weakTopics}
              missedCount={missedCount}
              mode={mode}
              onPracticeWeak={onPracticeWeak}
              onReviewMistakes={onReviewMistakes}
              onBackToAll={onBackToAll}
              onClearProgress={onClearProgress}
            />
          </>
        )}

        {activeSection === "output" && (
          <>
            <div className="sidebar-divider" />
          <OutputSidebarStats
            lifetimeAccuracy={outputLifetimeAccuracy}
            sessionCount={outputSessionCount}
            bestPct={outputBestPct}
            missedCount={outputMissedCount}
            completedCount={outputCompletedCount}
            includeCompleted={outputIncludeCompleted}
            onIncludeCompletedChange={onOutputIncludeCompletedChange}
            onRestart={onOutputRestart}
            onClearProgress={onOutputClearProgress}
          />
          </>
        )}
      </div>

      <div className="sidebar-controls">
        <button
          type="button"
          className={`panel-control-btn${syntaxHighlight ? " active" : ""}`}
          onClick={onToggleHighlight}
          title="Toggle syntax highlighting"
        >
          {"{ }"}
        </button>
        <button
          type="button"
          className="panel-control-btn"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === "light" ? "☽" : "☀"}
        </button>
      </div>
    </div>
  );
}
