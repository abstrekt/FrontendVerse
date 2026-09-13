/**
 * The shape check for a ```trace block, shared by both appliers.
 *
 * A trace is authored as a plain object and only ever seen again as JSON
 * inside a markdown string, so a typo in a lane id is invisible until the
 * board renders half-empty in the browser. Every reference a step makes —
 * to a lane, a node, a slot, a phase, a variable — is resolved here instead,
 * at build time, where the error can name the item it came from.
 *
 * Lifted out of apply-blind75-traces.mjs when the React set arrived and
 * needed lanes that are not rows of array cells.
 *
 * ── Lane kinds ────────────────────────────────────────────────────
 *
 *   cells   (default)  a row of array slots
 *     { id, label, cells: [3, 2, 4], indices: true }
 *     marks/cursors are keyed by index (`"2"`) or range (`"0-2"`)
 *
 *   tree    a component / Fiber tree
 *     { id, label, kind: 'tree', nodes: [{ id: 'app', label: 'App' },
 *                                        { id: 'list', label: 'List', parent: 'app' }] }
 *     marks/cursors are keyed by node id
 *
 *   slots   the hook linked list, or any set of named cells
 *     { id, label, kind: 'slots', slots: ['count', 'name'] }
 *     marks/cursors are keyed by slot name
 *
 *   phases  a left-to-right timeline
 *     { id, label, kind: 'phases', of: ['render', 'commit', 'paint'] }
 *     marks/cursors are keyed by phase name
 *
 *   log     append-only output lines
 *     { id, label, kind: 'log' }
 *     content comes from `step.cells[laneId]`; marks are keyed by line index
 *
 * ── Tones ─────────────────────────────────────────────────────────
 *
 *   active  being read / rendering right now
 *   hit     the payoff
 *   bad     the wasted work being removed
 *   skip    bailed out — memoised, not re-rendered
 *   window  inside the current window / subtree
 *   done    already consumed or committed
 */

export const LANE_KINDS = new Set(['cells', 'tree', 'slots', 'phases', 'log']);

export const TONES = new Set(['active', 'hit', 'bad', 'skip', 'window', 'done']);

const RANGE = /^\d+\s*-\s*\d+$/;
const INDEX = /^\d+$/;

function laneKind(lane) {
  return lane.kind ?? 'cells';
}

/** The set of names a step may address on this lane, or null if numeric. */
function addressSpace(lane) {
  switch (laneKind(lane)) {
    case 'tree':
      return new Set((lane.nodes ?? []).map((n) => n.id));
    case 'slots':
      return new Set(lane.slots ?? []);
    case 'phases':
      return new Set(lane.of ?? []);
    default:
      // cells and log are addressed by index.
      return null;
  }
}

function checkKey(key, lane, names, where, fail) {
  if (names) {
    if (!names.has(key)) {
      fail(`${where} names unknown ${laneKind(lane)} key "${key}" on lane "${lane.id}"`);
    }
    return;
  }
  if (!INDEX.test(String(key)) && !RANGE.test(String(key))) {
    fail(`${where} key "${key}" on lane "${lane.id}" is not an index or "a-b" range`);
  }
}

/**
 * Throws on the first problem found. `label` prefixes every message so the
 * caller does not have to wrap the error to say which item broke.
 */
