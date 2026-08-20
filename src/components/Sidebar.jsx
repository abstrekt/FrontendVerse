import ProgressPanel from "./ProgressPanel";
import OutputSidebarStats from "./OutputSidebarStats";
import CodingSidebarStats from "./CodingSidebarStats";

// Sections with no entry here (test-prep, archived) aren't tied to one
// technology, so they stay visible no matter which category chip is active.
const SECTION_CATEGORIES = {
  "react-learnings": "react",
  "react-guide": "react",
  "advanced-react": "react",
  mcq: "js",
  learnings: "js",
  coding: "js",
  output: "js",
  css: "css",
  hld: "algo",
  algorithm: "algo",
};

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "react", label: "React" },
  { id: "js", label: "JS" },
  { id: "css", label: "CSS" },
  { id: "algo", label: "Algo" },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  sectionCategory = "all",
  onSectionCategoryChange,
  totalQuestions,
  filteredCount,
  testPrepCount,
  testPrepCompletedCount,
  learningsCount,
  learningsCompletedCount,
  cssCount,
  cssCompletedCount,
  reactLearningsCount,
  reactLearningsCompletedCount,
  reactGuideCount,
  reactGuideCompletedCount,
  advancedReactCount,
  advancedReactCompletedCount,
  hldLearningsCount,
  hldCompletedCount,
  algorithmLearningsCount,
  algorithmCompletedCount,
  outputQuestionsCount,
  codingQuestionsCount,
  archivedCount,
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
  mcqCompletedCount,
  mcqIncludeCompleted,
  onMcqIncludeCompletedChange,
  codingSessionCount,
  codingBestPct,
  codingCompletedCount,
  codingIncludeCompleted,
  onCodingIncludeCompletedChange,
  onCodingRestart,
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
  onOpenSearch,
}) {
  const count = filteredCount ?? totalQuestions;
  // `navigator.platform` is deprecated and frozen or absent in some browsers,
  // which had Mac users seeing the Ctrl+K hint.
  const isApple =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgentData?.platform ?? navigator.userAgent);
  const searchShortcut = isApple ? '⌘K' : 'Ctrl+K';

  const isSectionVisible = (sectionId) =>
    sectionCategory === "all" ||
    !SECTION_CATEGORIES[sectionId] ||
    SECTION_CATEGORIES[sectionId] === sectionCategory;

  const subtitle =
    activeSection === "archived"
      ? `${archivedCount} archived item${archivedCount !== 1 ? "s" : ""}`
      : activeSection === "test-prep"
      ? `${testPrepCount} entr${testPrepCount !== 1 ? "ies" : "y"} available`
      : activeSection === "mcq"
      ? `${count} question${count !== 1 ? "s" : ""} available`
      : activeSection === "learnings"
        ? `${learningsCount} learning${learningsCount !== 1 ? "s" : ""} available`
        : activeSection === "css"
          ? `${cssCount} entr${cssCount !== 1 ? "ies" : "y"} available`
        : activeSection === "react-learnings"
          ? `${reactLearningsCount} learning${reactLearningsCount !== 1 ? "s" : ""} available`
          : activeSection === "react-guide"
            ? `${reactGuideCount} entr${reactGuideCount !== 1 ? "ies" : "y"} available`
          : activeSection === "advanced-react"
            ? `${advancedReactCount} entr${advancedReactCount !== 1 ? "ies" : "y"} available`
          : activeSection === "hld"
            ? `${hldLearningsCount} learning${hldLearningsCount !== 1 ? "s" : ""} available`
            : activeSection === "algorithm"
              ? `${algorithmLearningsCount} learning${algorithmLearningsCount !== 1 ? "s" : ""} available`
        : activeSection === "coding"
          ? `${codingQuestionsCount} challenge${codingQuestionsCount !== 1 ? "s" : ""} available`
          : `${outputQuestionsCount} question${outputQuestionsCount !== 1 ? "s" : ""} available`;

  return (
    <div className="sidebar-inner">
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-header">Sections</div>
          <p className="sidebar-subtitle">{subtitle}</p>

          <div className="sidebar-category-filter" role="group" aria-label="Filter sections by category">
            {CATEGORY_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`category-chip${sectionCategory === id ? " active" : ""}`}
                onClick={() => onSectionCategoryChange(id)}
                aria-pressed={sectionCategory === id}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="sidebar-nav">
            <li>
              <button
                type="button"
                className={activeSection === "test-prep" ? "active" : ""}
                onClick={() => onSectionChange("test-prep")}
              >
                <span className="nav-icon">TP</span>
                <span>Test Prep</span>
                <span className="nav-count">{testPrepCompletedCount}/{testPrepCount}</span>
              </button>
            </li>
            {isSectionVisible("mcq") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "mcq" ? "active" : ""}
                  onClick={() => onSectionChange("mcq")}
                >
                  <span className="nav-icon">JS</span>
                  <span>JavaScript MCQs</span>
                  <span className="nav-count">{mcqCompletedCount}/{totalQuestions}</span>
                </button>
              </li>
            )}
            {isSectionVisible("learnings") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "learnings" ? "active" : ""}
                  onClick={() => onSectionChange("learnings")}
                >
                  <span className="nav-icon">LR</span>
                  <span>Javascript learnings</span>
                  <span className="nav-count">{learningsCompletedCount}/{learningsCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("css") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "css" ? "active" : ""}
                  onClick={() => onSectionChange("css")}
                >
                  <span className="nav-icon">CS</span>
                  <span>CSS</span>
                  <span className="nav-count">{cssCompletedCount}/{cssCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("react-learnings") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "react-learnings" ? "active" : ""}
                  onClick={() => onSectionChange("react-learnings")}
                >
                  <span className="nav-icon">RL</span>
                  <span>React Learnings</span>
                  <span className="nav-count">{reactLearningsCompletedCount}/{reactLearningsCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("react-guide") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "react-guide" ? "active" : ""}
                  onClick={() => onSectionChange("react-guide")}
                >
                  <span className="nav-icon">RG</span>
                  <span>React Guide</span>
                  <span className="nav-count">{reactGuideCompletedCount}/{reactGuideCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("advanced-react") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "advanced-react" ? "active" : ""}
                  onClick={() => onSectionChange("advanced-react")}
                >
                  <span className="nav-icon">AR</span>
                  <span>Advanced React</span>
                  <span className="nav-count">{advancedReactCompletedCount}/{advancedReactCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("hld") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "hld" ? "active" : ""}
                  onClick={() => onSectionChange("hld")}
                >
                  <span className="nav-icon">HD</span>
                  <span>HLD</span>
                  <span className="nav-count">{hldCompletedCount}/{hldLearningsCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("algorithm") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "algorithm" ? "active" : ""}
                  onClick={() => onSectionChange("algorithm")}
                >
                  <span className="nav-icon">AL</span>
                  <span>Algorithm</span>
                  <span className="nav-count">{algorithmCompletedCount}/{algorithmLearningsCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("coding") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "coding" ? "active" : ""}
                  onClick={() => onSectionChange("coding")}
                >
                  <span className="nav-icon">CD</span>
                  <span>Javascript coding</span>
                  <span className="nav-count">{codingCompletedCount}/{codingQuestionsCount}</span>
                </button>
              </li>
            )}
            {isSectionVisible("output") && (
              <li>
                <button
                  type="button"
                  className={activeSection === "output" ? "active" : ""}
                  onClick={() => onSectionChange("output")}
                >
                  <span className="nav-icon">OP</span>
                  <span>Javascript output</span>
                  <span className="nav-count">{outputCompletedCount}/{outputQuestionsCount}</span>
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                className={activeSection === "archived" ? "active" : ""}
                onClick={() => onSectionChange("archived")}
              >
                <span className="nav-icon">AR</span>
                <span>Archived</span>
                <span className="nav-count">{archivedCount}</span>
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
              completedCount={mcqCompletedCount}
              includeCompleted={mcqIncludeCompleted}
              onIncludeCompletedChange={onMcqIncludeCompletedChange}
            />
          </>
        )}

        {activeSection === "coding" && (
          <>
            <div className="sidebar-divider" />
            <CodingSidebarStats
              sessionCount={codingSessionCount}
              bestPct={codingBestPct}
              completedCount={codingCompletedCount}
              includeCompleted={codingIncludeCompleted}
              onIncludeCompletedChange={onCodingIncludeCompletedChange}
              onRestart={onCodingRestart}
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
          className="sidebar-search-btn"
          onClick={onOpenSearch}
          title="Search"
        >
          <span>Search</span>
          <kbd className="sidebar-search-kbd">{searchShortcut}</kbd>
        </button>
        <div className="sidebar-controls-row">
        <button
          type="button"
          className={`panel-control-btn${syntaxHighlight ? " active" : ""}`}
          onClick={onToggleHighlight}
          title="Toggle syntax highlighting"
          aria-label="Syntax highlighting"
          aria-pressed={syntaxHighlight}
        >
          <span aria-hidden="true">{"{ }"}</span>
        </button>
        <button
          type="button"
          className="panel-control-btn"
          onClick={onToggleTheme}
          title="Toggle theme"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <span aria-hidden="true">{theme === "light" ? "☽" : "☀"}</span>
        </button>
        </div>
      </div>
    </div>
  );
}
