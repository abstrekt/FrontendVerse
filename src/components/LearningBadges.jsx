export default function LearningBadges({ company, tags = [] }) {
  if (!company && tags.length === 0) return null;

  return (
    <div className="topic-badges learning-tags">
      {company && <span className="company-badge">{company}</span>}
      {tags.map((tag) => (
        <span key={tag} className="topic-badge">
          {tag}
        </span>
      ))}
    </div>
  );
}
