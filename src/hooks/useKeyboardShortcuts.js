import { useEffect } from 'react';
import { useLatestRef } from './useLatestRef';

/** Keys whose default action activates the focused control. */
const ACTIVATION_KEYS = new Set(['Enter', ' ']);

function isEditableTarget(target) {
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable === true ||
    typeof target?.closest === 'function' && target.closest('.monaco-editor') !== null
  );
}

/**
 * Bind single-key shortcuts to the document.
 *
 * Two rules keep a global binding from stealing a key that the focused thing
 * already means something by.
 *
 * **Activation keys.** Enter on a focused `<button>` *is* a click —
 * intercepting it globally meant a keyboard user who tabbed to an answer and
 * pressed Enter skipped the question instead of answering it. Enter and Space
 * therefore only act as shortcuts when nothing is focused; every other key
 * works regardless, so mouse users who left focus on a button can still use
 * them.
 *
 * **Already handled.** A widget that consumes a key calls `preventDefault` on
 * it, and this listener then leaves it alone. Without that, dragging the
 * column resizer with ArrowRight also advanced the quiz — the width changed
 * *and* the next question loaded, which moved focus and made every further
 * key press go somewhere else. Any component binding arrows locally (the
 * resizers, the step-through traces) relies on this.
 *
 * @param handlers map of key (lowercased, or 'Enter'/'ArrowRight') to callback
 */
export function useKeyboardShortcuts(handlers, { enabled = true } = {}) {
  const handlersRef = useLatestRef(handlers);

  useEffect(() => {
    if (!enabled) return undefined;

    function onKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!event.key) return;
      // The focused widget already acted on this key.
      if (event.defaultPrevented) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const handler = handlersRef.current?.[key];
      if (typeof handler !== 'function') return;

      if (ACTIVATION_KEYS.has(event.key) && document.activeElement !== document.body) {
        return;
      }

      event.preventDefault();
      handler(event);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlersRef]);
}
