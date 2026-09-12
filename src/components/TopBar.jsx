import Icon from './Icon';

/**
 * The bar above the content column.
 *
 * Holds what is true for the whole app (search, streak, shortcuts) plus
 * the identity of whatever is on screen. Section-local controls arrive
 * through `actions` so each view decides what belongs beside its title
 * without this component growing a branch per section.
 */
export default function TopBar({
  title,
  meta,
  streakDays = 0,
  streakLive = false,
  onOpenSearch,
  onOpenShortcuts,
  actions,
}) {
  // `navigator.platform` is deprecated and frozen or absent in some
  // browsers, which had Mac users seeing the Ctrl+K hint.
  const isApple =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgentData?.platform ?? navigator.userAgent);
  const searchShortcut = isApple ? '⌘K' : 'Ctrl+K';

  return (
    <header className="topbar">
      <div className="topbar-lead">
        <h1 className="topbar-title">{title}</h1>
        {meta && <span className="topbar-meta">{meta}</span>}
      </div>

      <div className="topbar-spacer" />

      {actions}

      <div className="topbar-actions">
        {streakDays > 0 && (
          <span
            className={`streak-pill${streakLive ? '' : ' is-cold'}`}
            title={
              streakLive
                ? `${streakDays}-day streak — you have studied today`
                : `${streakDays}-day streak — study today to keep it`
            }
          >
            <Icon name="flame" size={13} filled={streakLive} />
            {streakDays}
            <span className="sr-only"> day streak</span>
          </span>
        )}

        <button
          type="button"
          className="topbar-search"
          onClick={onOpenSearch}
          aria-label="Search everything"
        >
          <Icon name="search" size={14} />
          <span className="topbar-search-label">Search</span>
          <kbd className="kbd">{searchShortcut}</kbd>
        </button>

        <button
          type="button"
          className="icon-btn topbar-shortcuts"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <Icon name="keyboard" size={16} />
        </button>
      </div>
    </header>
  );
}
