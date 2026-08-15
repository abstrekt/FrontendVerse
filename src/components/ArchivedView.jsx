import { SECTIONS, SECTION_LABELS, filterArchived } from '../utils/archive';

function stripMarkdown(text) {
  return text.replace(/`([^`]+)`/g, '$1');
}

function getItemLabel(section, item) {
  if (section === 'mcq') return item.question;
  if (
    section === 'learnings' ||
    section === 'react-learnings' ||
    section === 'react-guide' ||
    section === 'hld' ||
    section === 'algorithm'
  ) {
    return stripMarkdown(item.title);
  }
  if (section === 'coding') return item.title;
  if (section === 'output') return item.title || item.question || 'Output question';
  return String(item.id);
}

const SECTION_ITEMS = {
  mcq: 'questions',
  learnings: 'learnings',
  'react-learnings': 'reactLearnings',
  'react-guide': 'reactGuide',
  hld: 'hldLearnings',
  algorithm: 'algorithmLearnings',
  coding: 'codingQuestions',
  output: 'outputQuestions',
};

export default function ArchivedView({
  archived,
  questions,
  learnings,
  reactLearnings,
  reactGuide,
  hldLearnings,
  algorithmLearnings,
  codingQuestions,
  outputQuestions,
  onUnarchive,
}) {
  const pools = { questions, learnings, reactLearnings, reactGuide, hldLearnings, algorithmLearnings, codingQuestions, outputQuestions };
  const groups = SECTIONS.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    items: filterArchived(pools[SECTION_ITEMS[section]], section, archived),
  }));
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="quiz-container archived-view">
      <div className="quiz-header list-view-header">
        <div className="quiz-header-top">
          <span className="progress">Archived items ({total})</span>
        </div>
      </div>

      <div className="quiz-scroll archived-view-scroll">
        {total === 0 ? (
          <div className="filtered-empty">
            <p>No archived items.</p>
          </div>
        ) : (
          groups.map(({ section, label, items }) =>
            items.length === 0 ? null : (
              <section key={section} className="archived-group">
                <h3 className="archived-group-title">
                  {label}
                  <span className="archived-group-count">{items.length}</span>
                </h3>
                <ul className="archived-list">
                  {items.map((item) => (
                    <li key={`${section}-${item.id}`} className="archived-list-item">
                      <div className="archived-item-meta">
                        <span className="archived-item-id">#{item.id}</span>
                        <span className="archived-item-label">{getItemLabel(section, item)}</span>
                      </div>
                      <button
                        type="button"
                        className="archived-unarchive-btn"
                        onClick={() => onUnarchive(section, item.id)}
                      >
                        Unarchive
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )
        )}
      </div>
    </div>
  );
}
