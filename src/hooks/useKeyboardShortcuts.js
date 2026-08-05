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
 * The important rule is the one about activation keys. Enter on a focused
 * `<button>` *is* a click — intercepting it globally meant a keyboard user who
 * tabbed to an answer and pressed Enter skipped the question instead of
 * answering it. Enter and Space therefore only act as shortcuts when nothing
 * is focused; every other key works regardless, so mouse users who left focus
 * on a button can still use them.
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
