import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeBody from './CodeBody';
import LearningBadges from './LearningBadges';
import LearningSummary from './LearningSummary';
import StarButton from './StarButton';
import CompletedButton from './CompletedButton';
import SelectionTooltip from './SelectionTooltip';
import { EMPTY_MARKS, PREVIEW_MARK_ID } from '../utils/markRanges';
import {
  newMarkId,
  selectionAnchor,
  selectionContext,
  sentenceAnchor,
} from '../utils/highlights';
import { askAboutSelection } from '../utils/define';

function stripMarkdown(text) {
  return text.replace(/`([^`]+)`/g, '$1');
}

export default function LearningsView({
  learning,
  onArchive,
  isStarred = false,
  onToggleStar,
  isCompleted = false,
  onToggleCompleted,
  highlight,
  theme,
  onNavigate,
  marksApi,
}) {
  const scrollRef = useRef(null);
  const articleRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [learning?.id]);

  // Changing entry invalidates any open tooltip — its anchor belongs to prose
  // that is no longer on screen.
  useEffect(() => {
    setSelection(null);
    setPreview(null);
  }, [learning?.id]);

  const close = useCallback(() => {
    setSelection(null);
    setPreview(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  /* Read the selection after the browser has finished making it: `mouseup`
     fires before the selection settles on some platforms, so reading it
     synchronously gets a stale range.
     A timeout rather than requestAnimationFrame, because rAF is paused while
     the tab is backgrounded or occluded — the callback would never run, and
     the tooltip would silently never appear. */
  const readSelection = useCallback(() => {
    setTimeout(() => {
      const root = articleRef.current;
      const sel = window.getSelection();
      if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
      const text = range.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }
      setSelection({
        rect: range.getBoundingClientRect(),
        term: text,
        // Null inside a code fence or diagram — Highlight is disabled there,
        // but Define still works on whatever was selected.
        anchor: selectionAnchor(root, range),
        sentence: sentenceAnchor(root, range),
        context: selectionContext(root, range),
      });
    }, 0);
  }, []);

  // A tooltip pinned to viewport coordinates goes stale the moment the article
  // scrolls under it, so close rather than chase.
  useEffect(() => {
    if (!selection) return undefined;
    const scroller = scrollRef.current;
    const onScroll = () => close();
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      scroller?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [selection, close]);

  const handleMarkClick = useCallback((id, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSelection({
      rect,
      term: event.currentTarget.textContent ?? '',
      anchor: null,
      sentence: null,
      context: '',
      markId: id,
    });
  }, []);

  const handleHighlight = useCallback(() => {
    if (!selection?.anchor || !learning) return;
    marksApi?.add(learning.id, {
      id: newMarkId(),
      text: selection.anchor.text,
      nth: selection.anchor.nth,
      createdAt: Date.now(),
    });
    close();
  }, [selection, marksApi, learning, close]);

  const handleRemove = useCallback(
    (id) => {
      if (learning) marksApi?.remove(learning.id, id);
      close();
    },
    [marksApi, learning, close]
  );

  const ask = useCallback(
    (mode, subject) =>
      askAboutSelection({
        mode,
        subject,
        context: selection?.context ?? '',
        title: learning?.title ?? '',
      }),
    [selection, learning]
  );

  /* The hover preview rides the same <mark> machinery as a stored highlight,
     so there is one rendering path for "some text is emphasised" rather than
     two that can disagree. */
  const marks = marksApi && learning ? marksApi.for(learning.id) : EMPTY_MARKS;
  const renderedMarks = useMemo(() => {
    if (!preview) return marks;
    return [...marks, { id: PREVIEW_MARK_ID, text: preview.text, nth: preview.nth }];
  }, [marks, preview]);

  if (!learning) {
    return (
      <div className="quiz-container learnings-view">
        <div className="filtered-empty">
          <p>No learnings available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container learnings-view">
      <div className="learning-header">
        <div className="learning-content">
          <LearningBadges company={learning.company} tags={learning.tags} />
          <div className="learning-title-row">
            <h2 className="learning-title">{stripMarkdown(learning.title)}</h2>
            <div className="learning-title-actions">
              {isCompleted && <span className="completed-badge">Mastered</span>}
              {onToggleCompleted && <CompletedButton isCompleted={isCompleted} onToggle={onToggleCompleted} />}
              {onToggleStar && <StarButton isStarred={isStarred} onToggle={onToggleStar} />}
              <button
                type="button"
                className="archive-btn learning-archive-btn"
                onClick={() => onArchive(learning)}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="learning-answer-scroll">
        <LearningSummary summary={learning.summary} theme={theme} onNavigate={onNavigate} />
        <div
          ref={articleRef}
          className="learning-content learning-answer"
          onMouseUp={readSelection}
          onKeyUp={(event) => event.shiftKey && readSelection()}
        >
          <CodeBody
            content={learning.answer}
            highlight={highlight}
            theme={theme}
            onNavigate={onNavigate}
            marks={renderedMarks}
            onMarkClick={handleMarkClick}
          />
        </div>
      </div>

      {selection && (
        <SelectionTooltip
          rect={selection.rect}
          term={selection.term}
          sentence={selection.sentence?.text ?? ''}
          canHighlight={Boolean(selection.anchor)}
          existingMarkId={selection.markId}
          onHighlight={handleHighlight}
          onRemove={handleRemove}
          onPreviewSentence={(text) => setPreview(text ? selection.sentence : null)}
          onClose={close}
          ask={ask}
        />
      )}
    </div>
  );
}
