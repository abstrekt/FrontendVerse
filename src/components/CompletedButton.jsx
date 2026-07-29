function CircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function CircleCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="currentColor" strokeWidth="2" />
      <path
        d="m9 12 2 2 4-4"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CompletedButton({ isCompleted, onToggle, className = '' }) {
  return (
    <button
      type="button"
      className={`completed-btn${isCompleted ? ' active' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={isCompleted}
      aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
      onClick={onToggle}
      title={isCompleted ? 'Completed' : 'Mark as completed'}
    >
      {isCompleted ? <CircleCheckIcon /> : <CircleIcon />}
    </button>
  );
}
