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
 * value is a tone: active · hit · done · bad · skip · window.
 *
 * ── Lane kinds ────────────────────────────────────────────────────
 *
 * A lane defaults to `cells`, the row of array slots above. React has no
 * arrays to point at — the thing worth watching is a tree re-rendering, a
 * hook slot being read in order, or the render→commit→paint pipeline
 * advancing — so four more kinds share the same step machinery:
 *
 *   tree    { kind: 'tree', nodes: [{ id, label, parent }] }
 *           marks/cursors keyed by node id. A parent must be declared
 *           before its children; the layout is one pass over `nodes`.
 *
 *   slots   { kind: 'slots', slots: ['count', 'name'] }
 *           the hook linked list. Values come from `step.cells[laneId]`,
 *           either positionally or as a name → value object.
 *
 *   phases  { kind: 'phases', of: ['render', 'commit', 'paint'] }
 *           a left-to-right timeline. The cursor names the current phase;
 *           everything before it is implicitly spent.
 *
 *   log     { kind: 'log' }
 *           append-only output lines from `step.cells[laneId]`, for the
 *           "what actually logs?" questions.
 *
 * `scripts/lib/trace-validate.mjs` is the authority on the contract and
 * rejects a trace that addresses a lane, node, slot, phase or var it never
 * declared — see `src/utils/traceValidate.test.js`.
 */

const STEP_MS = 1500;

/**
 * Renders the two pieces of inline markup a trace's prose actually uses:
 * `` `code` `` and `**bold**`.
 *
 * The notes are plain strings inside a JSON block, not markdown — nothing
 * downstream parses them — so a note reading "the `count` variable" used to
 * render with the backticks visible. Naming a hook or a prop is most of what
 * these notes do, so the alternative was writing every one of them without
 * being able to mark up an identifier.
 *
 * Deliberately not a markdown parser: two forms, no nesting, no links.
 */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*)/g;

