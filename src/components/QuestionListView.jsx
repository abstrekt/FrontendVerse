import { useMemo, useState } from 'react';
import DifficultyBadge from './DifficultyBadge';
import { getQuestionStatus } from '../utils/progress';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'completed', label: 'Completed' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'correct', label: 'Correct' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'skipped', label: 'Skipped' },
];

const STATUS_LABELS = {
  unanswered: 'Unanswered',
  correct: 'Correct',
  wrong: 'Wrong',
  skipped: 'Skipped',
};

export default function QuestionListView({
  questions,
  progress,
  skippedIds,
  starredIds = [],
  completedIds = [],
  currentQuestionId,
  onOpenQuestion,
  onUnskip,
}) {
  const [statusFilter, setStatusFilter] = useState('all');

  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const rows = useMemo(() => {
    return questions.map((q) => ({
      question: q,
      status: getQuestionStatus(q.id, progress, skippedIds),
      isStarred: starredSet.has(q.id),
      isCompleted: completedSet.has(q.id),
    }));
  }, [questions, progress, skippedIds, starredSet, completedSet]);

  const counts = useMemo(() => {
    const next = { all: rows.length, starred: 0, completed: 0, unanswered: 0, correct: 0, wrong: 0, skipped: 0 };
    for (const row of rows) {
      if (row.isStarred) next.starred += 1;
      if (row.isCompleted) next.completed += 1;
      next[row.status] += 1;
    }
    return next;
  }, [rows]);

  const visible = useMemo(() => {
    if (statusFilter === 'all') return rows;
    if (statusFilter === 'starred') return rows.filter((row) => row.isStarred);
    if (statusFilter === 'completed') return rows.filter((row) => row.isCompleted);
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  return (
    <div className="quiz-container list-view">
      <div className="quiz-header list-view-header">
        <div className="quiz-header-top">
          <span className="progress">Question list ({visible.length})</span>
        </div>
        <div className="list-status-filters" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === filter.id}
              className={`list-status-chip${statusFilter === filter.id ? ' active' : ''} status-${filter.id}`}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
              <span className="list-status-count">{counts[filter.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-scroll list-view-scroll">
        {visible.length === 0 ? (
          <div className="filtered-empty">
            <p>No questions match this filter.</p>
          </div>
        ) : (
          <ul className="question-list">
            {visible.map(({ question, status, isStarred, isCompleted }) => {
              const topics = question.topics?.length ? question.topics : ['untagged'];
              const isCurrent = question.id === currentQuestionId;

              return (
                <li key={question.id} className="question-list-row">
                  <button
                    type="button"
                    className={`question-list-item status-${status}${isCurrent ? ' current' : ''}`}
                    onClick={() => onOpenQuestion(question.id)}
                  >
                    <span className="question-list-meta">
                      <span className="question-list-id">#{question.id}</span>
                      {isStarred && <span className="list-star-indicator" aria-label="Starred">★</span>}
                      {isCompleted && <span className="list-completed-indicator" aria-label="Completed">✓</span>}
                      <span className={`question-list-status status-${status}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </span>
                    <span className="question-list-title">{question.question}</span>
                    <span className="question-list-topics">
                      <DifficultyBadge difficulty={question.difficulty} />
                      {topics.map((topic) => (
                        <span key={topic} className="topic-badge">{topic}</span>
                      ))}
                    </span>
                  </button>
                  {status === 'skipped' && (
                    <button
                      type="button"
                      className="question-list-unskip-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnskip(question.id);
                      }}
                    >
                      Unskip
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
