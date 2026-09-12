import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * A steppable trace of an algorithm running on one small input.
 *
 * Authored as a ```trace fenced block of JSON inside a learning's markdown,
 * the same way ```mermaid blocks are handled. The shape is deliberately
 * declarative — roughly ten lines per problem — because there are ~76 Blind
 * 75 problems and hand-laying-out a bespoke figure for each is not a thing
 * anyone would finish or maintain.
 *
 * The Blind 75 *blueprints* keep their bespoke draw.io diagrams: there are
 * nine of them, each explains a different idea, and they earn the effort.
 * These traces answer a narrower question — "what actually happens, one step
 * at a time" — and every algorithm in the set answers it with the same
 * vocabulary: a row of cells, a cursor or two, a window, and some named state.
 *
 * ```trace
 * {
 *   "input": "nums = [3, 2, 4], target = 6",
 *   "lanes": [{ "id": "nums", "label": "nums", "cells": [3, 2, 4], "indices": true }],
 *   "vars": ["need", "map"],
 *   "steps": [{
 *     "note": "6 − 3 = 3. Not seen yet, so remember 3.",
 *     "cursors": { "nums": { "i": 0 } },
 *     "marks":   { "nums": { "0": "active" } },
 *     "vars":    { "need": "3", "map": "{ 3: 0 }" }
 *   }],
 *   "result": "return [1, 2]"
 * }
 * ```
 *
 * `marks` keys are an index (`"2"`) or an inclusive range (`"0-2"`), and the
 * value is a tone: active · hit · done · bad · window.
 */

const STEP_MS = 1500;

/** Expands `{ "0-2": "window", "4": "active" }` into a per-index tone map. */
function expandMarks(marks = {}) {
  const out = new Map();
  for (const [key, tone] of Object.entries(marks)) {
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(key);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      for (let i = Math.min(from, to); i <= Math.max(from, to); i += 1) out.set(i, tone);
    } else {
      out.set(Number(key), tone);
    }
  }
  return out;
}

function Lane({ lane, step }) {
  const marks = useMemo(() => expandMarks(step?.marks?.[lane.id]), [step, lane.id]);
  const cursors = step?.cursors?.[lane.id] ?? {};
  // A lane can carry a per-step value list (a result array filling up).
  const values = step?.cells?.[lane.id] ?? lane.cells;

  const cursorsByIndex = new Map();
  for (const [name, index] of Object.entries(cursors)) {
    if (index === null || index === undefined || index < 0) continue;
    const at = cursorsByIndex.get(index) ?? [];
    at.push(name);
    cursorsByIndex.set(index, at);
  }

  return (
    <div className="trace-lane">
      {lane.label && <span className="trace-lane-label">{lane.label}</span>}

      <div className="trace-lane-body">
        <ol className="trace-cells">
          {values.map((value, i) => {
            const tone = marks.get(i);
            return (
              <li key={i} className="trace-cell-slot">
                <span className={`trace-cell${tone ? ` is-${tone}` : ''}`}>
                  {value === null || value === '' ? '·' : String(value)}
                </span>
                {lane.indices && <span className="trace-index">{i}</span>}
                {cursorsByIndex.has(i) && (
                  <span className="trace-cursor">
                    <span className="trace-cursor-caret" aria-hidden="true" />
                    <span className="trace-cursor-name">{cursorsByIndex.get(i).join(' ')}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default function VisualTrace({ source }) {
  const spec = useMemo(() => {
    try {
      return JSON.parse(source);
    } catch {
      return null;
    }
  }, [source]);

  const steps = spec?.steps ?? [];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef(null);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const last = steps.length - 1;
  const atEnd = index >= last;

  const go = useCallback(
    (next) => setIndex((prev) => Math.max(0, Math.min(last, typeof next === 'function' ? next(prev) : next))),
    [last]
  );

  // Autoplay stops at the end rather than looping — a trace that restarts
  // under you while you are reading the last step is worse than no autoplay.
  useEffect(() => {
    if (!playing) return undefined;
    if (atEnd) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => go((i) => i + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, index, atEnd, go]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPlaying(false);
      go((i) => i + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPlaying(false);
      go((i) => i - 1);
    }
  };

  if (!spec || steps.length === 0) {
    return (
      <pre className="trace-error">
        <code>{source}</code>
      </pre>
    );
  }

  const step = steps[index];
  const varNames = spec.vars ?? [];

  return (
    <figure
      className="trace"
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-roledescription="algorithm trace"
      aria-label={spec.input ? `Trace of ${spec.input}` : 'Algorithm trace'}
    >
      <header className="trace-head">
        {spec.input && <code className="trace-input">{spec.input}</code>}
        <span className="trace-counter">
          step {index + 1} / {steps.length}
        </span>
      </header>

      <div className="trace-board">
        {(spec.lanes ?? []).map((lane) => (
          <Lane key={lane.id} lane={lane} step={step} />
        ))}
      </div>

      {varNames.length > 0 && (
        <dl className="trace-vars">
          {varNames.map((name) => (
            <div className="trace-var" key={name}>
              <dt>{name}</dt>
              <dd>{step.vars?.[name] ?? '—'}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* The note changes on every step, so it is announced politely rather
          than leaving a screen-reader user with a silent board. */}
      <p className="trace-note" role="status" aria-live="polite">
        {step.note}
      </p>

      {spec.result && atEnd && <p className="trace-result">{spec.result}</p>}

      <div className="trace-controls">
        <button
          type="button"
          className="trace-btn"
          onClick={() => {
            setPlaying(false);
            go((i) => i - 1);
          }}
          disabled={index === 0}
          aria-label="Previous step"
        >
          <Icon name="chevron-left" size={15} />
        </button>

        <button
          type="button"
          className="trace-btn"
          onClick={() => {
            setPlaying(false);
            go((i) => i + 1);
          }}
          disabled={atEnd}
          aria-label="Next step"
        >
          <Icon name="chevron-right" size={15} />
        </button>

        {!reduceMotion && (
          <button
            type="button"
            className={`trace-btn trace-play${playing ? ' is-playing' : ''}`}
            onClick={() => {
              if (atEnd) go(0);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? 'Pause' : 'Play the trace'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={14} filled />
            <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}</span>
          </button>
        )}

        <ol className="trace-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                className={`trace-dot${i === index ? ' is-current' : ''}${i < index ? ' is-past' : ''}`}
                onClick={() => {
                  setPlaying(false);
                  go(i);
                }}
                tabIndex={-1}
              />
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
