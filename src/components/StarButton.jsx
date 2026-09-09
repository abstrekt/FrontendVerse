import Icon from './Icon';

export default function StarButton({ isStarred, onToggle, className = '' }) {
  return (
    <button
      type="button"
      className={`star-btn${isStarred ? ' active' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={isStarred}
      aria-label={isStarred ? 'Unstar' : 'Star'}
      onClick={onToggle}
    >
      <Icon name="star" filled={isStarred} />
    </button>
  );
}
