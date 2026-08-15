import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SEARCH_SECTIONS,
  getSectionLabel,
  highlightText,
  searchIndex,
  tokenizeQuery,
} from '../utils/searchIndex';
import { useFocusTrap } from '../hooks/useFocusTrap';

const LISTBOX_ID = 'command-palette-results';
const optionId = (index) => `command-palette-option-${index}`;

const SECTION_CHIP_LABELS = {
  all: 'All',
  'test-prep': 'Test Prep',
  mcq: 'MCQ',
  learnings: 'Learnings',
  css: 'CSS',
  'react-learnings': 'React',
  'react-guide': 'React Guide',
  'advanced-react': 'Advanced React',
  hld: 'HLD',
  algorithm: 'Algorithm',
  coding: 'Coding',
  output: 'Output',
};

function HighlightedText({ text, ranges, className }) {
  const parts = highlightText(text, ranges);
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark key={index} className="search-hit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}

function SearchResultCard({ result, id, isActive, onSelect, onHover }) {
  const matchedTagSet = useMemo(
    () => new Set(result.matchedTags.map((tag) => tag.toLowerCase())),
    [result.matchedTags]
  );

  return (
    // A listbox option must not be independently focusable — focus stays in the
    // combobox input and `aria-activedescendant` points here, which is what
    // makes arrowing through results actually get announced.
    <div
      id={id}
      role="option"
      aria-selected={isActive}
      className={`search-result-card${isActive ? ' active' : ''}`}
      onClick={() => onSelect(result)}
      onMouseEnter={onHover}
    >
      <div className="search-result-header">
        <span className={`search-section-badge section-${result.section}`}>
          {result.sectionLabel}
        </span>
        <span className="search-result-id">#{result.id}</span>
        <span className="search-result-header-meta">
          {result.difficulty ? (
            <span className="search-meta-pill search-difficulty-pill">{result.difficulty}</span>
          ) : null}
          {result.company ? (
            <span className="search-meta-pill search-company-pill">{result.company}</span>
          ) : null}
        </span>
      </div>

      <div className="search-result-title">
        <HighlightedText text={result.title} ranges={result.titleHighlights} />
      </div>

      {result.snippet ? (
        <div className="search-result-snippet">
          {result.snippetFieldLabel ? (
            <span className="search-snippet-label">{result.snippetFieldLabel}</span>
          ) : null}
          <HighlightedText text={result.snippet} ranges={result.snippetHighlights} />
        </div>
      ) : null}

      {result.tags.length > 0 ? (
        <div className="search-result-tags">
          {result.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className={`search-tag-chip${matchedTagSet.has(tag.toLowerCase()) ? ' matched' : ''}`}
            >
              {tag}
            </span>
          ))}
          {result.tags.length > 4 ? (
            <span className="search-tag-more">+{result.tags.length - 4}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CommandPalette({ open, docs, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const results = useMemo(
    () => searchIndex(docs, query, { section: sectionFilter, limit: 40 }),
    [docs, query, sectionFilter]
  );

  const hasQuery = tokenizeQuery(query).length > 0;

  const resetState = useCallback(() => {
    setQuery('');
    setSectionFilter('all');
    setActiveIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetState();
    requestAnimationFrame(() => {
      previousFocusRef.current?.focus?.();
    });
  }, [onClose, resetState]);

  const handleSelect = useCallback(
    (result) => {
      onSelect(result);
      handleClose();
    },
    [handleClose, onSelect]
  );

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);

    // Stop the page behind the dialog from scrolling with the wheel.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Tab used to walk straight out of the dialog into the page behind it.
  useFocusTrap(dialogRef, open, handleClose);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, sectionFilter]);

  useEffect(() => {
    if (!open) return undefined;

    // Escape is handled by the focus trap.
    function onKeyDown(event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!results.length) return;
        setActiveIndex((index) => (index + 1) % results.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!results.length) return;
        setActiveIndex((index) => (index - 1 + results.length) % results.length);
        return;
      }

      if (event.key === 'Enter' && results.length > 0) {
        event.preventDefault();
        handleSelect(results[activeIndex]);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, handleClose, handleSelect, open, results]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeItem = listRef.current.querySelector('.search-result-card.active');
    activeItem?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, results]);

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" onClick={handleClose} role="presentation">
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="command-palette-input-row">
          <span className="command-palette-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            type="search"
            className="command-palette-input"
            placeholder="Search titles, tags, companies, content…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={LISTBOX_ID}
            aria-activedescendant={results.length > 0 ? optionId(activeIndex) : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="command-palette-kbd">Esc</kbd>
        </div>

        <div className="command-palette-filters" role="group" aria-label="Filter by section">
          {SEARCH_SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              aria-pressed={sectionFilter === section}
              className={`command-palette-filter${sectionFilter === section ? ' active' : ''}`}
              onClick={() => setSectionFilter(section)}
            >
              {SECTION_CHIP_LABELS[section] ?? getSectionLabel(section)}
            </button>
          ))}
        </div>

        <div
          className="command-palette-results"
          ref={listRef}
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Search results"
        >
          {!hasQuery ? (
            <div className="command-palette-empty">
              <p>Type to search across MCQs, learnings, coding challenges, and output questions.</p>
              <p className="command-palette-hint">
                Try <strong>closure</strong>, <strong>Tekion</strong>, or <strong>Promise</strong>
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="command-palette-empty">
              <p>No results for &ldquo;{query.trim()}&rdquo;</p>
              <p className="command-palette-hint">Try different keywords or clear the section filter.</p>
            </div>
          ) : (
            results.map((result, index) => (
              <SearchResultCard
                key={result.key}
                id={optionId(index)}
                result={result}
                isActive={index === activeIndex}
                onSelect={handleSelect}
                onHover={() => setActiveIndex(index)}
              />
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
