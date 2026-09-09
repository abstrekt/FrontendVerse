import { useState, useMemo, useEffect, useRef } from 'react';
import StarredFilterToggle from './StarredFilterToggle';
import { headingToSlug } from './CodeBody';
import Icon from './Icon';
import { useAnnounce } from '../hooks/useAnnouncer';

function stripMarkdown(text) {
  return (text || '').replace(/`([^`]+)`/g, '$1');
}

function extractHeadings(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split('\n');
  const headings = [];
  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      const title = h2Match[1].trim();
      headings.push({ level: 2, title, slug: headingToSlug(title) });
      continue;
    }
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match && headings.length < 15) {
      const title = h3Match[1].trim();
      headings.push({ level: 3, title, slug: headingToSlug(title) });
    }
  }
  return headings;
}

function getReadingStats(text) {
  if (!text) return { minutes: 1, words: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return { minutes, words };
}

export default function LearningsPanel({
  learnings,
  starredIds = [],
  completedIds = [],
  selectedLearningId,
  activeItem,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onSelect,
  title = 'Javascript learnings',
  sectionKey = 'learnings',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'starred' | 'completed' | 'pending'
  const [selectedTag, setSelectedTag] = useState(null);
  const [outlineExpanded, setOutlineExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);

  const activeItemRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  // Resolve active item
  const currentActive = useMemo(() => {
    if (activeItem) return activeItem;
    return learnings.find((item) => item.id === selectedLearningId) || null;
  }, [activeItem, learnings, selectedLearningId]);

  // Load and manage topic notes from localStorage
  useEffect(() => {
    if (!currentActive?.id) {
      setNotesText('');
      return;
    }
    const storageKey = `study-notes-${sectionKey}-${currentActive.id}`;
    const saved = localStorage.getItem(storageKey) || '';
    setNotesText(saved);
    setNotesSaved(true);
  }, [currentActive?.id, sectionKey]);

  const handleNoteChange = (text) => {
    setNotesText(text);
    setNotesSaved(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (currentActive?.id) {
        const storageKey = `study-notes-${sectionKey}-${currentActive.id}`;
        if (text.trim()) {
          localStorage.setItem(storageKey, text);
        } else {
          localStorage.removeItem(storageKey);
        }
        setNotesSaved(true);
      }
    }, 400);
  };

  // Scroll active item into view within the panel
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedLearningId]);

  // Extract unique tags across all learnings in this section
  const allTags = useMemo(() => {
    const tags = new Set();
    learnings.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((t) => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [learnings]);

  const announce = useAnnounce();

  // Filter learnings based on search, status filter, and tag filter
  const filteredLearnings = useMemo(() => {
    let list = learnings;

    // Status filter
    if (statusFilter === 'starred') {
      list = list.filter((item) => starredSet.has(item.id));
    } else if (statusFilter === 'completed') {
      list = list.filter((item) => completedSet.has(item.id));
    } else if (statusFilter === 'pending') {
      list = list.filter((item) => !completedSet.has(item.id));
    }

    // Tag filter
    if (selectedTag) {
      list = list.filter((item) => Array.isArray(item.tags) && item.tags.includes(selectedTag));
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q));
        const answerMatch = (item.answer || '').toLowerCase().includes(q);
        return titleMatch || tagMatch || answerMatch;
      });
    }

    return list;
  }, [learnings, statusFilter, selectedTag, searchQuery, starredSet, completedSet]);

  // The list below rewrites itself as filters change with nothing spoken. Only
  // announce once a filter is actually narrowing something, so simply opening
  // a section stays quiet.
  const isFiltered = Boolean(searchQuery.trim()) || statusFilter !== 'all' || Boolean(selectedTag);
  useEffect(() => {
    if (!isFiltered) return;
    announce(`${filteredLearnings.length} of ${learnings.length} topics match.`);
  }, [filteredLearnings.length, learnings.length, isFiltered, announce]);

  // Counts
  const masteredCount = useMemo(
    () => learnings.filter((item) => completedSet.has(item.id)).length,
    [learnings, completedSet]
  );
  const starredItemsCount = useMemo(
    () => learnings.filter((item) => starredSet.has(item.id)).length,
    [learnings, starredSet]
  );
  const remainingCount = learnings.length - masteredCount;
  const completionPct = learnings.length > 0 ? Math.round((masteredCount / learnings.length) * 100) : 0;

  // Headings & reading stats for current article
  const outlineHeadings = useMemo(() => {
    if (!currentActive?.answer) return [];
    return extractHeadings(currentActive.answer);
  }, [currentActive]);

  const readingStats = useMemo(() => {
    if (!currentActive?.answer) return { minutes: 1, words: 0 };
    return getReadingStats(currentActive.answer);
  }, [currentActive]);

  // Quick action: jump to next unread topic
  const handleNextUnread = () => {
    const nextItem = learnings.find((item) => !completedSet.has(item.id));
    if (nextItem) {
      onSelect(nextItem.id);
    }
  };

  // Quick action: jump to random topic
  const handleRandomTopic = () => {
    if (learnings.length === 0) return;
    const randomIndex = Math.floor(Math.random() * learnings.length);
    onSelect(learnings[randomIndex].id);
  };

  return (
    <div className="learnings-panel-body">
      {/* 1. Header with Section Title & Count */}
      <div className="panel-subheader learnings-panel-header">
        <span>{title}</span>
        <span className="learnings-count">{learnings.length}</span>
      </div>

      {/* 2. Progress & Mastery Widget */}
      <div className="panel-widget panel-progress-widget">
        <div className="panel-progress-header">
          <span className="panel-progress-label">Mastery Progress</span>
          <span className="panel-progress-pct">
            {masteredCount}/{learnings.length} ({completionPct}%)
          </span>
        </div>
        <div
          className="panel-progress-bar"
          role="progressbar"
          aria-valuenow={completionPct}
          aria-valuemin="0"
          aria-valuemax="100"
          title={`${completionPct}% Mastered`}
        >
          <div className="panel-progress-fill" style={{ width: `${completionPct}%` }} />
        </div>

        {/* Status filter toggles */}
        <div className="panel-filter-tabs" role="group" aria-label="Filter by status">
          <button
            type="button"
            className={`panel-tab-btn${statusFilter === 'all' ? ' active' : ''}`}
            aria-pressed={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            All <span className="tab-badge">{learnings.length}</span>
          </button>
          <button
            type="button"
            className={`panel-tab-btn${statusFilter === 'starred' ? ' active' : ''}`}
            aria-pressed={statusFilter === 'starred'}
            onClick={() => setStatusFilter('starred')}
          >
            <Icon name="star" filled />
            <span className="sr-only">Starred</span>{' '}
            <span className="tab-badge">{starredItemsCount}</span>
          </button>
          <button
            type="button"
            className={`panel-tab-btn${statusFilter === 'completed' ? ' active' : ''}`}
            aria-pressed={statusFilter === 'completed'}
            onClick={() => setStatusFilter('completed')}
          >
            <Icon name="check" />
            <span className="sr-only">Mastered</span>{' '}
            <span className="tab-badge">{masteredCount}</span>
          </button>
          <button
            type="button"
            className={`panel-tab-btn${statusFilter === 'pending' ? ' active' : ''}`}
            aria-pressed={statusFilter === 'pending'}
            onClick={() => setStatusFilter('pending')}
          >
            <Icon name="clock" />
            <span className="sr-only">Still to read</span>{' '}
            <span className="tab-badge">{remainingCount}</span>
          </button>
        </div>
      </div>

      {/* 3. Instant Search & Clear Widget */}
      <div className="panel-widget panel-search-widget">
        <div className="panel-search-wrapper">
          <span className="panel-search-icon">
            <Icon name="search" />
          </span>
          <input
            type="text"
            className="panel-search-input"
            placeholder="Search topics, concepts, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search topics"
          />
          {searchQuery && (
            <button
              type="button"
              className="panel-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Quick Actions Toolbar */}
      <div className="panel-quick-actions">
        <button
          type="button"
          className="quick-action-btn"
          onClick={handleNextUnread}
          title="Jump to next unread topic"
          disabled={remainingCount === 0}
        >
          <span className="action-icon">
            <Icon name="arrow-right" />
          </span>{' '}
          Next unread
        </button>
        <button
          type="button"
          className="quick-action-btn"
          onClick={handleRandomTopic}
          title="Open a random topic"
          disabled={learnings.length === 0}
        >
          <span className="action-icon">
            <Icon name="shuffle" />
          </span>{' '}
          Surprise me
        </button>
      </div>

      {/* 5. Topic Tags Cloud (if tags present) */}
      {allTags.length > 0 && (
        <div className="panel-tags-cloud" role="group" aria-label="Tags filter">
          <button
            type="button"
            className={`panel-tag-chip${!selectedTag ? ' active' : ''}`}
            aria-pressed={!selectedTag}
            onClick={() => setSelectedTag(null)}
          >
            All tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`panel-tag-chip${selectedTag === tag ? ' active' : ''}`}
              aria-pressed={selectedTag === tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 6. Interactive "On This Page" / Article Outline Widget */}
      {outlineHeadings.length > 0 && (
        <div className="panel-widget panel-outline-widget">
          <button
            type="button"
            className="panel-widget-toggle"
            onClick={() => setOutlineExpanded(!outlineExpanded)}
            aria-expanded={outlineExpanded}
          >
            <div className="panel-outline-title">
              <span className="widget-icon">
                <Icon name="list" />
              </span>
              <span className="outline-label">On this page</span>
              <span className="reading-time-pill" title={`${readingStats.words} words`}>
                <Icon name="clock" size={12} /> ~{readingStats.minutes}m read
              </span>
            </div>
            <span className="chevron-icon">
              <Icon name={outlineExpanded ? 'chevron-down' : 'chevron-right'} size={14} />
            </span>
          </button>

          {outlineExpanded && (
            <nav className="panel-outline-nav" aria-label="Page outline">
              <ul className="panel-outline-list">
                {outlineHeadings.map((heading) => (
                  <li key={heading.slug} className={`outline-item level-${heading.level}`}>
                    <a
                      href={`#${heading.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(heading.slug);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="outline-link"
                    >
                      {stripMarkdown(heading.title)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      )}

      {/* 7. Filtered Items Count / Notice */}
      <div className="panel-list-header">
        <span className="panel-list-label">Topics</span>
        <span className="panel-list-count">
          Showing {filteredLearnings.length} of {learnings.length}
        </span>
      </div>

      {/* 8. Interactive Learning Items Navigation List */}
      {filteredLearnings.length === 0 ? (
        <div className="no-filters panel-empty-state">
          {searchQuery ? (
            <>
              <p>No topics match "{searchQuery}"</p>
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedTag(null);
                }}
              >
                Reset filters
              </button>
            </>
          ) : statusFilter === 'starred' ? (
            'No starred topics yet. Star a topic to pin it here.'
          ) : statusFilter === 'completed' ? (
            'No mastered topics yet. Mark a topic as mastered to see it here.'
          ) : (
            'No topics remaining in this view.'
          )}
        </div>
      ) : (
        <ul className="learnings-nav-list">
          {filteredLearnings.map((item) => {
            const isSelected = item.id === selectedLearningId;
            const hasNote = Boolean(localStorage.getItem(`study-notes-${sectionKey}-${item.id}`));

            return (
              <li key={item.id} ref={isSelected ? activeItemRef : null}>
                <button
                  type="button"
                  className={`learning-nav-item${isSelected ? ' active' : ''}`}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="learning-nav-meta">
                    <span className="learning-nav-id">#{item.id}</span>
                    {starredSet.has(item.id) && (
                      <span className="learning-nav-star">
                        <Icon name="star" size={12} filled />
                        <span className="sr-only">Starred</span>
                      </span>
                    )}
                    {completedSet.has(item.id) && (
                      <span className="learning-nav-completed">
                        <Icon name="check" size={12} />
                        <span className="sr-only">Mastered</span>
                      </span>
                    )}
                    {hasNote && (
                      <span className="learning-nav-note">
                        <Icon name="note" size={12} />
                        <span className="sr-only">Has notes</span>
                      </span>
                    )}
                  </span>
                  <span className="learning-nav-title">{stripMarkdown(item.title)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 9. Topic Notes / Scratchpad Widget (Collapsible) */}
      {currentActive && (
        <div className="panel-widget panel-notes-widget">
          <button
            type="button"
            className="panel-widget-toggle"
            onClick={() => setNotesExpanded(!notesExpanded)}
            aria-expanded={notesExpanded}
          >
            <div className="panel-notes-header">
              <span className="widget-icon">
                <Icon name="note" />
              </span>
              <span className="notes-title">Notes #{currentActive.id}</span>
              {notesText && <span className="notes-saved-dot" title="Has saved notes" />}
            </div>
            <span className="chevron-icon"><Icon name={notesExpanded ? 'chevron-down' : 'chevron-right'} size={14} /></span>
          </button>

          {notesExpanded && (
            <div className="panel-notes-body">
              <textarea
                className="panel-notes-textarea"
                placeholder="Personal tips, gotchas or recall notes for this topic..."
                value={notesText}
                onChange={(e) => handleNoteChange(e.target.value)}
                rows={3}
              />
              <div className="panel-notes-footer">
                <span className="notes-status">{notesSaved ? 'Saved to browser' : 'Saving...'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
