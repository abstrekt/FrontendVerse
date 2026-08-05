import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

/**
 * Keep Tab inside an open dialog and restore focus when it closes.
 *
 * `aria-modal` alone does not do this: Tab walks straight out into the page
 * behind, which for a screen-reader or keyboard user means the dialog is not
 * really modal at all.
 */
export function useFocusTrap(containerRef, active, onEscape) {
  useEffect(() => {
    if (!active) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;

    // Focus the first control, or the dialog itself if it has none.
    const initial = focusableWithin(container)[0];
    if (initial) initial.focus();
    else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = focusableWithin(container);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [containerRef, active, onEscape]);
}
