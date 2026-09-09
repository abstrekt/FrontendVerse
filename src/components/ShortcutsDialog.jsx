import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import Icon from './Icon';

const GROUPS = [
  {
    title: 'Anywhere',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'Search everything' },
      { keys: ['/'], label: 'Search everything' },
      { keys: ['?'], label: 'Show this list' },
      { keys: ['Esc'], label: 'Close dialogs' },
    ],
  },
  {
    title: 'Answering questions',
    shortcuts: [
      { keys: ['1', '–', '4'], label: 'Pick an option' },
      { keys: ['A', '–', 'D'], label: 'Pick an option' },
      { keys: ['O'], label: 'Show or hide the options' },
      { keys: ['E'], label: 'Show or hide the explanation' },
      { keys: ['S'], label: 'Skip this question' },
      { keys: ['N'], label: 'Next question' },
      { keys: ['Enter'], label: 'Next question (when nothing is focused)' },
    ],
  },
];

export default function ShortcutsDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="shortcuts-title" className="dialog-title">Keyboard shortcuts</h2>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="shortcuts-groups">
          {GROUPS.map((group) => (
            <section key={group.title} className="shortcuts-group">
              <h3 className="shortcuts-group-title">{group.title}</h3>
              <ul className="shortcuts-list">
                {group.shortcuts.map((shortcut) => (
                  <li key={shortcut.label + shortcut.keys.join()} className="shortcuts-row">
                    <span className="shortcuts-keys">
                      {shortcut.keys.map((key, i) =>
                        key === '–' ? (
                          <span key={i} className="shortcuts-sep">–</span>
                        ) : (
                          <kbd key={i}>{key}</kbd>
                        )
                      )}
                    </span>
                    <span className="shortcuts-label">{shortcut.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
