import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * The bar that appears over a text selection inside an article.
 *
 * Three actions, and they operate on two different spans of text:
 *
 * - **Highlight** marks exactly what was selected, and persists.
 * - **Define** explains the selected *term*, using the surrounding prose so
 *   the answer is about this entry rather than a dictionary sense.
 * - **Explain** works on the whole *sentence* the selection sits in, because
 *   "I don't follow this line" is a different question from "what is this
 *   word". Hovering it previews that sentence in the article, so you can see
 *   what you are about to ask about before you ask.
 *
 * Rendered through a portal: the article scrolls inside an overflow container,
 * and a tooltip positioned within it would be clipped at the edges.
 */

const MARGIN = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function SelectionTooltip({
  rect,
  term,
  sentence,
  canHighlight,
  existingMarkId,
  onHighlight,
  onRemove,
  onPreviewSentence,
  onClose,
  ask,
}) {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [answer, setAnswer] = useState('');
  const [heading, setHeading] = useState('');
  const panelRef = useRef(null);

  // A new selection resets whatever the last one was showing.
  useEffect(() => {
    setState('idle');
    setAnswer('');
    setHeading('');
  }, [term, sentence]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = useCallback(
    async (mode) => {
      const subject = mode === 'define' ? term : sentence;
      if (!subject) return;
      onPreviewSentence(null);
      setHeading(mode === 'define' ? term : 'In plainer words');
      setState('loading');
      try {
        const text = await ask(mode, subject);
        setAnswer(text);
        setState('done');
      } catch (err) {
        setAnswer(err?.message || 'That did not work. Try again in a moment.');
        setState('error');
      }
    },
    [ask, term, sentence, onPreviewSentence]
  );

  if (!rect) return null;

  const width = state === 'idle' ? 0 : 340;
  const left = clamp(
    rect.left + rect.width / 2,
    MARGIN + width / 2,
    window.innerWidth - MARGIN - width / 2
  );
  // Flip below the selection when there is no room above it.
  const above = rect.top > 160;
  const top = above ? rect.top - MARGIN : rect.bottom + MARGIN;

  return createPortal(
    <div
      ref={panelRef}
      className={`selection-tooltip${above ? '' : ' selection-tooltip-below'}`}
      style={{ left, top }}
      // The article clears the selection on mousedown elsewhere; keep clicks
      // inside the tooltip from counting as "elsewhere".
      onMouseDown={(event) => event.preventDefault()}
      role="dialog"
      aria-label="Selection actions"
    >
      <div className="selection-tooltip-actions">
        {existingMarkId ? (
          <button type="button" onClick={() => onRemove(existingMarkId)}>
            Remove highlight
          </button>
        ) : (
          <button type="button" onClick={onHighlight} disabled={!canHighlight}>
            Highlight
          </button>
        )}
        <span className="selection-tooltip-sep" aria-hidden="true" />
        <button type="button" onClick={() => run('define')} disabled={!term}>
          Define
        </button>
        <button
          type="button"
          onClick={() => run('explain')}
          disabled={!sentence}
          onMouseEnter={() => state === 'idle' && onPreviewSentence(sentence)}
          onMouseLeave={() => onPreviewSentence(null)}
          onFocus={() => state === 'idle' && onPreviewSentence(sentence)}
          onBlur={() => onPreviewSentence(null)}
          title="Explain this whole sentence"
        >
          Explain
        </button>
      </div>

      {state !== 'idle' && (
        <div className="selection-tooltip-panel">
          {heading && <p className="selection-tooltip-heading">{heading}</p>}
          {state === 'loading' && <p className="selection-tooltip-loading">Thinking…</p>}
          {state === 'done' && <p className="selection-tooltip-answer">{answer}</p>}
          {state === 'error' && <p className="selection-tooltip-error">{answer}</p>}
        </div>
      )}
    </div>,
    document.body
  );
}
