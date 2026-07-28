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
      {isCompleted ? '✓' : '○'}
    </button>
  );
}