export function validateTrace(trace, label = 'trace') {
  const fail = (message) => {
    throw new Error(`${label}: ${message}`);
  };

  if (!trace || typeof trace !== 'object') fail('is not an object');
  if (!Array.isArray(trace.lanes) || trace.lanes.length === 0) fail('has no lanes');
  if (!Array.isArray(trace.steps) || trace.steps.length === 0) fail('has no steps');

  const byId = new Map();

  for (const lane of trace.lanes) {
    if (!lane.id) fail('has a lane with no id');
    if (byId.has(lane.id)) fail(`declares lane "${lane.id}" twice`);
    if (!LANE_KINDS.has(laneKind(lane))) {
      fail(`lane "${lane.id}" has unknown kind "${lane.kind}"`);
    }
    byId.set(lane.id, lane);

    const kind = laneKind(lane);
    if (kind === 'cells' && !Array.isArray(lane.cells)) {
      fail(`cells lane "${lane.id}" has no cells array`);
    }
    if (kind === 'slots' && !Array.isArray(lane.slots)) {
      fail(`slots lane "${lane.id}" has no slots array`);
    }
    if (kind === 'phases' && (!Array.isArray(lane.of) || lane.of.length === 0)) {
      fail(`phases lane "${lane.id}" has no phases in "of"`);
    }
    if (kind === 'tree') {
      if (!Array.isArray(lane.nodes) || lane.nodes.length === 0) {
        fail(`tree lane "${lane.id}" has no nodes`);
      }
      const nodeIds = new Set();
      for (const node of lane.nodes) {
        if (!node.id) fail(`tree lane "${lane.id}" has a node with no id`);
        if (nodeIds.has(node.id)) fail(`tree lane "${lane.id}" declares node "${node.id}" twice`);
        nodeIds.add(node.id);
      }
      // A parent must already be declared: the renderer lays the tree out in
      // one pass over `nodes`, so a forward reference would place the child
      // before its row exists.
      const seen = new Set();
      let roots = 0;
      for (const node of lane.nodes) {
        if (node.parent === undefined || node.parent === null) roots += 1;
        else if (!seen.has(node.parent)) {
          fail(`tree lane "${lane.id}": node "${node.id}" names parent "${node.parent}" before it is declared`);
        }
        seen.add(node.id);
      }
      if (roots === 0) fail(`tree lane "${lane.id}" has no root node`);
    }
  }

  const declaredVars = new Set(trace.vars ?? []);

  trace.steps.forEach((step, i) => {
    const at = `step ${i + 1}`;
    if (!step || typeof step !== 'object') fail(`${at} is not an object`);
    if (!step.note) fail(`${at} has no note`);

    for (const [laneId, marks] of Object.entries(step.marks ?? {})) {
      const lane = byId.get(laneId);
      if (!lane) fail(`${at} marks unknown lane "${laneId}"`);
      const names = addressSpace(lane);
      for (const [key, toneName] of Object.entries(marks)) {
        checkKey(key, lane, names, `${at} mark`, fail);
        if (!TONES.has(toneName)) {
          fail(`${at} uses unknown tone "${toneName}" on lane "${laneId}"`);
        }
      }
    }

    for (const [laneId, cursors] of Object.entries(step.cursors ?? {})) {
      const lane = byId.get(laneId);
      if (!lane) fail(`${at} sets a cursor on unknown lane "${laneId}"`);
      const names = addressSpace(lane);
      for (const value of Object.values(cursors)) {
        // A null cursor is how a trace parks a pointer off the board.
        if (value === null || value === undefined) continue;
        if (names) {
          if (!names.has(value)) {
            fail(`${at} cursor points at unknown ${laneKind(lane)} "${value}" on lane "${laneId}"`);
          }
        } else if (!Number.isInteger(value)) {
          fail(`${at} cursor on lane "${laneId}" is "${value}", not an index`);
        }
      }
    }

    for (const [laneId, content] of Object.entries(step.cells ?? {})) {
      const lane = byId.get(laneId);
      if (!lane) fail(`${at} sets content on unknown lane "${laneId}"`);
      const kind = laneKind(lane);
      if (kind === 'tree' || kind === 'slots') {
        // Both address by name, so an object is the natural override; an
        // array is allowed for slots because it reads better positionally.
        if (Array.isArray(content)) {
          if (kind === 'tree') fail(`${at} content for tree lane "${laneId}" must be an object`);
          if (content.length !== lane.slots.length) {
            fail(`${at} content for slots lane "${laneId}" has ${content.length} values, expected ${lane.slots.length}`);
          }
        } else {
          const names = addressSpace(lane);
          for (const key of Object.keys(content ?? {})) {
            if (!names.has(key)) {
              fail(`${at} content names unknown ${kind} key "${key}" on lane "${laneId}"`);
            }
          }
        }
      } else if (kind === 'phases') {
        fail(`${at} sets content on phases lane "${laneId}", which has none`);
      } else if (!Array.isArray(content)) {
        fail(`${at} content for lane "${laneId}" must be an array`);
      }
    }

    for (const name of Object.keys(step.vars ?? {})) {
      if (!declaredVars.has(name)) fail(`${at} sets undeclared var "${name}"`);
    }
  });

  return trace;
}
