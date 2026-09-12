import { useMemo, useState } from 'react';
import DifficultyBadge from './DifficultyBadge';
import {
  buildQuestionRows,
  getQuestionStatusCounts,
  QUESTION_STATUS_FILTERS,
  QUESTION_STATUS_LABELS,
} from '../utils/questionState';
import Icon from './Icon';

/**
 * The whole pool as a table.
 *
 * Each question used to be a bordered card roughly 115px tall, so a
 * 189-question pool filled eight screens and the only way to find one
 * was to scroll. These are 40px rows under a sticky header: status in
 * a fixed gutter, then id, title, difficulty, topics. The point of the
 * list view is to see a lot at once — anything that does not survive
 * one line belongs on the question page instead.
 */
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
  const [query, setQuery] = useState('');

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
    let out = rows;

    if (statusFilter === 'starred') out = out.filter((row) => row.isStarred);
    else if (statusFilter === 'completed') out = out.filter((row) => row.isCompleted);
    else if (statusFilter !== 'all') out = out.filter((row) => row.status === statusFilter);

    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (row) =>
          row.question.question.toLowerCase().includes(q) ||
          String(row.question.id) === q ||
          row.question.topics?.some((topic) => topic.toLowerCase().includes(q))
      );
    }

    return out;
  }, [rows, statusFilter, query]);

  return (
    <div className="quiz-container list-view">
      <div className="list-view-header">
        <div className="list-status-filters" role="group" aria-label="Filter by status">
          {QUESTION_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={statusFilter === filter.id}
              className={`list-status-chip${
                statusFilter === filter.id ? ' active' : ''
              } status-${filter.id}`}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
              <span className="list-status-count">{counts[filter.id]}</span>
            </button>
          ))}

          <div className="list-header-spacer" />

          <div className="panel-search list-search">
            <Icon name="search" size={13} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter questions…"
              aria-label="Filter questions"
            />
            {query && (
              <button
                type="button"
                className="panel-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="quiz-scroll list-view-scroll">
        {visible.length === 0 ? (
          <div className="filtered-empty">
            <p>No questions match this filter.</p>
          </div>
        ) : (
          <>
            <div className="question-table">
              <div className="question-row question-row-head" aria-hidden="true">
                <span className="question-col-status">Status</span>
                <span className="question-col-id">#</span>
                <span className="question-col-title">Question</span>
                <span className="question-col-difficulty">Level</span>
                <span className="question-col-topics">Topics</span>
              </div>

              <ul className="question-list">
                {visible.map(({ question, status, isStarred, isCompleted }) => {
                  const topics = question.topics?.length ? question.topics : [];
                  const isCurrent = question.id === currentQuestionId;

                  return (
                    <li key={question.id} className="question-list-row">
                      <button
                        type="button"
                        className={`question-row question-list-item status-${status}${
                          isCurrent ? ' current' : ''
                        }`}
                        onClick={() => onOpenQuestion(question.id)}
                        title={question.question}
                      >
                        <span className="question-col-status">
                          <span
                            className={`status-dot status-${status}`}
                            title={QUESTION_STATUS_LABELS[status]}
                          />
                          <span className="sr-only">
                            {QUESTION_STATUS_LABELS[status]}.{' '}
                          </span>
                          {isCompleted && (
                            <span className="list-completed-indicator">
                              <Icon name="check" size={13} />
                              <span className="sr-only">Mastered. </span>
                            </span>
                          )}
                          {isStarred && (
                            <span className="list-star-indicator">
                              <Icon name="star" size={12} filled />
                              <span className="sr-only">Starred. </span>
                            </span>
                          )}
                        </span>

                        <span className="question-col-id">{question.id}</span>

                        <span className="question-col-title">{question.question}</span>

                        <span className="question-col-difficulty">
                          <DifficultyBadge difficulty={question.difficulty} />
                        </span>

                        <span className="question-col-topics">
                          {topics.slice(0, 3).map((topic) => (
                            <span key={topic} className="topic-badge">
                              {topic}
                            </span>
                          ))}
                          {topics.length > 3 && (
                            <span className="topic-badge topic-badge-more">
                              +{topics.length - 3}
                            </span>
                          )}
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
            </div>

            <p className="list-view-footnote">
              {visible.length} of {rows.length} · {scopeLabel.toLowerCase()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
