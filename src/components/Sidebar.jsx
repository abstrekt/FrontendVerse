import ProgressPanel from './ProgressPanel';
import OutputSidebarStats from './OutputSidebarStats';
import CodingSidebarStats from './CodingSidebarStats';
import Icon from './Icon';
import { themeButtonState } from '../utils/themeButton';
import { SECTIONS, NAV_SECTIONS } from '../sections/registry';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'react', label: 'React' },
  { id: 'js', label: 'JS' },
  { id: 'css', label: 'CSS' },
  { id: 'algo', label: 'Algo' },
];

const EMPTY_COUNT = { done: 0, total: 0 };

/**
 * The nav rail.
 *
 * Every row here is derived from `SECTIONS` — label, badge, category and
 * the counter noun all live in the registry, so adding a section is one
 * table entry rather than an `<li>` here plus a branch in the subtitle
 * ternary plus a pair of count props threaded down from App.
 *
 * `counts` is keyed by section id: `{ mcq: { done, total } }`.
 */
export default function Sidebar({
  activeSection,
  onSectionChange,
  sectionCategory = 'all',
  onSectionCategoryChange,
  counts = {},
  onHome,

  // MCQ stats
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
  mcqIncludeCompleted,
  onMcqIncludeCompletedChange,

  // Coding stats
  codingSessionCount,
  codingBestPct,
  codingIncludeCompleted,
  onCodingIncludeCompletedChange,
  onCodingRestart,

  // Output stats
  outputLifetimeAccuracy,
  outputSessionCount,
  outputBestPct,
  outputMissedCount,
  outputIncludeCompleted,
  onOutputIncludeCompletedChange,
  onOutputRestart,
  onOutputClearProgress,

  theme,
  themeSource,
  onToggleTheme,
  syntaxHighlight,
  onToggleHighlight,
}) {
  const themeBtn = themeButtonState(theme, themeSource);

  const countFor = (id) => counts[id] ?? EMPTY_COUNT;

  const isSectionVisible = (id) => {
    const category = SECTIONS[id]?.category;
    return sectionCategory === 'all' || !category || category === sectionCategory;
  };

  const visibleSections = NAV_SECTIONS.filter(isSectionVisible);

  return (
    <div className="sidebar-inner">
      <button type="button" className="brand" onClick={onHome} title="Overview">
        <span className="brand-mark" aria-hidden="true">
          JS
        </span>
        <span className="brand-text">Study</span>
      </button>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="nav-group-label">Sections</div>

          <div
            className="sidebar-category-filter"
            role="group"
            aria-label="Filter sections by category"
          >
            {CATEGORY_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`category-chip${sectionCategory === id ? ' active' : ''}`}
                onClick={() => onSectionCategoryChange(id)}
                aria-pressed={sectionCategory === id}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="sidebar-nav">
            {visibleSections.map((id) => {
              const { label, navIcon, kind } = SECTIONS[id];
              const { done, total } = countFor(id);
              const isActive = activeSection === id;
              // The archive is a holding pen, not a track to finish: a
              // progress bar on it would read as "0% archived".
              const tracked = kind !== 'archived' && total > 0;
              const pct = tracked ? Math.round((done / total) * 100) : 0;
              const complete = tracked && done >= total;

              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`${isActive ? 'active' : ''}${complete ? ' complete' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onSectionChange(id)}
                    style={tracked ? { '--nav-progress': `${pct}%` } : undefined}
                    title={tracked ? `${label} — ${done} of ${total} done` : label}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      {navIcon}
                    </span>
                    <span className="nav-item-label">{label}</span>
                    <span className="nav-count">
                      {tracked ? `${done}/${total}` : total}
                    </span>
                    {tracked && <span className="nav-item-bar" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {activeSection === 'mcq' && (
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
              completedCount={countFor('mcq').done}
              includeCompleted={mcqIncludeCompleted}
              onIncludeCompletedChange={onMcqIncludeCompletedChange}
            />
          </>
        )}

        {activeSection === 'coding' && (
          <>
            <div className="sidebar-divider" />
            <CodingSidebarStats
              sessionCount={codingSessionCount}
              bestPct={codingBestPct}
              completedCount={countFor('coding').done}
              includeCompleted={codingIncludeCompleted}
              onIncludeCompletedChange={onCodingIncludeCompletedChange}
              onRestart={onCodingRestart}
            />
          </>
        )}

        {activeSection === 'output' && (
          <>
            <div className="sidebar-divider" />
            <OutputSidebarStats
              lifetimeAccuracy={outputLifetimeAccuracy}
              sessionCount={outputSessionCount}
              bestPct={outputBestPct}
              missedCount={outputMissedCount}
              completedCount={countFor('output').done}
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
          className={`rail-footer-btn${syntaxHighlight ? ' active' : ''}`}
          onClick={onToggleHighlight}
          title="Toggle syntax highlighting"
          aria-label="Syntax highlighting"
          aria-pressed={syntaxHighlight}
        >
          <Icon name="braces" size={15} />
          <span className="rail-footer-label">Syntax colour</span>
        </button>
        <button
          type="button"
          className="rail-footer-btn"
          onClick={onToggleTheme}
          title={themeBtn.label}
          aria-label={themeBtn.label}
        >
          <Icon name={themeBtn.icon} size={15} />
          <span className="rail-footer-label">{themeBtn.short}</span>
        </button>
      </div>
    </div>
  );
}
