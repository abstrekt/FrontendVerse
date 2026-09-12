import ProgressRing from './ProgressRing';
import Icon from './Icon';
import { SECTIONS, NAV_SECTIONS } from '../sections/registry';

const CATEGORY_LABELS = {
  js: 'JavaScript',
  react: 'React',
  css: 'CSS',
  algo: 'Algorithms & design',
};

const CATEGORY_ORDER = ['js', 'react', 'css', 'algo'];

// The registry's subtitle renders "189 questions available"; the card
// already shows the count and the ratio, so only the noun is wanted.
function noun(subtitle, total) {
  if (!subtitle) return '';
  return subtitle(total).replace(/^\d+\s/, '').replace(/\savailable$/, '');
}

/**
 * The overview.
 *
 * The app opened straight into a shuffled MCQ, which answers "what
 * should I do next?" with one option. This answers it with the state of
 * everything: what is in flight, where the weak spots are, and one
 * button per section to resume. Everything here is derived from state
 * App already holds — no new persistence.
 */
export default function Dashboard({
  counts,
  streak,
  mcqAccuracy,
  mcqAnswered,
  outputAccuracy,
  weakTopics = [],
  missedCount = 0,
  onOpenSection,
  onPracticeWeak,
  onReviewMistakes,
}) {
  const tracked = NAV_SECTIONS.filter(
    (id) => SECTIONS[id].kind !== 'archived' && (counts[id]?.total ?? 0) > 0
  );

  const totals = tracked.reduce(
    (acc, id) => {
      acc.done += counts[id].done;
      acc.total += counts[id].total;
      return acc;
    },
    { done: 0, total: 0 }
  );

  const overallPct = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    sections: tracked.filter((id) => SECTIONS[id].category === category),
  })).filter((group) => group.sections.length > 0);

  return (
    <div className="quiz-container dashboard">
      <div className="quiz-scroll dashboard-scroll">
        <section className="dash-hero">
          <div className="dash-hero-main">
            <p className="dash-eyebrow">Overview</p>
            <h2 className="dash-headline">
              {totals.done === 0
                ? 'Nothing done yet — pick somewhere to start.'
                : `${totals.done} of ${totals.total} done across ${tracked.length} sections.`}
            </h2>
          </div>

          <div className="dash-hero-stats">
            <div className="dash-hero-ring">
              <ProgressRing pct={overallPct} size={76} stroke={6}>
                <span className="dash-ring-value">{overallPct}%</span>
              </ProgressRing>
            </div>

            <dl className="dash-stat-row">
              <div className="dash-stat">
                <dt>Streak</dt>
                <dd className={streak.days > 0 && streak.playedToday ? 'is-live' : ''}>
                  {streak.days > 0 ? `${streak.days}d` : '—'}
                </dd>
              </div>
              <div className="dash-stat">
                <dt>MCQ accuracy</dt>
                <dd>{mcqAccuracy !== null ? `${mcqAccuracy}%` : '—'}</dd>
              </div>
              <div className="dash-stat">
                <dt>Answered</dt>
                <dd>{mcqAnswered || '—'}</dd>
              </div>
              <div className="dash-stat">
                <dt>Output accuracy</dt>
                <dd>{outputAccuracy !== null ? `${outputAccuracy}%` : '—'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {(weakTopics.length > 0 || missedCount > 0) && (
          <section className="dash-section dash-focus">
            <h3 className="dash-section-title">Worth a pass</h3>
            <div className="dash-focus-row">
              {weakTopics.slice(0, 4).map((topic) => (
                <button
                  key={topic.topic}
                  type="button"
                  className="dash-focus-card"
                  onClick={onPracticeWeak}
                  style={{ '--focus-pct': `${topic.pct}%` }}
                >
                  <span className="dash-focus-bar" aria-hidden="true" />
                  <span className="dash-focus-name">{topic.topic}</span>
                  <span className="dash-focus-pct">{topic.pct}%</span>
                </button>
              ))}

              {missedCount > 0 && (
                <button type="button" className="dash-focus-card is-review" onClick={onReviewMistakes}>
                  <span className="dash-focus-name">
                    <Icon name="target" size={14} /> Review mistakes
                  </span>
                  <span className="dash-focus-pct">{missedCount}</span>
                </button>
              )}
            </div>
          </section>
        )}

        {groups.map((group) => (
          <section className="dash-section" key={group.category}>
            <h3 className="dash-section-title">{group.label}</h3>

            <div className="dash-grid">
              {group.sections.map((id) => {
                const { label, navIcon, subtitle } = SECTIONS[id];
                const { done, total } = counts[id];
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const complete = done >= total;

                return (
                  <button
                    key={id}
                    type="button"
                    className={`dash-card${complete ? ' is-complete' : ''}`}
                    onClick={() => onOpenSection(id)}
                  >
                    <ProgressRing
                      pct={pct}
                      size={40}
                      stroke={3.5}
                      tone={complete ? 'success' : 'brand'}
                    >
                      <span className="dash-card-mark">{navIcon}</span>
                    </ProgressRing>

                    <span className="dash-card-body">
                      <span className="dash-card-title">{label}</span>
                      <span className="dash-card-meta">
                        {done} / {total} {noun(subtitle, total)}
                      </span>
                    </span>

                    <span className="dash-card-go" aria-hidden="true">
                      <Icon name="arrow-right" size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
