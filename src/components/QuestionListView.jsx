import { useMemo, useState } from 'react';
import DifficultyBadge from './DifficultyBadge';
import {
  buildQuestionRows,
  getQuestionStatusCounts,
  QUESTION_STATUS_FILTERS,
  QUESTION_STATUS_LABELS,
} from '../utils/questionState';

export default function QuestionListView({
  questions,
  progress,
  skippedIds,
  passState,
  starredIds = [],
  completedIds = [],
  currentQuestionId,
  onOpenQuestion,
  onUnskip,
  scopeLabel = 'Current pass',
}) {
  const [statusFilter, setStatusFilter] = useState('all');

  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const rows = useMemo(() => {
    return buildQuestionRows(questions, {
      progress,
      skippedIds,
      passState,
      starredIds: starredSet,
      completedIds: completedSet,
    });
  }, [questions, progress, skippedIds, passState, starredSet, completedSet]);

  const counts = useMemo(() => getQuestionStatusCounts(rows), [rows]);

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
          <span className="progress">{scopeLabel} ({visible.length})</span>
        </div>
        <div className="list-status-filters" role="tablist" aria-label="Filter by status">
          {QUESTION_STATUS_FILTERS.map((filter) => (
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
                      {isCompleted && <span className="list-completed-indicator" aria-label="Mastered">✓</span>}
                      <span className={`question-list-status status-${status}`}>
                        {QUESTION_STATUS_LABELS[status]}
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
