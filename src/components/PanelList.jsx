import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import StarredFilterToggle from './StarredFilterToggle';
import DifficultyBadge from './DifficultyBadge';
import Icon from './Icon';

function stripMarkdown(text) {
  return (text || '').replace(/`([^`]+)`/g, '$1');
}

/**
 * The item list that fills the contextual panel for every section whose
 * panel is a list: learnings, coding, and everything shaped like them.
 *
 * Rows are one line each. With a hundred-odd learnings in a column 300px wide, a
 * three-line card per item means scrolling past nine of them at a time;
 * a single line means thirty, which is the difference between scanning
 * the list and hunting through it. Anything that does not fit on the
 * line (tags, the full title) is on the row's `title` instead.
 *
 * `groupBy` names a field to break the list on — `module` for the sections
 * with a teaching order. Off by default, so the coding and MCQ panels are
 * unaffected.
 *
 * Local filter text is deliberately not lifted to the URL — it is a way
 * to find one row right now, not a view worth restoring.
 */
export default function PanelList({
  items,
  title,
  selectedId,
  onSelect,
  starredIds = [],
  completedIds = [],
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  getLabel = (item) => item.title,
  groupBy = null,
  showDifficulty = false,
  monoLabels = false,
  emptyLabel = 'Nothing here yet',
  emptyStarredLabel = 'No starred items yet.',
  searchPlaceholder = 'Filter…',
}) {
  const [query, setQuery] = useState('');
  const activeItemRef = useRef(null);

  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        stripMarkdown(getLabel(item)).toLowerCase().includes(q) ||
        String(item.id) === q
    );
  }, [items, query, getLabel]);

  // Keep the selected row in view when navigation comes from elsewhere
  // (the command palette, a link inside an article, next/previous).
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedId]);

  // One group per curriculum module, in the order the items already arrive in
  // — `applyCurriculum` sorted them, so grouping never has to re-sort. Modules
  // whose every row was filtered out produce no header.
  const groups = useMemo(() => {
    if (!groupBy) return [{ key: null, label: null, items: visible }];
    const out = [];
    let current = null;
    for (const item of visible) {
      const label = item[groupBy];
      if (!current || current.label !== label) {
        current = { key: `${label}-${out.length}`, label, items: [] };
        out.push(current);
      }
      current.items.push(item);
    }
    return out;
  }, [visible, groupBy]);

  const showSearch = items.length > 12;

  return (
    <div className="learnings-panel-body">
      <div className="panel-header">
        <span className="panel-header-title">{title}</span>
        <span className="panel-count">{visible.length}</span>
      </div>

      {(showSearch || onStarredOnlyChange) && (
        <div className="panel-toolbar">
          {showSearch && (
            <div className="panel-search">
              <Icon name="search" size={13} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={`Filter ${title}`}
              />
              {query && (
                <button
                  type="button"
                  className="panel-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>
          )}

          {onStarredOnlyChange && (
            <StarredFilterToggle
              checked={starredOnly}
              count={starredCount}
              onChange={onStarredOnlyChange}
            />
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="no-filters">
          {query
            ? `Nothing matches “${query}”.`
            : starredOnly
              ? emptyStarredLabel
              : emptyLabel}
        </div>
      ) : (
        <ul className="learnings-nav-list">
          {groups.map((group) => (
            <Fragment key={group.key ?? '_all'}>
              {group.label && (
                <li className="panel-group-header">
                  <span className="panel-group-label">{group.label}</span>
                  <span className="panel-group-count">{group.items.length}</span>
                </li>
              )}
              {group.items.map((item) => {
                const isSelected = item.id === selectedId;
                const label = stripMarkdown(getLabel(item));
                const isDone = completedSet.has(item.id);

                return (
                  <li key={item.id} ref={isSelected ? activeItemRef : null}>
                    <button
                      type="button"
                      className={`learning-nav-item${isSelected ? ' active' : ''}${
                        isDone ? ' done' : ''
                      }${monoLabels ? ' is-mono' : ''}`}
                      onClick={() => onSelect(item.id)}
                      title={label}
                    >
                      <span className="learning-nav-id">{item.id}</span>
                      <span className="learning-nav-title">{label}</span>
                      <span className="learning-nav-marks">
                        {showDifficulty && item.difficulty && (
                          <DifficultyBadge difficulty={item.difficulty} compact />
                        )}
                        {starredSet.has(item.id) && (
                          <span className="learning-nav-star">
                            <Icon name="star" size={11} filled />
                            <span className="sr-only">Starred</span>
                          </span>
                        )}
                        {isDone && (
                          <span className="learning-nav-completed">
                            <Icon name="check" size={12} />
                            <span className="sr-only">Mastered</span>
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
