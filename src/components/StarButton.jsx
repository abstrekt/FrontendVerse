export default function StarButton({ isStarred, onToggle, className = '' }) {
  return (
    <button
      type="button"
      className={`star-btn${isStarred ? ' active' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={isStarred}
      aria-label={isStarred ? 'Unstar' : 'Star'}
      onClick={onToggle}
    >
      {isStarred ? '★' : '☆'}
    </button>
  );
}