function RichText({ children }) {
  if (typeof children !== 'string') return children ?? null;

  return children.split(INLINE).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

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

/** Collects `{ name: target }` cursors into `target → [names]`. */
function groupCursors(cursors = {}) {
  const out = new Map();
  for (const [name, target] of Object.entries(cursors)) {
    if (target === null || target === undefined || target === -1) continue;
    const at = out.get(target) ?? [];
    at.push(name);
    out.set(target, at);
  }
  return out;
}

function Cursor({ names }) {
  return (
    <span className="trace-cursor">
      <span className="trace-cursor-caret" aria-hidden="true" />
      <span className="trace-cursor-name">{names.join(' ')}</span>
    </span>
  );
}

function CellsLane({ lane, step }) {
  const marks = useMemo(() => expandMarks(step?.marks?.[lane.id]), [step, lane.id]);
  // A lane can carry a per-step value list (a result array filling up).
  const values = step?.cells?.[lane.id] ?? lane.cells;
  const cursorsByIndex = groupCursors(step?.cursors?.[lane.id]);

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
                {cursorsByIndex.has(i) && <Cursor names={cursorsByIndex.get(i)} />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/**
 * A component tree as an indented outline rather than a drawn graph.
 *
 * A real node-and-edge tree needs width the reading column does not have at
 * 400px, and the only thing these traces ask of it is "which of these
 * re-rendered and which bailed out" — which an indented list answers just as
 * well, at any width, with the node labels always horizontal.
 */
function TreeLane({ lane, step }) {
  const rows = useMemo(() => {
    const depthOf = new Map();
    return lane.nodes.map((node) => {
      const depth = node.parent === undefined || node.parent === null ? 0 : (depthOf.get(node.parent) ?? 0) + 1;
      depthOf.set(node.id, depth);
      return { ...node, depth };
    });
  }, [lane.nodes]);

  const marks = step?.marks?.[lane.id] ?? {};
  const cursorsByNode = groupCursors(step?.cursors?.[lane.id]);
  const labels = step?.cells?.[lane.id] ?? {};

  return (
    <div className="trace-lane trace-lane-block">
      {lane.label && <span className="trace-lane-label">{lane.label}</span>}

      <div className="trace-lane-body">
        <ol className="trace-tree">
          {rows.map((node) => {
            const tone = marks[node.id];
            return (
              <li
                key={node.id}
                className={`trace-tree-row${node.depth > 0 ? ' is-nested' : ''}`}
                style={{ '--trace-depth': node.depth }}
              >
                <span className={`trace-node${tone ? ` is-${tone}` : ''}`}>
                  {labels[node.id] ?? node.label ?? node.id}
                </span>
                {node.note && <span className="trace-node-note">{node.note}</span>}
                {cursorsByNode.has(node.id) && (
                  <span className="trace-node-cursor">{cursorsByNode.get(node.id).join(' ')}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** The hook linked list: named slots read in a fixed order. */
function SlotsLane({ lane, step }) {
  const marks = step?.marks?.[lane.id] ?? {};
  const cursorsBySlot = groupCursors(step?.cursors?.[lane.id]);
  const content = step?.cells?.[lane.id];

  const valueOf = (name, i) => {
    if (Array.isArray(content)) return content[i];
    if (content && typeof content === 'object') return content[name];
    return undefined;
  };

  return (
    <div className="trace-lane">
      {lane.label && <span className="trace-lane-label">{lane.label}</span>}

      <div className="trace-lane-body">
        <ol className="trace-slots">
          {lane.slots.map((name, i) => {
            const tone = marks[name];
            const value = valueOf(name, i);
            return (
              <li key={name} className="trace-slot">
                <span className="trace-slot-name">{name}</span>
                <span className={`trace-cell${tone ? ` is-${tone}` : ''}`}>
                  {value === null || value === undefined || value === '' ? '·' : String(value)}
                </span>
                {cursorsBySlot.has(name) && <Cursor names={cursorsBySlot.get(name)} />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/**
 * A left-to-right pipeline. Whichever phase the cursor names is current;
 * everything before it is spent, everything after it has not happened yet —
 * derived from position so a step only has to move the one cursor.
 */
function PhasesLane({ lane, step }) {
  const marks = step?.marks?.[lane.id] ?? {};
  const cursors = step?.cursors?.[lane.id] ?? {};
  const current = Object.values(cursors).find((v) => v !== null && v !== undefined);
  const at = lane.of.indexOf(current);

  return (
    <div className="trace-lane">
      {lane.label && <span className="trace-lane-label">{lane.label}</span>}

      <div className="trace-lane-body">
        <ol className="trace-phases">
          {lane.of.map((name, i) => {
            const positional = at === -1 ? '' : i < at ? ' is-spent' : i === at ? ' is-now' : ' is-ahead';
            const tone = marks[name];
            return (
              <li key={name} className="trace-phase-slot">
                <span className={`trace-phase${positional}${tone ? ` is-${tone}` : ''}`}>{name}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Append-only output — what actually logged, in order. */
function LogLane({ lane, step }) {
  const marks = useMemo(() => expandMarks(step?.marks?.[lane.id]), [step, lane.id]);
  const lines = step?.cells?.[lane.id] ?? lane.lines ?? [];

  return (
    <div className="trace-lane trace-lane-block">
      {lane.label && <span className="trace-lane-label">{lane.label}</span>}

      <div className="trace-lane-body">
        <ol className="trace-log">
          {lines.length === 0 ? (
            <li className="trace-log-line is-empty">nothing yet</li>
          ) : (
            lines.map((line, i) => (
              <li key={i} className={`trace-log-line${marks.get(i) ? ` is-${marks.get(i)}` : ''}`}>
                {String(line)}
              </li>
            ))
          )}
        </ol>
      </div>
    </div>
  );
}

const LANES = {
  cells: CellsLane,
  tree: TreeLane,
  slots: SlotsLane,
  phases: PhasesLane,
  log: LogLane,
};

function Lane({ lane, step }) {
  const Renderer = LANES[lane.kind ?? 'cells'];
  if (!Renderer) return null;
  return <Renderer lane={lane} step={step} />;
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
      aria-roledescription="step-through trace"
      aria-label={spec.input ? `Trace of ${spec.input}` : 'Step-through trace'}
    >
      <header className="trace-head">
        {spec.input && (
          <code className="trace-input">
            <RichText>{spec.input}</RichText>
          </code>
        )}
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
        <RichText>{step.note}</RichText>
      </p>

      {spec.result && atEnd && (
        <p className="trace-result">
          <RichText>{spec.result}</RichText>
        </p>
      )}

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
