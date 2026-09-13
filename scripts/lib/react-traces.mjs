/**
 * The React blueprint + trace table, keyed by section and item id.
 *
 * Each entry pairs one of the ~35 blueprints in `react-diagrams.mjs` with a
 * steppable trace of that mechanism running on one concrete case. The
 * blueprint is shared — a dozen items are about the reference trap and all
 * of them want the same picture — while the trace belongs to the item and
 * follows the code that item actually publishes.
 *
 * Entry shape:
 *   diagram  a key in react-diagrams.mjs `DIAGRAMS`
 *   alt      the image's alt text
 *   after    exact `## Heading` to insert below; defaults to the end of the
 *            item's opening section
 *   trace    input · lanes · vars · steps · result
 *
 * Lane kinds and tones are documented in `trace-validate.mjs`, which rejects
 * a step that addresses a lane, node, slot, phase or var it never declared.
 *
 * Applied by `scripts/apply-react-traces.mjs`; `--check` fails if an item in
 * any of the four React data files has no entry here.
 */

/* ══════════════════════════════════════════════════════════════════
   Items that get a blueprint but no step trace.
   Both are index pages — a table of contents and a cheat sheet — and
   there is no single mechanism to step through.
   ══════════════════════════════════════════════════════════════════ */

export const DIAGRAM_ONLY = {
  'react-guide': [1, 39],
};

export const TRACES = {
  'react-guide': {
  /* ── 1 · How to Use This Guide ─────────────────────────────────── */
  1: {
    diagram: 'guide_map',
    alt: 'The React guide as a dependency map',
  },

  /* ── 2 · Elements → Fiber → DOM ────────────────────────────────── */
  2: {
    diagram: 'three_trees',
    alt: 'Elements, the fiber tree and the DOM',
    after: '## The three trees',
    trace: {
      input: '<App><List items={["Ada","Grace"]}/></App> renders for the first time',
      lanes: [
        {
          id: 'tree',
          label: 'fiber',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App' },
            { id: 'list', label: 'List' , parent: 'app' },
            { id: 'ada', label: 'Row "Ada"', parent: 'list' },
            { id: 'grace', label: 'Row "Grace"', parent: 'list' },
          ],
        },
        { id: 'phase', label: 'phase', kind: 'phases', of: ['render', 'commit', 'paint'] },
        { id: 'dom', label: 'DOM', kind: 'log' },
      ],
      vars: ['elements', 'work'],
      steps: [
        {
          note: 'JSX has already run, so a tree of plain element objects exists. Nothing is on screen — these are descriptions, and React has not looked at them yet.',
          cursors: { phase: { now: 'render' } },
          vars: { elements: '{ type: App } → { type: List } → 2 × { type: Row }', work: 'App' },
          cells: { dom: [] },
        },
        {
          note: 'React begins the render phase at the root. It creates a fiber for App — a persistent node that will hold App\'s state — and moves to its child.',
          cursors: { phase: { now: 'render' }, tree: { at: 'app' } },
          marks: { tree: { app: 'active' } },
          vars: { elements: 'consumed for App', work: 'List' },
          cells: { dom: [] },
        },
        {
          note: 'Same for List, then for each Row. This is a walk over a linked list, not a recursive call — React can stop between any two nodes and come back.',
          cursors: { phase: { now: 'render' }, tree: { at: 'grace' } },
          marks: { tree: { app: 'done', list: 'active', ada: 'active', grace: 'active' } },
          vars: { elements: 'all consumed', work: 'none left' },
          cells: { dom: [] },
        },
        {
          note: 'Commit. Only now does React touch the browser, applying the whole batch of changes at once. Fibers of type App have no DOM node of their own; List and Row do.',
          cursors: { phase: { now: 'commit' } },
          marks: { tree: { app: 'done', list: 'hit', ada: 'hit', grace: 'hit' } },
          vars: { elements: 'thrown away', work: 'flushing' },
          cells: { dom: ['<ul>', '  <li>Ada</li>', '  <li>Grace</li>', '</ul>'] },
        },
        {
          note: 'Paint. The element objects are garbage now and will be rebuilt from scratch next render; the fiber tree stays, holding the state.',
          cursors: { phase: { now: 'paint' } },
          marks: { tree: { app: 'done', list: 'done', ada: 'done', grace: 'done' }, dom: { '0-3': 'hit' } },
          vars: { elements: 'gone — rebuilt every render', work: 'idle' },
          cells: { dom: ['<ul>', '  <li>Ada</li>', '  <li>Grace</li>', '</ul>'] },
        },
      ],
      result: 'Elements are disposable, fibers persist, the DOM is written once',
    },
  },

  /* ── 3 · Render → Commit → Effects ─────────────────────────────── */
  3: {
    diagram: 'render_commit_effects',
    alt: 'The render, commit, paint and effects pipeline',
    after: '## The full sequence',
    trace: {
      input: 'setCount(1) on a component with a layout effect and a passive effect',
      lanes: [
        {
          id: 'phase',
          label: 'phase',
          kind: 'phases',
          of: ['render', 'reconcile', 'commit', 'layout effect', 'paint', 'effect'],
        },
        { id: 'log', label: 'runs', kind: 'log' },
      ],
      vars: ['on screen', 'blocking paint?'],
      steps: [
        {
          note: 'The component function body runs and returns new elements. It must be pure here — no DOM reads, no fetches. Nothing has changed on screen.',
          cursors: { phase: { now: 'render' } },
          vars: { 'on screen': 'count = 0', 'blocking paint?': 'yes' },
          cells: { log: ['Counter() → <span>1</span>'] },
        },
        {
          note: 'React diffs the new tree against the committed one and records the minimum set of DOM operations. Still nothing on screen.',
          cursors: { phase: { now: 'reconcile' } },
          vars: { 'on screen': 'count = 0', 'blocking paint?': 'yes' },
          cells: { log: ['Counter() → <span>1</span>', 'diff: update text 0 → 1'] },
        },
        {
          note: 'Commit. React mutates the real DOM and attaches refs. The node now says 1 — but the browser has not drawn a frame yet.',
          cursors: { phase: { now: 'commit' } },
          marks: { log: { 2: 'active' } },
          vars: { 'on screen': 'count = 0', 'blocking paint?': 'yes' },
          cells: { log: ['Counter() → <span>1</span>', 'diff: update text 0 → 1', 'DOM ← "1", refs attached'] },
        },
        {
          note: 'useLayoutEffect runs synchronously, before paint. Measure and re-position here and the user never sees the intermediate frame — the cost is that the browser is still waiting.',
          cursors: { phase: { now: 'layout effect' } },
          marks: { log: { 3: 'active' } },
          vars: { 'on screen': 'count = 0', 'blocking paint?': 'yes' },
          cells: { log: ['Counter() → <span>1</span>', 'diff: update text 0 → 1', 'DOM ← "1", refs attached', 'useLayoutEffect — measure, reposition'] },
        },
        {
          note: 'Paint. This is the first moment anything is visible. Everything above this line was blocking it.',
          cursors: { phase: { now: 'paint' } },
          marks: { log: { 4: 'hit' } },
          vars: { 'on screen': 'count = 1', 'blocking paint?': 'no' },
          cells: { log: ['Counter() → <span>1</span>', 'diff: update text 0 → 1', 'DOM ← "1", refs attached', 'useLayoutEffect — measure, reposition', 'browser paints'] },
        },
        {
          note: 'useEffect runs last, after the frame. Fetches, subscriptions and logging belong here precisely because the user did not have to wait for them.',
          cursors: { phase: { now: 'effect' } },
          marks: { log: { 5: 'hit' } },
          vars: { 'on screen': 'count = 1', 'blocking paint?': 'no' },
          cells: { log: ['Counter() → <span>1</span>', 'diff: update text 0 → 1', 'DOM ← "1", refs attached', 'useLayoutEffect — measure, reposition', 'browser paints', 'useEffect — subscribe, fetch, log'] },
        },
      ],
      result: 'One render, one paint, effects after',
    },
  },

  /* ── 4 · Reconciliation ────────────────────────────────────────── */
  4: {
    diagram: 'reconciliation_keys',
    alt: 'Reconciliation diffs by position, then by type',
    trace: {
      input: '<div><Counter/></div>  →  <span><Counter/></span>',
      lanes: [
        {
          id: 'before',
          label: 'before',
          kind: 'tree',
          nodes: [
            { id: 'div', label: 'div' },
            { id: 'counter', label: 'Counter · state = 5', parent: 'div' },
          ],
        },
        {
          id: 'after',
          label: 'after',
          kind: 'tree',
          nodes: [
            { id: 'span', label: 'span' },
            { id: 'c2', label: 'Counter · state = ?', parent: 'span' },
          ],
        },
      ],
      vars: ['rule applied', 'Counter state'],
      steps: [
        {
          note: 'React compares position by position, not by walking the whole tree for the cheapest edit. Root position: `div` before, `span` after.',
          marks: { before: { div: 'active' }, after: { span: 'active' } },
          vars: { 'rule applied': 'compare types at this position', 'Counter state': '5' },
        },
        {
          note: 'Different type. The heuristic says: do not try to be clever. Unmount the entire subtree and build a new one — even though a human can see `Counter` is unchanged.',
          marks: { before: { div: 'bad', counter: 'bad' }, after: { span: 'active' } },
          vars: { 'rule applied': 'different type → destroy subtree', 'Counter state': 'discarded' },
        },
        {
          note: 'The new `Counter` mounts fresh, with its initial state. This is O(n) rather than the O(n³) a true tree-diff would cost, and the price is exactly this case.',
          marks: { before: { div: 'done', counter: 'done' }, after: { span: 'hit', c2: 'hit' } },
          vars: { 'rule applied': 'mount new subtree', 'Counter state': '0 — reset' },
        },
        {
          note: 'Had the wrapper stayed a `div`, the type would have matched and React would have kept the fiber, kept the state, and only updated props. Same element, same position, same type — that is the whole rule.',
          marks: { before: { div: 'skip', counter: 'skip' }, after: { span: 'skip', c2: 'skip' } },
          vars: { 'rule applied': 'same type → keep fiber, update props', 'Counter state': '5 — preserved' },
        },
      ],
      result: 'Changing the wrapper tag reset the child',
    },
  },

  /* ── 5 · One-way data flow ─────────────────────────────────────── */
  5: {
    diagram: 'one_way_dataflow',
    alt: 'Props flow down, events flow up',
    trace: {
      input: '<App> owns `filter`; <SearchBox> is three levels down',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App · owns filter' },
            { id: 'toolbar', label: 'Toolbar', parent: 'app' },
            { id: 'search', label: 'SearchBox', parent: 'toolbar' },
            { id: 'results', label: 'Results', parent: 'app' },
          ],
        },
      ],
      vars: ['filter', 'direction'],
      steps: [
        {
          note: 'The user types "re" in SearchBox. It cannot change `filter` — it does not own it. All it can do is call the callback it was handed.',
          cursors: { tree: { at: 'search' } },
          marks: { tree: { search: 'active' } },
          vars: { filter: '""', direction: 'event climbing ↑' },
        },
        {
          note: 'The call travels up the ownership chain as an ordinary function call. Toolbar passed it straight through; it has no say in what the event means.',
          cursors: { tree: { at: 'toolbar' } },
          marks: { tree: { search: 'done', toolbar: 'active' } },
          vars: { filter: '""', direction: 'event climbing ↑' },
        },
        {
          note: 'App — the owner — decides. It calls `setFilter("re")`. This is the only place in the app where `filter` can change, which is what makes the bug hunt short.',
          cursors: { tree: { at: 'app' } },
          marks: { tree: { app: 'hit' } },
          vars: { filter: '"re"', direction: 'state updated' },
        },
        {
          note: 'Now the new value falls back down as props, and every reader re-renders with it. One source, one direction, no way for two components to disagree.',
          marks: { tree: { app: 'hit', toolbar: 'active', search: 'active', results: 'active' } },
          vars: { filter: '"re"', direction: 'props falling ↓' },
        },
      ],
      result: '"Who changed this?" has exactly one answer',
    },
  },

  /* ── 40 · What is useEffect ────────────────────────────────────── */
  40: {
    diagram: 'effect_deps_cleanup',
    alt: 'Effect dependencies and cleanup order',
    after: '## The three dependency-array shapes',
    trace: {
      input: 'useEffect(() => { const s = api.subscribe(h); return () => s.unsubscribe(); }, [api])',
      lanes: [
        { id: 'phase', label: 'phase', kind: 'phases', of: ['render', 'paint', 'cleanup', 'setup'] },
        { id: 'log', label: 'calls', kind: 'log' },
      ],
      vars: ['api', 'live subscriptions'],
      steps: [
        {
          note: 'Mount. The component renders and paints first — a passive effect never blocks the frame.',
          cursors: { phase: { now: 'paint' } },
          vars: { api: 'apiA', 'live subscriptions': '0' },
          cells: { log: [] },
        },
        {
          note: 'Then setup runs. There is no previous effect, so there is nothing to clean up first.',
          cursors: { phase: { now: 'setup' } },
          marks: { log: { 0: 'active' } },
          vars: { api: 'apiA', 'live subscriptions': '1' },
          cells: { log: ['apiA.subscribe(h)'] },
        },
        {
          note: '`api` changes to apiB. React compares the array with `Object.is` — a different reference, so the effect must re-run.',
          cursors: { phase: { now: 'render' } },
          vars: { api: 'apiB', 'live subscriptions': '1' },
          cells: { log: ['apiA.subscribe(h)'] },
        },
        {
          note: 'Cleanup runs **first**, with the old closure. This is the step people forget, and it is what keeps the subscription count at one instead of climbing.',
          cursors: { phase: { now: 'cleanup' } },
          marks: { log: { 0: 'done', 1: 'active' } },
          vars: { api: 'apiB', 'live subscriptions': '0' },
          cells: { log: ['apiA.subscribe(h)', 'apiA.unsubscribe()'] },
        },
        {
          note: 'Then setup runs again with the new value. Teardown-then-setup is the invariant — which is why an effect with a cleanup is safe to re-run any number of times.',
          cursors: { phase: { now: 'setup' } },
          marks: { log: { '0-1': 'done', 2: 'hit' } },
          vars: { api: 'apiB', 'live subscriptions': '1' },
          cells: { log: ['apiA.subscribe(h)', 'apiA.unsubscribe()', 'apiB.subscribe(h)'] },
        },
        {
          note: 'Unmount. The last cleanup runs and nothing is left behind. Had the effect omitted its cleanup, there would now be two dead listeners holding the old component in memory.',
          cursors: { phase: { now: 'cleanup' } },
          marks: { log: { '0-2': 'done', 3: 'hit' } },
          vars: { api: '—', 'live subscriptions': '0' },
          cells: { log: ['apiA.subscribe(h)', 'apiA.unsubscribe()', 'apiB.subscribe(h)', 'apiB.unsubscribe()'] },
        },
      ],
      result: 'Setup and teardown always pair up',
    },
  },

  /* ── 6 · How useState actually works ───────────────────────────── */
  6: {
    diagram: 'hook_slots',
    alt: 'Hook state is stored by call position',
    trace: {
      input: 'The toy React in this article: `memory = []`, `index` reset before every render',
      lanes: [
        { id: 'slots', label: 'memory', kind: 'slots', slots: ['0', '1'] },
        { id: 'log', label: 'calls', kind: 'log' },
      ],
      vars: ['index', 'render'],
      steps: [
        {
          note: 'Render 1 begins. `index` is reset to 0 — this reset is the entire mechanism, and it is why the call order can never vary.',
          cursors: { slots: { index: '0' } },
          vars: { index: '0', render: '1' },
          cells: { slots: ['—', '—'], log: ['render() → index = 0'] },
        },
        {
          note: 'The first `useState("")` claims slot 0. `memory[0]` is undefined, so the initial value is written and `index` moves on.',
          cursors: { slots: { index: '0' } },
          marks: { slots: { 0: 'active' } },
          vars: { index: '1', render: '1' },
          cells: { slots: ['""', '—'], log: ['render() → index = 0', 'useState("") → slot 0'] },
        },
        {
          note: 'The second `useState(0)` claims slot 1. Note that neither call passed a name — position is the only identity a hook has.',
          cursors: { slots: { index: '1' } },
          marks: { slots: { 0: 'done', 1: 'active' } },
          vars: { index: '2', render: '1' },
          cells: { slots: ['""', '0'], log: ['render() → index = 0', 'useState("") → slot 0', 'useState(0) → slot 1'] },
        },
        {
          note: '`setState("Ada")` writes into the slot the closure captured, then schedules a re-render.',
          marks: { slots: { 0: 'hit' } },
          vars: { index: '2', render: '1' },
          cells: { slots: ['"Ada"', '0'], log: ['render() → index = 0', 'useState("") → slot 0', 'useState(0) → slot 1', 'setState("Ada") → memory[0]'] },
        },
        {
          note: 'Render 2. `index` resets, the same two calls happen in the same order, and each finds its slot already populated — so the initial value is ignored and the stored one is returned.',
          cursors: { slots: { index: '0' } },
          marks: { slots: { 0: 'hit', 1: 'done' } },
          vars: { index: '0 → 2', render: '2' },
          cells: { slots: ['"Ada"', '0'], log: ['render() → index = 0', 'useState("") → slot 0 → "Ada"', 'useState(0) → slot 1 → 0'] },
        },
      ],
      result: 'State is an array index, not a variable',
    },
  },

  /* ── 7 · The stale closure trap ────────────────────────────────── */
  7: {
    diagram: 'stale_closure',
    alt: 'A closure captures the value from its own render',
    after: '### Fix 1 — functional update (preferred for timers/subscriptions)',
    trace: {
      input: 'setInterval(() => setCount(count + 1), 1000) inside useEffect(…, [])',
      lanes: [
        { id: 'log', label: 'ticks', kind: 'log' },
      ],
      vars: ['count on screen', 'count inside the interval', 'setCount called with'],
      steps: [
        {
          note: 'Render 1 runs. `count` is 0. The effect sets up an interval whose callback closes over *this render\'s* `count` — the number 0, captured forever.',
          vars: { 'count on screen': '0', 'count inside the interval': '0  (render 1)', 'setCount called with': '—' },
          cells: { log: ['effect ran once — deps are []'] },
        },
        {
          note: 'First tick. The callback computes `0 + 1` and sets 1. So far this looks correct, which is what makes the bug hard to spot.',
          marks: { log: { 1: 'active' } },
          vars: { 'count on screen': '1', 'count inside the interval': '0  (render 1)', 'setCount called with': '1' },
          cells: { log: ['effect ran once — deps are []', 'tick → setCount(0 + 1) → 1'] },
        },
        {
          note: 'Render 2 happens and creates a new `count` — but the deps array is empty, so the effect does not re-run and the interval is still the one from render 1.',
          marks: { log: { 1: 'done' } },
          vars: { 'count on screen': '1', 'count inside the interval': '0  (still render 1)', 'setCount called with': '1' },
          cells: { log: ['effect ran once — deps are []', 'tick → setCount(0 + 1) → 1', 'render 2 — effect skipped'] },
        },
        {
          note: 'Second tick. The same captured 0. `0 + 1` is 1 again, and React bails out because the value has not changed. The counter is stuck.',
          marks: { log: { 3: 'bad' } },
          vars: { 'count on screen': '1', 'count inside the interval': '0  (still render 1)', 'setCount called with': '1' },
          cells: { log: ['effect ran once — deps are []', 'tick → setCount(0 + 1) → 1', 'render 2 — effect skipped', 'tick → setCount(0 + 1) → 1  ✗'] },
        },
        {
          note: 'Fix 1: `setCount(prev => prev + 1)`. The updater never reads the closure — it asks React for the current value — so the stale capture stops mattering.',
          marks: { log: { 4: 'hit' } },
          vars: { 'count on screen': '2', 'count inside the interval': 'not read at all', 'setCount called with': 'prev => prev + 1' },
          cells: { log: ['effect ran once — deps are []', 'tick → setCount(0 + 1) → 1', 'render 2 — effect skipped', 'tick → setCount(0 + 1) → 1  ✗', 'tick → setCount(c => c + 1) → 2  ✓'] },
        },
      ],
      result: 'The updater form reads state instead of remembering it',
    },
  },

  /* ── 8 · useEffect vs useLayoutEffect ──────────────────────────── */
  8: {
    diagram: 'render_commit_effects',
    alt: 'Where the two effects sit relative to paint',
    trace: {
      input: 'A tooltip that measures its anchor and positions itself',
      lanes: [
        { id: 'phase', label: 'phase', kind: 'phases', of: ['render', 'commit', 'layout effect', 'paint', 'effect'] },
        { id: 'seen', label: 'user sees', kind: 'log' },
      ],
      vars: ['tooltip position', 'frames painted'],
      steps: [
        {
          note: 'The tooltip renders with no position yet, so it lands at the default 0,0 — the top-left corner.',
          cursors: { phase: { now: 'render' } },
          vars: { 'tooltip position': '0, 0  (default)', 'frames painted': '0' },
          cells: { seen: [] },
        },
        {
          note: 'Commit puts it in the DOM at 0,0. Still nothing painted.',
          cursors: { phase: { now: 'commit' } },
          vars: { 'tooltip position': '0, 0', 'frames painted': '0' },
          cells: { seen: [] },
        },
        {
          note: 'With `useLayoutEffect`, the measurement and the `setPos` happen here — before the browser has drawn anything. React re-renders synchronously and the 0,0 position is never committed to a frame.',
          cursors: { phase: { now: 'layout effect' } },
          marks: { phase: { 'layout effect': 'hit' } },
          vars: { 'tooltip position': '240, 96', 'frames painted': '0' },
          cells: { seen: [] },
        },
        {
          note: 'Paint. The first and only frame shows the tooltip in the right place.',
          cursors: { phase: { now: 'paint' } },
          marks: { phase: { 'layout effect': 'hit' }, seen: { 0: 'hit' } },
          vars: { 'tooltip position': '240, 96', 'frames painted': '1' },
          cells: { seen: ['tooltip at 240, 96  ✓'] },
        },
        {
          note: 'With `useEffect` instead, the order is paint → measure → re-render → paint. The user gets one frame of a tooltip in the corner, then a jump. Same code, one word different.',
          cursors: { phase: { now: 'effect' } },
          marks: { phase: { effect: 'bad' }, seen: { 1: 'bad', 2: 'bad' } },
          vars: { 'tooltip position': '0,0 → 240, 96', 'frames painted': '2' },
          cells: { seen: ['tooltip at 240, 96  ✓', '— with useEffect instead —', 'frame 1: tooltip at 0,0 · frame 2: it jumps'] },
        },
      ],
      result: 'Block paint only when a measurement decides the layout',
    },
  },

  /* ── 9 · useMemo & useCallback ─────────────────────────────────── */
  9: {
    diagram: 'memo_reference_trap',
    alt: 'What memoisation actually buys',
    trace: {
      input: 'A parent whose state changes, wrapping a memoised child',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent' },
            { id: 'child', label: 'memo(Child)', parent: 'parent' },
            { id: 'grand', label: 'GrandChild', parent: 'child' },
          ],
        },
      ],
      vars: ['props.onPick', 'shallow compare'],
      steps: [
        {
          note: 'Parent re-renders. Without `useCallback`, the arrow function passed as `onPick` is rebuilt — a brand-new object with the same source code.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active' } },
          vars: { 'props.onPick': 'fn#1 → fn#2', 'shallow compare': 'not run yet' },
        },
        {
          note: '`memo` compares old props to new with `Object.is`. `fn#1` is not `fn#2`, so the comparison fails — and you have now paid for the comparison as well as the render.',
          cursors: { tree: { at: 'child' } },
          marks: { tree: { parent: 'done', child: 'bad', grand: 'bad' } },
          vars: { 'props.onPick': 'fn#2 ≠ fn#1', 'shallow compare': 'false → re-render' },
        },
        {
          note: 'Wrap it: `useCallback((id) => …, [])`. The same function object is returned on every render, for as long as the deps hold.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active' } },
          vars: { 'props.onPick': 'fn#1 (cached)', 'shallow compare': 'not run yet' },
        },
        {
          note: 'Now the compare succeeds and React skips `Child` **and everything below it**. That skipped subtree is the only thing memoisation ever buys — and it is worth nothing if the subtree was cheap.',
          cursors: { tree: { at: 'child' } },
          marks: { tree: { parent: 'done', child: 'skip', grand: 'skip' } },
          vars: { 'props.onPick': 'fn#1 === fn#1', 'shallow compare': 'true → bail out' },
        },
      ],
      result: 'The win is the subtree you did not render',
    },
  },

  /* ── 10 · useRef ───────────────────────────────────────────────── */
  10: {
    diagram: 'refs_escape_hatch',
    alt: 'A ref is a box React does not watch',
    trace: {
      input: 'Two counters side by side: one in state, one in a ref',
      lanes: [
        { id: 'slots', label: 'values', kind: 'slots', slots: ['state', 'ref.current'] },
        { id: 'log', label: 'renders', kind: 'log' },
      ],
      vars: ['on screen'],
      steps: [
        {
          note: 'Both start at 0, and the screen shows the state value.',
          cells: { slots: ['0', '0'], log: ['render 1'] },
          vars: { 'on screen': '0' },
        },
        {
          note: '`ref.current += 1`. The box now holds 1 — and nothing else happens. No render is scheduled, so the screen is unchanged and React never even learns about it.',
          marks: { slots: { 'ref.current': 'active' } },
          cells: { slots: ['0', '1'], log: ['render 1'] },
          vars: { 'on screen': '0' },
        },
        {
          note: 'Twice more. The ref is at 3, the screen still says 0. This is the whole difference: a ref is memory, state is memory *plus* a subscription.',
          marks: { slots: { 'ref.current': 'active' } },
          cells: { slots: ['0', '3'], log: ['render 1'] },
          vars: { 'on screen': '0' },
        },
        {
          note: '`setState(1)` — now a render is scheduled. And because the *same* ref box survives into the new render, the ref\'s 3 is still there.',
          marks: { slots: { state: 'hit', 'ref.current': 'hit' } },
          cells: { slots: ['1', '3'], log: ['render 1', 'render 2 — triggered by setState'] },
          vars: { 'on screen': '1  (and the ref reveals 3)' },
        },
        {
          note: 'That surviving-but-silent property is exactly what a timer id, a DOM node or a "latest value" needs — and exactly why a value the user reads must never live here.',
          marks: { slots: { state: 'hit', 'ref.current': 'skip' } },
          cells: { slots: ['1', '3'], log: ['render 1', 'render 2 — triggered by setState'] },
          vars: { 'on screen': '1' },
        },
      ],
      result: 'Survives renders, never causes one',
    },
  },

  /* ── 11 · useReducer vs useState ───────────────────────────────── */
  11: {
    diagram: 'reducer_vs_state',
    alt: 'Four setters versus one reducer',
    trace: {
      input: 'A fetch with data / loading / error, done both ways',
      lanes: [
        { id: 'slots', label: 'state', kind: 'slots', slots: ['loading', 'data', 'error'] },
        { id: 'log', label: 'dispatched', kind: 'log' },
      ],
      vars: ['legal?', 'how it was set'],
      steps: [
        {
          note: 'Idle. Three independent `useState` values, and every call site is responsible for keeping them consistent.',
          cells: { slots: ['false', 'null', 'null'], log: [] },
          vars: { 'legal?': 'yes', 'how it was set': '—' },
        },
        {
          note: 'The fetch starts: `setLoading(true)`. Fine so far.',
          marks: { slots: { loading: 'active' } },
          cells: { slots: ['true', 'null', 'null'], log: ['setLoading(true)'] },
          vars: { 'legal?': 'yes', 'how it was set': '1 of 3 setters' },
        },
        {
          note: 'It fails. Someone writes `setError(e)` and forgets `setLoading(false)` — a one-line omission that is invisible in review.',
          marks: { slots: { loading: 'bad', error: 'bad' } },
          cells: { slots: ['true', 'null', 'Error'], log: ['setLoading(true)', 'setError(e)   ← and nothing else'] },
          vars: { 'legal?': '**no** — spinner over an error', 'how it was set': '1 of 2 needed setters' },
        },
        {
          note: 'With a reducer the same event is one dispatch, and the transition that handles it sets every field. There is no way to write half of it.',
          marks: { slots: { loading: 'hit', error: 'hit' } },
          cells: { slots: ['false', 'null', 'Error'], log: ['dispatch({ type: "fetch" })', 'dispatch({ type: "failure", e })'] },
          vars: { 'legal?': 'yes — by construction', 'how it was set': 'one transition, one place' },
        },
        {
          note: 'And the reducer is a plain function of `(state, action)`, so the illegal combination above can be ruled out in a unit test with no React in it at all.',
          marks: { slots: { loading: 'skip', data: 'skip', error: 'skip' } },
          cells: { slots: ['false', 'null', 'Error'], log: ['dispatch({ type: "fetch" })', 'dispatch({ type: "failure", e })', 'reducer tested without React'] },
          vars: { 'legal?': 'yes', 'how it was set': 'pure function' },
        },
      ],
      result: 'Illegal states become unreachable, not just unlikely',
    },
  },

  /* ── 12 · Rules of hooks ───────────────────────────────────────── */
  12: {
    diagram: 'hook_slots',
    alt: 'A conditional hook shifts every slot after it',
    trace: {
      input: 'function Bad({ show }) { if (show) useState(""); useState(0); }',
      lanes: [
        { id: 'slots', label: 'slots', kind: 'slots', slots: ['0', '1'] },
      ],
      vars: ['show', 'name reads', 'count reads'],
      steps: [
        {
          note: 'Render 1 with `show` true. Both hooks run: `name` takes slot 0, `count` takes slot 1. Everything works, which is why this ships.',
          marks: { slots: { 0: 'active', 1: 'active' } },
          cells: { slots: ['"" (name)', '0 (count)'] },
          vars: { show: 'true', 'name reads': 'slot 0  ✓', 'count reads': 'slot 1  ✓' },
        },
        {
          note: 'The user toggles something and `show` becomes false. Render 2: the first `useState` is skipped entirely.',
          cursors: { slots: { next: '0' } },
          vars: { show: 'false', 'name reads': 'not called', 'count reads': '—' },
          cells: { slots: ['"" (name)', '0 (count)'] },
        },
        {
          note: '`count` is now the *first* hook to run, so it claims slot 0 — and reads back `name`\'s string instead of its own number. The slots did not move; the calls did.',
          marks: { slots: { 0: 'bad' } },
          cursors: { slots: { next: '0' } },
          vars: { show: 'false', 'name reads': 'not called', 'count reads': '**slot 0** — the wrong value' },
          cells: { slots: ['"" (name)', '0 (count)'] },
        },
        {
          note: 'React counts the hooks and sees one fewer than last time, so in practice you get "Rendered fewer hooks than expected" rather than silently corrupted state — but the cause is this shift.',
          marks: { slots: { 0: 'bad', 1: 'bad' } },
          vars: { show: 'false', 'name reads': 'not called', 'count reads': 'throws' },
          cells: { slots: ['"" (name)', 'orphaned'] },
        },
        {
          note: 'The fix is never "add a dependency" — it is to call both hooks unconditionally and move the branch inside, where the slot count cannot see it.',
          marks: { slots: { 0: 'hit', 1: 'hit' } },
          vars: { show: 'false', 'name reads': 'slot 0  ✓', 'count reads': 'slot 1  ✓' },
          cells: { slots: ['"" (name)', '0 (count)'] },
        },
      ],
      result: 'Same hooks, same order, every render',
    },
  },

  /* ── 41 · useMemo ──────────────────────────────────────────────── */
  41: {
    diagram: 'memo_reference_trap',
    alt: 'useMemo caches a value between renders',
    after: '## Gotchas',
    trace: {
      input: 'products.filter(p => p.name.includes(query)) over 5,000 products',
      lanes: [
        { id: 'deps', label: 'deps', kind: 'slots', slots: ['products', 'query'] },
        { id: 'log', label: 'what ran', kind: 'log' },
      ],
      vars: ['filter ran?', 'returned reference'],
      steps: [
        {
          note: 'First render. Nothing is cached, so the filter runs and the result plus the deps are stored.',
          marks: { deps: { products: 'active', query: 'active' } },
          cells: { deps: ['list#1', '""'], log: ['filter(5000) → 5000 items'] },
          vars: { 'filter ran?': 'yes — nothing cached', 'returned reference': 'arr#1' },
        },
        {
          note: 'The parent re-renders for an unrelated reason. `useMemo` compares each dep with `Object.is`: both identical, so the cached array comes straight back.',
          marks: { deps: { products: 'skip', query: 'skip' } },
          cells: { deps: ['list#1', '""'], log: ['filter(5000) → 5000 items', 'deps equal → cached arr#1'] },
          vars: { 'filter ran?': 'no', 'returned reference': 'arr#1  (same object)' },
        },
        {
          note: 'The user types "ph". `query` changed, so the cache is discarded and the filter runs again — that is the point, not a failure.',
          marks: { deps: { query: 'active' } },
          cells: { deps: ['list#1', '"ph"', ''].slice(0, 2), log: ['filter(5000) → 5000 items', 'deps equal → cached arr#1', 'query changed → filter(5000) → 12 items'] },
          vars: { 'filter ran?': 'yes — query changed', 'returned reference': 'arr#2' },
        },
        {
          note: 'The gotcha: if the parent builds `products` inline — `products={items.filter(...)}` — that dep is a new array every render, the compare never succeeds, and the memo does nothing but add overhead.',
          marks: { deps: { products: 'bad' } },
          cells: { deps: ['list#2 (new!)', '"ph"'], log: ['filter(5000) → 5000 items', 'deps equal → cached arr#1', 'query changed → filter(5000) → 12 items', 'products is a new array → filter again  ✗'] },
          vars: { 'filter ran?': 'yes — every single render', 'returned reference': 'arr#3, arr#4, …' },
        },
        {
          note: 'The second reason to reach for `useMemo` is the *reference*, not the work: a stable `arr#1` is what lets a memoised child downstream bail out at all.',
          marks: { deps: { products: 'hit', query: 'hit' } },
          cells: { deps: ['list#1', '"ph"'], log: ['stable reference → memo(List) bails out'] },
          vars: { 'filter ran?': 'no', 'returned reference': 'arr#2  (stable)' },
        },
      ],
      result: 'Caches the value, and the identity',
    },
  },

  /* ── 42 · useCallback ──────────────────────────────────────────── */
  42: {
    diagram: 'memo_reference_trap',
    alt: 'useCallback keeps a function identity stable',
    after: '## Gotchas',
    trace: {
      input: 'Parent has a `count` button and a memoised <Child onSelect={…} />',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent' },
            { id: 'button', label: 'button · count', parent: 'parent' },
            { id: 'child', label: 'memo(Child)', parent: 'parent' },
          ],
        },
      ],
      vars: ['count', 'handleSelect', 'Child rendered?'],
      steps: [
        {
          note: 'First render. `handleSelect` is created and, thanks to `useCallback(fn, [])`, stored for reuse.',
          marks: { tree: { parent: 'active', button: 'active', child: 'active' } },
          vars: { count: '0', handleSelect: 'fn#1  (cached)', 'Child rendered?': 'yes — first mount' },
        },
        {
          note: 'The button is clicked. `count` becomes 1 and Parent re-renders — which re-runs its whole body.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active', button: 'active' } },
          vars: { count: '1', handleSelect: 'fn#1  (deps [] unchanged)', 'Child rendered?': 'deciding…' },
        },
        {
          note: '`memo` compares: `onSelect` is still `fn#1`. The compare succeeds and Child is skipped entirely, even though its parent just rendered.',
          cursors: { tree: { at: 'child' } },
          marks: { tree: { parent: 'done', button: 'done', child: 'skip' } },
          vars: { count: '1', handleSelect: 'fn#1 === fn#1', 'Child rendered?': '**no** — bailed out' },
        },
        {
          note: 'Now drop the `useCallback`. The arrow is rebuilt on every Parent render, so `fn#2 ≠ fn#1`, the compare fails, and `memo(Child)` re-renders for nothing.',
          marks: { tree: { parent: 'done', child: 'bad' } },
          vars: { count: '2', handleSelect: 'fn#2  (new every render)', 'Child rendered?': 'yes — wasted' },
        },
        {
          note: 'And the mirror-image mistake: `useCallback` on a handler passed to a plain `<button>`. There is no memo downstream to satisfy, so it is pure overhead — a cache nobody reads.',
          marks: { tree: { button: 'bad' } },
          vars: { count: '2', handleSelect: 'cached for no reader', 'Child rendered?': 'n/a' },
        },
      ],
      result: 'Only useful when something downstream compares it',
    },
  },

  /* ── 43 · useTransition ────────────────────────────────────────── */
  43: {
    diagram: 'concurrent_lanes',
    alt: 'Urgent and transition updates from one event',
    after: '## Gotchas',
    trace: {
      input: 'Typing "r" into a search box over 10,000 items',
      lanes: [
        { id: 'lanes', label: 'lane', kind: 'slots', slots: ['urgent', 'transition'] },
        { id: 'log', label: 'timeline', kind: 'log' },
      ],
      vars: ['input shows', 'isPending'],
      steps: [
        {
          note: 'The keypress fires `handleChange`. It makes two updates: `setQuery` outside the transition, `setResults` inside it.',
          marks: { lanes: { urgent: 'active', transition: 'active' } },
          cells: { lanes: ['setQuery("r")', 'setResults(filter(…))'], log: ['keypress "r"'] },
          vars: { 'input shows': '""', isPending: 'true' },
        },
        {
          note: 'React does the urgent lane first and commits it on its own. The character is on screen in a few milliseconds — the filter has not started.',
          marks: { lanes: { urgent: 'hit' } },
          cells: { lanes: ['committed', 'queued'], log: ['keypress "r"', 'urgent render + paint — 4 ms'] },
          vars: { 'input shows': '"r"', isPending: 'true' },
        },
        {
          note: 'Now the transition renders, in slices, yielding between them. The **old** results stay on screen the whole time — nothing half-built is ever shown.',
          marks: { lanes: { transition: 'active' } },
          cells: { lanes: ['idle', 'rendering… 10,000 rows'], log: ['keypress "r"', 'urgent render + paint — 4 ms', 'transition rendering (interruptible)'] },
          vars: { 'input shows': '"r"', isPending: 'true — show a subtle spinner' },
        },
        {
          note: 'A second keypress arrives mid-way. React abandons the half-finished tree and starts over with the new query. The work is wasted; the typing never stuttered.',
          marks: { lanes: { urgent: 'active', transition: 'bad' } },
          cells: { lanes: ['setQuery("re")', 'restarted'], log: ['keypress "r"', 'urgent render + paint — 4 ms', 'transition rendering (interruptible)', 'keypress "e" → old transition thrown away'] },
          vars: { 'input shows': '"re"', isPending: 'true' },
        },
        {
          note: 'Typing stops, the transition finishes, and the new list commits in one go.',
          marks: { lanes: { transition: 'hit' } },
          cells: { lanes: ['idle', 'committed'], log: ['keypress "r"', 'urgent render + paint — 4 ms', 'transition rendering (interruptible)', 'keypress "e" → old transition thrown away', 'transition committed — 240 ms of work, 0 ms of jank'] },
          vars: { 'input shows': '"re"', isPending: 'false' },
        },
      ],
      result: 'Same total work, never in the way of a keystroke',
    },
  },

  /* ── 44 · useDeferredValue ─────────────────────────────────────── */
  44: {
    diagram: 'concurrent_lanes',
    alt: 'A deferred value lags the real one by one render',
    after: '## Gotchas',
    trace: {
      input: 'const deferredQuery = useDeferredValue(query)',
      lanes: [
        { id: 'vals', label: 'values', kind: 'slots', slots: ['query', 'deferredQuery'] },
      ],
      vars: ['isStale', 'list showing'],
      steps: [
        {
          note: 'Steady state. Both values agree, nothing is pending, and the list matches the box.',
          marks: { vals: { query: 'skip', deferredQuery: 'skip' } },
          cells: { vals: ['"re"', '"re"'] },
          vars: { isStale: 'false', 'list showing': 'results for "re"' },
        },
        {
          note: 'The user types. `query` updates urgently — the input is responsive immediately — but `useDeferredValue` deliberately hands back the *previous* value.',
          marks: { vals: { query: 'active', deferredQuery: 'done' } },
          cells: { vals: ['"reac"', '"re"'] },
          vars: { isStale: 'true — `query !== deferredQuery`', 'list showing': 'results for "re"  (stale, but there)' },
        },
        {
          note: 'That gap is the feature: the expensive `useMemo` keyed on `deferredQuery` does not re-run yet, so the keystroke costs nothing. Dim the list to admit it is behind.',
          marks: { vals: { deferredQuery: 'window' } },
          cells: { vals: ['"reac"', '"re"'] },
          vars: { isStale: 'true', 'list showing': 'results for "re", dimmed' },
        },
        {
          note: 'In the background React re-renders with the new value. When that finishes, `deferredQuery` catches up and the memo recomputes once — not once per character.',
          marks: { vals: { query: 'hit', deferredQuery: 'hit' } },
          cells: { vals: ['"reac"', '"reac"'] },
          vars: { isStale: 'false', 'list showing': 'results for "reac"' },
        },
        {
          note: 'The difference from `useTransition`: there is no setter to wrap here. Use this when the value arrives as a prop and you do not own the update that produced it.',
          marks: { vals: { deferredQuery: 'hit' } },
          cells: { vals: ['"reac"', '"reac"'] },
          vars: { isStale: 'false', 'list showing': 'results for "reac"' },
        },
      ],
      result: 'Defer the reader, not the writer',
    },
  },

  /* ── 45 · useId ────────────────────────────────────────────────── */
  45: {
    diagram: 'useid_ssr',
    alt: 'useId produces the same id on server and client',
    after: '## Gotchas',
    trace: {
      input: '<Field label="Email"/> rendered on the server, then hydrated',
      lanes: [
        { id: 'ids', label: 'id', kind: 'slots', slots: ['server', 'client'] },
        { id: 'log', label: 'result', kind: 'log' },
      ],
      vars: ['htmlFor → id', 'hydration'],
      steps: [
        {
          note: 'The server renders the field. A module counter would give `field-0` here — perfectly reasonable in isolation.',
          marks: { ids: { server: 'active' } },
          cells: { ids: ['field-0', '—'], log: ['server HTML: <label for="field-0">'] },
          vars: { 'htmlFor → id': 'matches', hydration: 'not started' },
        },
        {
          note: 'The browser loads and hydrates. Its counter starts from zero again, and other components mounted first — so the same field gets `field-3`.',
          marks: { ids: { server: 'done', client: 'bad' } },
          cells: { ids: ['field-0', 'field-3'], log: ['server HTML: <label for="field-0">', 'client render: <label for="field-3">'] },
          vars: { 'htmlFor → id': '**broken**', hydration: 'mismatch warning' },
        },
        {
          note: 'The label no longer points at the input. Clicking it does nothing and a screen reader announces the field unlabelled — a real accessibility bug from a counter.',
          marks: { ids: { client: 'bad' } },
          cells: { ids: ['field-0', 'field-3'], log: ['server HTML: <label for="field-0">', 'client render: <label for="field-3">', 'label → nothing'] },
          vars: { 'htmlFor → id': '**broken**', hydration: 'React re-renders the subtree' },
        },
        {
          note: 'With `useId`, the id is derived from the component\'s position in the tree. The tree is identical on both sides, so the id is identical on both sides.',
          marks: { ids: { server: 'hit', client: 'hit' } },
          cells: { ids: [':r0:', ':r0:'], log: ['server HTML: <label for=":r0:">', 'client render: <label for=":r0:">', 'label → input  ✓'] },
          vars: { 'htmlFor → id': 'matches', hydration: 'clean' },
        },
        {
          note: 'One call is enough for a whole form — `${id}-email`, `${id}-password`. It is per-component, which is also why it can never be a list key.',
          marks: { ids: { server: 'hit', client: 'hit' } },
          cells: { ids: [':r0:-email', ':r0:-password'], log: ['one useId, many derived ids'] },
          vars: { 'htmlFor → id': 'matches', hydration: 'clean' },
        },
      ],
      result: 'Position-derived, so both runtimes agree',
    },
  },

  /* ── 46 · use() ────────────────────────────────────────────────── */
  46: {
    diagram: 'suspense_lazy',
    alt: 'use() suspends to the nearest boundary',
    after: '## Gotchas',
    trace: {
      input: 'const comments = use(commentsPromise) inside a <Suspense> boundary',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'page', label: 'Page' },
            { id: 'susp', label: '<Suspense fallback={<Spinner/>}>', parent: 'page' },
            { id: 'comments', label: 'Comments · use(promise)', parent: 'susp' },
          ],
        },
        { id: 'log', label: 'what happens', kind: 'log' },
      ],
      vars: ['promise', 'on screen'],
      steps: [
        {
          note: 'Comments renders and calls `use(commentsPromise)`. The promise is still pending.',
          cursors: { tree: { at: 'comments' } },
          marks: { tree: { comments: 'active' } },
          cells: { log: ['use(promise) → pending'] },
          vars: { promise: 'pending', 'on screen': 'nothing yet' },
        },
        {
          note: '`use` suspends: it throws the promise, and the throw travels up to the nearest boundary — exactly the way an error finds an error boundary.',
          cursors: { tree: { at: 'susp' } },
          marks: { tree: { comments: 'window', susp: 'active' } },
          cells: { log: ['use(promise) → pending', 'suspends ↑ to the nearest <Suspense>'] },
          vars: { promise: 'pending', 'on screen': 'nothing yet' },
        },
        {
          note: 'The boundary renders its fallback in place of **everything below it** — not just Comments. That is why boundary placement is a design decision, not a formality.',
          marks: { tree: { susp: 'hit', comments: 'done' } },
          cells: { log: ['use(promise) → pending', 'suspends ↑ to the nearest <Suspense>', '<Spinner/> shown for the whole boundary'] },
          vars: { promise: 'pending', 'on screen': 'Spinner' },
        },
        {
          note: 'The promise resolves. React retries the subtree, `use` returns the value this time, and the real content replaces the fallback.',
          marks: { tree: { susp: 'done', comments: 'hit' } },
          cells: { log: ['use(promise) → pending', 'suspends ↑ to the nearest <Suspense>', '<Spinner/> shown for the whole boundary', 'resolved → retry → comments render'] },
          vars: { promise: 'resolved', 'on screen': 'the comments' },
        },
        {
          note: 'The trap: `use(fetch(url))` creates a *new* promise on every render, so every retry suspends again — an infinite loop. The promise must be created outside, or cached.',
          marks: { tree: { comments: 'bad' } },
          cells: { log: ['use(fetch(url)) → new promise', 'suspend → retry → new promise → suspend → …'] },
          vars: { promise: 'a different one every render', 'on screen': 'Spinner, forever' },
        },
      ],
      result: 'The only hook you may call conditionally',
    },
  },

  /* ── 13 · Custom hooks vs helpers ──────────────────────────────── */
  13: {
    diagram: 'custom_hook_boundary',
    alt: 'A custom hook shares logic, not state',
    trace: {
      input: 'Two components both call useTasks(5)',
      lanes: [
        { id: 'a', label: 'ComponentA', kind: 'slots', slots: ['tasks', 'addTask'] },
        { id: 'b', label: 'ComponentB', kind: 'slots', slots: ['tasks', 'addTask'] },
      ],
      vars: ['shared?'],
      steps: [
        {
          note: 'Both mount. `useTasks` runs inside each of them, and each call to `useState` inside it claims a slot on **that component\'s own fiber**.',
          marks: { a: { tasks: 'active' }, b: { tasks: 'active' } },
          cells: { a: ['5 tasks', 'fn'], b: ['5 tasks', 'fn'] },
          vars: { 'shared?': 'the code, yes' },
        },
        {
          note: 'A calls `addTask("write tests")`. A re-renders with six tasks.',
          marks: { a: { tasks: 'hit' } },
          cells: { a: ['6 tasks', 'fn'], b: ['5 tasks', 'fn'] },
          vars: { 'shared?': 'the state, **no**' },
        },
        {
          note: 'B is untouched. It still has five. The hook was inlined into two separate slot lists, so there are two separate stores — which is usually what you want, and occasionally a nasty surprise.',
          marks: { a: { tasks: 'hit' }, b: { tasks: 'bad' } },
          cells: { a: ['6 tasks', 'fn'], b: ['5 tasks', 'fn'] },
          vars: { 'shared?': 'the state, **no**' },
        },
        {
          note: 'To actually share the value, the state has to live in one place above both — context or a store. A hook alone can never do it.',
          marks: { a: { tasks: 'skip' }, b: { tasks: 'skip' } },
          cells: { a: ['6 tasks', 'fn'], b: ['6 tasks', 'fn'] },
          vars: { 'shared?': 'yes — via one provider above both' },
        },
        {
          note: 'And `generateRandomTasks` stays a plain function: it calls no hook, so making it `useGenerateRandomTasks` would only subject it to the rules of hooks for nothing.',
          marks: { a: { addTask: 'skip' }, b: { addTask: 'skip' } },
          cells: { a: ['6 tasks', 'fn'], b: ['6 tasks', 'fn'] },
          vars: { 'shared?': 'a pure helper shares itself' },
        },
      ],
      result: 'One hook, two stores',
    },
  },

  /* ── 14 · What triggers a re-render ────────────────────────────── */
  14: {
    diagram: 'rerender_triggers',
    alt: 'The three causes of a re-render',
    trace: {
      input: '<Page> holds state; <Sidebar> takes no props at all',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'page', label: 'Page · owns state' },
            { id: 'side', label: 'Sidebar · no props', parent: 'page' },
            { id: 'logo', label: 'Logo', parent: 'side' },
            { id: 'main', label: 'Main', parent: 'page' },
          ],
        },
      ],
      vars: ['cause', 'renders this pass'],
      steps: [
        {
          note: '`setOpen(true)` runs in Page. Cause 1: a component\'s own state changed.',
          cursors: { tree: { at: 'page' } },
          marks: { tree: { page: 'active' } },
          vars: { cause: '1 · own state', 'renders this pass': 'Page' },
        },
        {
          note: 'React renders Page and walks down. Sidebar re-renders — cause 2, its parent re-rendered — even though it receives nothing and nothing about it changed.',
          cursors: { tree: { at: 'side' } },
          marks: { tree: { page: 'done', side: 'bad' } },
          vars: { cause: '2 · parent re-rendered', 'renders this pass': 'Page, Sidebar' },
        },
        {
          note: 'And so does Logo, and everything under it. The default is the whole subtree, not the components whose props changed.',
          marks: { tree: { page: 'done', side: 'bad', logo: 'bad', main: 'bad' } },
          vars: { cause: '2 · parent re-rendered', 'renders this pass': 'the entire subtree' },
        },
        {
          note: 'Cause 3 is the one that ignores the tree: a context Sidebar reads changes. React reaches it directly, past any `memo` in between.',
          marks: { tree: { page: 'done', side: 'window' } },
          vars: { cause: '3 · context changed', 'renders this pass': 'every consumer' },
        },
        {
          note: 'What is *not* on the list: mutating a ref, mutating state in place, setting state to the same value, or changing a module variable. None of those schedule anything.',
          marks: { tree: { page: 'skip', side: 'skip', logo: 'skip', main: 'skip' } },
          vars: { cause: 'none of the three', 'renders this pass': 'nothing' },
        },
      ],
      result: 'Own state · parent rendered · context changed',
    },
  },

  /* ── 15 · React.memo and the reference trap ────────────────────── */
  15: {
    diagram: 'memo_reference_trap',
    alt: 'A new object prop defeats memo',
    trace: {
      input: 'const data = { name: "Alice" } declared in Parent\'s body',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent' },
            { id: 'child', label: 'memo(Child)', parent: 'parent' },
          ],
        },
      ],
      vars: ['data reference', 'Object.is', 'Child'],
      steps: [
        {
          note: 'Mount. `data` is created — call it obj#1 — and passed down. Child renders for the first time.',
          marks: { tree: { parent: 'active', child: 'active' } },
          vars: { 'data reference': 'obj#1', 'Object.is': 'n/a — first render', Child: 'renders' },
        },
        {
          note: 'The count button is clicked. Parent re-renders, and the line `const data = { name: "Alice" }` runs again — producing a different object with identical contents.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active' } },
          vars: { 'data reference': 'obj#2', 'Object.is': 'about to run', Child: 'deciding…' },
        },
        {
          note: '`Object.is(obj#1, obj#2)` is false — it compares identity, not contents. The memo fails and Child re-renders, having gained nothing from being wrapped.',
          cursors: { tree: { at: 'child' } },
          marks: { tree: { parent: 'done', child: 'bad' } },
          vars: { 'data reference': 'obj#2 ≠ obj#1', 'Object.is': 'false', Child: '**re-renders** — memo defeated' },
        },
        {
          note: 'Stabilise it: `useMemo(() => ({ name: "Alice" }), [])`, or hoist it out of the component entirely since it depends on nothing.',
          marks: { tree: { parent: 'active' } },
          vars: { 'data reference': 'obj#1 (cached)', 'Object.is': 'about to run', Child: 'deciding…' },
        },
        {
          note: 'Now the compare succeeds and Child is skipped. The lesson generalises: objects, arrays, functions and JSX are all new every render, so any of them as a prop cancels a memo.',
          marks: { tree: { parent: 'done', child: 'skip' } },
          vars: { 'data reference': 'obj#1 === obj#1', 'Object.is': 'true', Child: 'bails out  ✓' },
        },
      ],
      result: 'memo compares identity, not contents',
    },
  },

  /* ── 16 · Virtualising big lists ───────────────────────────────── */
  16: {
    diagram: 'virtualization',
    alt: 'Only the visible window is mounted',
    trace: {
      input: '10,000 rows · itemHeight 40px · a 400px viewport',
      lanes: [
        { id: 'win', label: 'mounted', kind: 'slots', slots: ['start', 'end', 'nodes'] },
        { id: 'log', label: 'on scroll', kind: 'log' },
      ],
      vars: ['scrollTop', 'spacer above'],
      steps: [
        {
          note: 'At the top. `start = floor(0 / 40) = 0`, and the viewport fits ten rows plus one of overscan.',
          marks: { win: { start: 'active', end: 'active' } },
          cells: { win: ['0', '11', '11'], log: ['slice(0, 11)'] },
          vars: { scrollTop: '0', 'spacer above': '0px' },
        },
        {
          note: 'The user scrolls to 4000px. `start = floor(4000 / 40) = 100`. The slice moves; its size does not.',
          marks: { win: { start: 'hit', end: 'hit' } },
          cells: { win: ['100', '111', '11'], log: ['slice(0, 11)', 'scrollTop 4000 → slice(100, 111)'] },
          vars: { scrollTop: '4000', 'spacer above': '4000px' },
        },
        {
          note: 'A spacer div of 4000px sits above and one of 395,560px below, so the scrollbar is the right length and the browser believes the full list is there.',
          marks: { win: { nodes: 'hit' } },
          cells: { win: ['100', '111', '11'], log: ['slice(0, 11)', 'scrollTop 4000 → slice(100, 111)', 'spacers keep scroll height at 400,000px'] },
          vars: { scrollTop: '4000', 'spacer above': '4000px' },
        },
        {
          note: 'Scroll to the end and it is still eleven nodes. Mount cost and memory are flat in the length of the list — that is the whole trick.',
          marks: { win: { nodes: 'hit' } },
          cells: { win: ['9989', '10000', '11'], log: ['slice(0, 11)', 'scrollTop 4000 → slice(100, 111)', 'spacers keep scroll height at 400,000px', 'scrollTop 399,560 → slice(9989, 10000) — still 11 nodes'] },
          vars: { scrollTop: '399,560', 'spacer above': '399,560px' },
        },
        {
          note: 'What you give up: Ctrl-F cannot find an unmounted row, and variable heights need measuring rather than arithmetic. Both are why this is a library, not four lines.',
          marks: { win: { nodes: 'window' } },
          cells: { win: ['9989', '10000', '11'], log: ['Ctrl-F misses 9,989 rows'] },
          vars: { scrollTop: '399,560', 'spacer above': '399,560px' },
        },
      ],
      result: '10,000 rows, 11 DOM nodes',
    },
  },

  /* ── 17 · Code splitting ───────────────────────────────────────── */
  17: {
    diagram: 'suspense_lazy',
    alt: 'lazy plus a Suspense boundary',
    trace: {
      input: 'const HeavyChart = React.lazy(() => import("./HeavyChart"))',
      lanes: [
        { id: 'net', label: 'network', kind: 'log' },
        { id: 'phase', label: 'state', kind: 'phases', of: ['shell', 'fetching chunk', 'chart'] },
      ],
      vars: ['JS downloaded', 'on screen'],
      steps: [
        {
          note: 'The page loads. The main bundle no longer contains the charting library, so the shell is 180 KB instead of 820 KB.',
          cursors: { phase: { now: 'shell' } },
          cells: { net: ['main.js — 180 KB'] },
          vars: { 'JS downloaded': '180 KB', 'on screen': 'the dashboard shell' },
        },
        {
          note: 'React reaches `<HeavyChart/>`. The module is not loaded, so the lazy component suspends — the same mechanism `use()` and data fetching go through.',
          cursors: { phase: { now: 'fetching chunk' } },
          marks: { net: { 1: 'active' } },
          cells: { net: ['main.js — 180 KB', 'chunk-HeavyChart.js — requested'] },
          vars: { 'JS downloaded': '180 KB', 'on screen': 'the shell + <Spinner/>' },
        },
        {
          note: 'The nearest `<Suspense>` catches it and shows the fallback. Without a boundary above it, React throws — "a component suspended while responding to synchronous input".',
          cursors: { phase: { now: 'fetching chunk' } },
          marks: { net: { 1: 'window' } },
          cells: { net: ['main.js — 180 KB', 'chunk-HeavyChart.js — requested'] },
          vars: { 'JS downloaded': '180 KB', 'on screen': 'the shell + <Spinner/>' },
        },
        {
          note: 'The chunk arrives, React retries, and the chart renders in place of the spinner.',
          cursors: { phase: { now: 'chart' } },
          marks: { net: { 1: 'hit' } },
          cells: { net: ['main.js — 180 KB', 'chunk-HeavyChart.js — 640 KB, loaded'] },
          vars: { 'JS downloaded': '820 KB', 'on screen': 'the chart' },
        },
        {
          note: 'A user who never opens this tab downloads 180 KB and stops. Split on routes first — that is where the difference is largest and the boundary is most obvious.',
          cursors: { phase: { now: 'shell' } },
          marks: { net: { 0: 'hit' } },
          cells: { net: ['main.js — 180 KB', '(chunk never requested)'] },
          vars: { 'JS downloaded': '180 KB', 'on screen': 'the dashboard shell' },
        },
      ],
      result: 'Pay for the chart only if you open it',
    },
  },

  /* ── 18 · "The app is slow" playbook ───────────────────────────── */
  18: {
    diagram: 'rerender_triggers',
    alt: 'Working out why a render is expensive',
    trace: {
      input: 'The interview question: "this page feels slow — what do you do?"',
      lanes: [
        { id: 'step', label: 'step', kind: 'phases', of: ['measure', 'classify', 'fix', 're-measure'] },
        { id: 'log', label: 'findings', kind: 'log' },
      ],
      vars: ['hypothesis', 'evidence'],
      steps: [
        {
          note: 'Measure first. Profiler flame chart, "highlight updates", and the Network panel — never a guess, and never a `memo` before this step.',
          cursors: { step: { now: 'measure' } },
          cells: { log: ['Profiler: 180 ms commit on every keystroke'] },
          vars: { hypothesis: 'none yet', evidence: 'a flame chart' },
        },
        {
          note: 'Classify what you found. There are only three shapes: too many renders, one render that is too slow, or work that is not rendering at all.',
          cursors: { step: { now: 'classify' } },
          marks: { log: { 1: 'active' } },
          cells: { log: ['Profiler: 180 ms commit on every keystroke', '2,000 rows re-render — too many components'] },
          vars: { hypothesis: 'too many renders', evidence: '2,000 highlighted rows' },
        },
        {
          note: 'Each shape has its own fix, and they are not interchangeable. Too many renders → move state down, pass children, memo the leaf. One slow render → useMemo the computation, or virtualise.',
          cursors: { step: { now: 'fix' } },
          marks: { log: { 2: 'active' } },
          cells: { log: ['Profiler: 180 ms commit on every keystroke', '2,000 rows re-render — too many components', 'fix: virtualise + move the input state down'] },
          vars: { hypothesis: 'too many renders', evidence: '2,000 highlighted rows' },
        },
        {
          note: 'Not rendering at all? Then it is a waterfall, an unsplit bundle, or an unindexed query — and no amount of memoisation touches it.',
          cursors: { step: { now: 'classify' } },
          marks: { log: { 3: 'window' } },
          cells: { log: ['Profiler: 180 ms commit on every keystroke', '2,000 rows re-render — too many components', 'fix: virtualise + move the input state down', '(if the flame chart were empty: look at the network)'] },
          vars: { hypothesis: 'not a render problem', evidence: 'an idle main thread' },
        },
        {
          note: 'Re-measure. The number that mattered before must be smaller now — otherwise you have added a cache and a maintenance burden and fixed nothing.',
          cursors: { step: { now: 're-measure' } },
          marks: { log: { 4: 'hit' } },
          cells: { log: ['Profiler: 180 ms commit on every keystroke', '2,000 rows re-render — too many components', 'fix: virtualise + move the input state down', '(if the flame chart were empty: look at the network)', 'Profiler: 6 ms commit  ✓'] },
          vars: { hypothesis: 'confirmed', evidence: '180 ms → 6 ms' },
        },
      ],
      result: 'Measure, classify, fix, measure again',
    },
  },

  /* ── 19 · Higher-order components ──────────────────────────────── */
  19: {
    diagram: 'composition_over_memo',
    alt: 'A HOC wraps a component in another component',
    trace: {
      input: 'const UserListWithLoading = withLoading(UserList)',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'page', label: 'Page' },
            { id: 'wrapped', label: 'Wrapped · (from withLoading)', parent: 'page' },
            { id: 'list', label: 'UserList', parent: 'wrapped' },
          ],
        },
      ],
      vars: ['isLoading', 'what renders'],
      steps: [
        {
          note: '`withLoading(UserList)` runs once, at module scope, and returns a new component. It is a function that takes a component and returns a component — nothing more.',
          marks: { tree: { wrapped: 'active' } },
          vars: { isLoading: '—', 'what renders': 'nothing yet' },
        },
        {
          note: 'Render with `isLoading` true. `Wrapped` swallows that prop, returns a Spinner, and never calls `UserList` at all.',
          cursors: { tree: { at: 'wrapped' } },
          marks: { tree: { wrapped: 'active', list: 'skip' } },
          vars: { isLoading: 'true', 'what renders': '<Spinner/>' },
        },
        {
          note: '`isLoading` becomes false. Now `Wrapped` forwards the rest of the props through and renders the real component.',
          marks: { tree: { wrapped: 'done', list: 'hit' } },
          vars: { isLoading: 'false', 'what renders': '<UserList {...props}/>' },
        },
        {
          note: 'The gotcha: build the HOC **inside** a render — `const W = withLoading(UserList)` in the component body — and `W` is a new component type every render, so React unmounts and remounts the whole subtree each time.',
          marks: { tree: { wrapped: 'bad', list: 'bad' } },
          vars: { isLoading: 'false', 'what renders': 'a fresh mount, every render' },
        },
        {
          note: 'Modern code usually reaches for a hook instead — same logic sharing, no extra tree node, no prop collisions, and a stack trace you can read.',
          marks: { tree: { list: 'hit' } },
          vars: { isLoading: 'false', 'what renders': 'UserList, using useLoading()' },
        },
      ],
      result: 'A component factory, resolved at module scope',
    },
  },

  /* ── 20 · Render props ─────────────────────────────────────────── */
  20: {
    diagram: 'composition_over_memo',
    alt: 'A render prop hands data back to the caller',
    trace: {
      input: '<DataFetcher url="/api/user">{({data, loading}) => …}</DataFetcher>',
      lanes: [
        { id: 'who', label: 'owns', kind: 'slots', slots: ['the data', 'the markup'] },
        { id: 'log', label: 'sequence', kind: 'log' },
      ],
      vars: ['loading', 'what the caller sees'],
      steps: [
        {
          note: '`DataFetcher` owns the fetching — the effect, the loading flag, the error handling. It renders nothing of its own.',
          marks: { who: { 'the data': 'active' } },
          cells: { who: ['DataFetcher', 'the caller'], log: ['DataFetcher mounts, starts the fetch'] },
          vars: { loading: 'true', 'what the caller sees': '—' },
        },
        {
          note: 'Instead of returning markup, it **calls its own children as a function**, passing its state in. The caller decides what that state looks like.',
          marks: { who: { 'the markup': 'active' } },
          cells: { who: ['DataFetcher', 'the caller'], log: ['DataFetcher mounts, starts the fetch', 'children({ data: null, loading: true })'] },
          vars: { loading: 'true', 'what the caller sees': '<Spinner/>' },
        },
        {
          note: 'The fetch resolves, `DataFetcher` re-renders, and it calls the function again with the new values.',
          marks: { who: { 'the data': 'hit' } },
          cells: { who: ['DataFetcher', 'the caller'], log: ['DataFetcher mounts, starts the fetch', 'children({ data: null, loading: true })', 'children({ data: user, loading: false })'] },
          vars: { loading: 'false', 'what the caller sees': '<Profile user={data}/>' },
        },
        {
          note: 'That split — one component owns the behaviour, the caller owns the presentation — is the point, and it is why the same `DataFetcher` can serve a table, a card and a chart.',
          marks: { who: { 'the data': 'skip', 'the markup': 'skip' } },
          cells: { who: ['DataFetcher', 'three different callers'], log: ['one fetcher, three presentations'] },
          vars: { loading: 'false', 'what the caller sees': 'whatever it wants' },
        },
        {
          note: 'A custom hook does the same job with less nesting, which is why render props are now mostly seen where the *tree position* matters too — a virtualiser, a drag context, a measured container.',
          marks: { who: { 'the data': 'hit' } },
          cells: { who: ['useData()', 'the caller'], log: ['const { data, loading } = useData(url)'] },
          vars: { loading: 'false', 'what the caller sees': 'the same, without the wrapper' },
        },
      ],
      result: 'Inverted control: the caller renders',
    },
  },

  /* ── 21 · Compound components ──────────────────────────────────── */
  21: {
    diagram: 'composition_over_memo',
    alt: 'Compound components share state through context',
    trace: {
      input: '<Tabs defaultValue="profile"> … <Tabs.Tab value="billing">',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'tabs', label: 'Tabs · owns active', },
            { id: 'list', label: 'Tabs.List', parent: 'tabs' },
            { id: 'tab1', label: 'Tabs.Tab "profile"', parent: 'list' },
            { id: 'tab2', label: 'Tabs.Tab "billing"', parent: 'list' },
            { id: 'panel', label: 'Tabs.Panel "profile"', parent: 'tabs' },
          ],
        },
      ],
      vars: ['active', 'how the child knows'],
      steps: [
        {
          note: '`Tabs` holds the active value and puts it in a context. The children are whatever the caller wrote — in any order, wrapped in any markup.',
          cursors: { tree: { at: 'tabs' } },
          marks: { tree: { tabs: 'active' } },
          vars: { active: '"profile"', 'how the child knows': 'context, not props' },
        },
        {
          note: 'Each `Tabs.Tab` reads that context to decide whether it is selected. The caller never wired this up — that is what makes the markup read as plain HTML.',
          marks: { tree: { tab1: 'hit', tab2: 'skip', panel: 'hit' } },
          vars: { active: '"profile"', 'how the child knows': 'useContext(TabsContext)' },
        },
        {
          note: 'Clicking the billing tab calls the setter it also got from context. Only `Tabs` owns state; the children are subscribers.',
          cursors: { tree: { at: 'tab2' } },
          marks: { tree: { tab2: 'active' } },
          vars: { active: '"profile" → "billing"', 'how the child knows': 'context setter' },
        },
        {
          note: 'Everything under the provider re-renders and each part re-decides for itself. Nothing was threaded through `Tabs.List` — it can stay a dumb wrapper.',
          marks: { tree: { tabs: 'done', list: 'done', tab1: 'skip', tab2: 'hit', panel: 'skip' } },
          vars: { active: '"billing"', 'how the child knows': 'context, re-read' },
        },
        {
          note: 'The trade: an implicit dependency. `<Tabs.Tab>` used outside a `<Tabs>` fails at runtime, so the provider should throw a clear error rather than hand back `undefined`.',
          marks: { tree: { tab2: 'bad' } },
          vars: { active: 'no provider', 'how the child knows': 'it does not — throw here' },
        },
      ],
      result: 'Flexible markup, state held centrally',
    },
  },

  /* ── 22 · Controlled vs uncontrolled ───────────────────────────── */
  22: {
    diagram: 'controlled_uncontrolled',
    alt: 'Who holds the current value',
    trace: {
      input: 'const [v, setV] = useState(); <input value={v} onChange={…} />',
      lanes: [
        { id: 'who', label: 'value in', kind: 'slots', slots: ['React state', 'the DOM node'] },
        { id: 'log', label: 'console', kind: 'log' },
      ],
      vars: ['value prop', 'input mode'],
      steps: [
        {
          note: 'First render. `useState()` with no argument returns `undefined`, so `value={undefined}` — which React reads as "no value prop at all".',
          marks: { who: { 'the DOM node': 'active' } },
          cells: { who: ['undefined', '""'], log: [] },
          vars: { 'value prop': 'undefined', 'input mode': '**uncontrolled**' },
        },
        {
          note: 'The user types "a". The DOM updates itself, `onChange` fires, and `setV("a")` runs.',
          marks: { who: { 'the DOM node': 'active', 'React state': 'active' } },
          cells: { who: ['"a"', '"a"'], log: [] },
          vars: { 'value prop': '"a"', 'input mode': 'switching…' },
        },
        {
          note: 'Now `value` is a string, so the input becomes controlled — and React warns, because switching mid-life means it cannot reason about which side owns the value.',
          marks: { who: { 'React state': 'bad' } },
          cells: { who: ['"a"', '"a"'], log: ['Warning: A component is changing an uncontrolled input to be controlled.'] },
          vars: { 'value prop': '"a"', 'input mode': '**controlled** — changed' },
        },
        {
          note: 'The fix is one character: `useState("")`. It is controlled from the first render and stays that way.',
          marks: { who: { 'React state': 'hit' } },
          cells: { who: ['""', '""'], log: ['(no warning)'] },
          vars: { 'value prop': '""', 'input mode': 'controlled throughout' },
        },
        {
          note: 'Controlled is the default worth reaching for — live validation, formatting and driving the field from elsewhere all need React to hold the value. Go uncontrolled when you have measured the render cost, or a file input leaves no choice.',
          marks: { who: { 'React state': 'hit', 'the DOM node': 'skip' } },
          cells: { who: ['"ada@"', '"ada@"'], log: ['validate on every keystroke'] },
          vars: { 'value prop': '"ada@"', 'input mode': 'controlled' },
        },
      ],
      result: 'Initialise to "" and the warning never happens',
    },
  },

  /* ── 23 · forwardRef & useImperativeHandle ─────────────────────── */
  23: {
    diagram: 'refs_escape_hatch',
    alt: 'Exposing a narrow imperative API',
    trace: {
      input: '<FancyInput ref={r} /> — the parent wants to focus it',
      lanes: [
        { id: 'exposed', label: 'r.current', kind: 'slots', slots: ['what the parent gets'] },
        { id: 'log', label: 'calls', kind: 'log' },
      ],
      vars: ['can the parent…'],
      steps: [
        {
          note: 'Without `forwardRef`, a ref put on a function component goes nowhere — React warns, and `r.current` stays null.',
          marks: { exposed: { 'what the parent gets': 'bad' } },
          cells: { exposed: ['null'], log: ['Warning: Function components cannot be given refs'] },
          vars: { 'can the parent…': 'nothing' },
        },
        {
          note: '`forwardRef` passes the ref through as a second argument. Attach it straight to the `<input>` and the parent now holds the DOM node.',
          marks: { exposed: { 'what the parent gets': 'window' } },
          cells: { exposed: ['<input> — the whole node'], log: ['r.current.focus()  ✓', 'r.current.style.border = "none"  ← also possible'] },
          vars: { 'can the parent…': 'do *anything* to the node' },
        },
        {
          note: 'That is more than you meant to offer. `useImperativeHandle` replaces what the ref points at with an object you choose.',
          marks: { exposed: { 'what the parent gets': 'hit' } },
          cells: { exposed: ['{ focus, clear }'], log: ['r.current.focus()  ✓', 'r.current.clear()  ✓', 'r.current.style → undefined  ✓'] },
          vars: { 'can the parent…': 'focus and clear — nothing else' },
        },
        {
          note: 'The inner `useRef` still holds the real node, so the component keeps full access to itself while handing out a narrow contract.',
          marks: { exposed: { 'what the parent gets': 'hit' } },
          cells: { exposed: ['{ focus, clear }'], log: ['innerRef.current → the real <input>'] },
          vars: { 'can the parent…': 'focus and clear' },
        },
        {
          note: 'Use it for focus, scroll, select and media controls. If you are reaching for it to push *data* into a child, that data wanted to be a prop.',
          marks: { exposed: { 'what the parent gets': 'skip' } },
          cells: { exposed: ['{ focus, clear }'], log: ['imperative for actions, props for data'] },
          vars: { 'can the parent…': 'focus and clear' },
        },
      ],
      result: 'React 19 passes ref as a plain prop — no forwardRef needed',
    },
  },

  /* ── 24 · Portals ──────────────────────────────────────────────── */
  24: {
    diagram: 'portals_stacking',
    alt: 'The DOM moves; the React tree does not',
    after: '## Mental model',
    trace: {
      input: 'createPortal(<div className="modal">…</div>, document.getElementById("modal-root"))',
      lanes: [
        {
          id: 'react',
          label: 'React',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App' },
            { id: 'card', label: 'Card · onClick', parent: 'app' },
            { id: 'modal', label: 'Modal', parent: 'card' },
          ],
        },
        {
          id: 'dom',
          label: 'DOM',
          kind: 'tree',
          nodes: [
            { id: 'body', label: 'body' },
            { id: 'root', label: 'div#root', parent: 'body' },
            { id: 'dcard', label: 'div.card · overflow:hidden', parent: 'root' },
            { id: 'proot', label: 'div#modal-root', parent: 'body' },
          ],
        },
      ],
      vars: ['clipped by .card?', 'onClick on Card fires?'],
      steps: [
        {
          note: 'Without a portal, the modal renders inside `div.card` — which has `overflow: hidden`, so half the modal is cut off.',
          marks: { react: { modal: 'active' }, dom: { dcard: 'bad' } },
          vars: { 'clipped by .card?': '**yes**', 'onClick on Card fires?': 'yes' },
        },
        {
          note: '`createPortal` sends the DOM node to `#modal-root`, a sibling of `#root`. It escapes the overflow, the z-index stack and any `transform` on an ancestor.',
          marks: { react: { modal: 'active' }, dom: { proot: 'hit' } },
          vars: { 'clipped by .card?': 'no  ✓', 'onClick on Card fires?': 'yes' },
        },
        {
          note: 'In the React tree, nothing moved. `Modal` is still `Card`\'s child — so it still reads Card\'s context and still receives what Card passes down.',
          marks: { react: { card: 'active', modal: 'window' }, dom: { proot: 'hit' } },
          vars: { 'clipped by .card?': 'no  ✓', 'onClick on Card fires?': 'yes' },
        },
        {
          note: 'And events still bubble through the **React** tree. A click inside the portal fires `Card`\'s `onClick`, even though the node is nowhere near `.card` in the DOM.',
          marks: { react: { card: 'window', modal: 'active' }, dom: { proot: 'window' } },
          vars: { 'clipped by .card?': 'no', 'onClick on Card fires?': '**yes** — surprising' },
        },
        {
          note: 'That is usually what you want — and it is exactly what breaks a naive "click outside to close", because as far as React is concerned the click *was* inside.',
          marks: { react: { card: 'bad' } },
          vars: { 'clipped by .card?': 'no', 'onClick on Card fires?': 'yes — check the target, not the tree' },
        },
      ],
      result: 'Pixels move, ownership does not',
    },
  },

  /* ── 25 · Error boundaries ─────────────────────────────────────── */
  25: {
    diagram: 'error_boundaries',
    alt: 'What an error boundary catches, and what it does not',
    after: '## Scope — this is a favorite trick question',
    trace: {
      input: 'A <Chart> that throws, under one <ErrorBoundary>',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App' },
            { id: 'eb', label: '<ErrorBoundary>', parent: 'app' },
            { id: 'dash', label: 'Dashboard', parent: 'eb' },
            { id: 'chart', label: 'Chart', parent: 'dash' },
          ],
        },
        { id: 'log', label: 'what runs', kind: 'log' },
      ],
      vars: ['hasError', 'on screen'],
      steps: [
        {
          note: 'Chart throws during render — a null dereference on data that arrived in the wrong shape.',
          cursors: { tree: { at: 'chart' } },
          marks: { tree: { chart: 'bad' } },
          cells: { log: ['Chart render → TypeError'] },
          vars: { hasError: 'false', 'on screen': 'the dashboard' },
        },
        {
          note: 'The error climbs the tree looking for the nearest boundary above it. Dashboard is not one, so it keeps going.',
          cursors: { tree: { at: 'dash' } },
          marks: { tree: { chart: 'bad', dash: 'window' } },
          cells: { log: ['Chart render → TypeError', 'no boundary at Dashboard — keep climbing'] },
          vars: { hasError: 'false', 'on screen': 'the dashboard' },
        },
        {
          note: '`getDerivedStateFromError` runs and returns the new state; `componentDidCatch` runs too, and is where the report goes.',
          cursors: { tree: { at: 'eb' } },
          marks: { tree: { eb: 'active' } },
          cells: { log: ['Chart render → TypeError', 'no boundary at Dashboard — keep climbing', 'getDerivedStateFromError → { hasError: true }', 'componentDidCatch → logToService(e, componentStack)'] },
          vars: { hasError: 'true', 'on screen': 'the dashboard' },
        },
        {
          note: 'The boundary re-renders as `<Fallback/>`. Everything below it — Dashboard included, not just Chart — is unmounted. A page-level boundary turns one broken widget into a blank page.',
          marks: { tree: { eb: 'hit', dash: 'done', chart: 'done' } },
          cells: { log: ['Chart render → TypeError', 'no boundary at Dashboard — keep climbing', 'getDerivedStateFromError → { hasError: true }', 'componentDidCatch → logToService(e, componentStack)', '<Fallback/> replaces the whole subtree'] },
          vars: { hasError: 'true', 'on screen': '<Fallback/>' },
        },
        {
          note: 'The trick question: had Chart thrown inside an `onClick`, a `setTimeout` or a `.then()`, no boundary would fire. Rendering is over by then — that needs an ordinary `try/catch`.',
          marks: { tree: { eb: 'skip', chart: 'bad' } },
          cells: { log: ['onClick → TypeError', 'no boundary involved — the error reaches window.onerror'] },
          vars: { hasError: 'false', 'on screen': 'a broken page, no fallback' },
        },
      ],
      result: 'Render, lifecycle and constructors — nothing async',
    },
  },

  /* ── 26 · Where state should live ──────────────────────────────── */
  26: {
    diagram: 'state_ladder',
    alt: 'The state placement ladder',
    trace: {
      input: 'A search filter that starts in one component and spreads',
      lanes: [
        { id: 'rung', label: 'rung', kind: 'phases', of: ['local', 'lifted', 'context', 'store', 'server cache'] },
      ],
      vars: ['who reads it', 'why move'],
      steps: [
        {
          note: 'One component needs the filter. `useState` inside it, and no further thought required — most state stops here and should.',
          cursors: { rung: { at: 'local' } },
          vars: { 'who reads it': 'SearchBox', 'why move': '—' },
        },
        {
          note: 'Now `Results` needs it too. Lift it to their lowest common owner and pass it down — not to the root, just far enough.',
          cursors: { rung: { at: 'lifted' } },
          marks: { rung: { lifted: 'hit' } },
          vars: { 'who reads it': 'SearchBox + Results', 'why move': 'two readers, one owner' },
        },
        {
          note: 'Four levels of pass-through later, it is worth a context. Note what justified it: the *depth*, not the number of readers.',
          cursors: { rung: { at: 'context' } },
          marks: { rung: { context: 'hit' } },
          vars: { 'who reads it': 'a deep subtree', 'why move': 'prop drilling through components that ignore it' },
        },
        {
          note: 'A store earns its place when there are many writers and you need devtools, middleware or selector-level subscriptions. That is a real bar and most apps do not clear it.',
          cursors: { rung: { at: 'store' } },
          marks: { rung: { store: 'window' } },
          vars: { 'who reads it': 'everywhere, written from everywhere', 'why move': 'needs devtools and narrow subscriptions' },
        },
        {
          note: 'And if the value came from an endpoint, it was never client state. It is a cache with a staleness policy, and the ladder does not apply to it.',
          cursors: { rung: { at: 'server cache' } },
          marks: { rung: { 'server cache': 'hit' } },
          vars: { 'who reads it': 'anyone who asks the cache', 'why move': 'the server owns the truth' },
        },
      ],
      result: 'Climb a rung only when the one below fails',
    },
  },

  /* ── 27 · Server state vs client state ─────────────────────────── */
  27: {
    diagram: 'server_vs_client_state',
    alt: 'Server state is a cache, not state',
    trace: {
      input: 'const [orders, setOrders] = useState([]) + useEffect(fetch)',
      lanes: [
        { id: 'log', label: 'what you add', kind: 'log' },
        { id: 'phase', label: 'you are now', kind: 'phases', of: ['a fetch', 'a cache', 'a library'] },
      ],
      vars: ['lines of code', 'bugs still open'],
      steps: [
        {
          note: 'It starts honestly: fetch in an effect, put the result in state. Twelve lines.',
          cursors: { phase: { at: 'a fetch' } },
          cells: { log: ['useEffect(() => { fetch(url).then(setOrders) }, [url])'] },
          vars: { 'lines of code': '12', 'bugs still open': 'loading, error, cancel' },
        },
        {
          note: 'Then the review comments arrive: a loading flag, an error branch, and a cleanup so a late response cannot set state after unmount.',
          cursors: { phase: { at: 'a fetch' } },
          marks: { log: { '1-2': 'active' } },
          cells: { log: ['useEffect(() => { fetch(url).then(setOrders) }, [url])', '+ loading / error flags', '+ a cancelled flag in the cleanup'] },
          vars: { 'lines of code': '38', 'bugs still open': 'two components fetch the same thing' },
        },
        {
          note: 'Two components mount and both fetch. Now you need a shared cache — at which point this is not state any more, whatever the variable is called.',
          cursors: { phase: { at: 'a cache' } },
          marks: { log: { 3: 'window' } },
          cells: { log: ['useEffect(() => { fetch(url).then(setOrders) }, [url])', '+ loading / error flags', '+ a cancelled flag in the cleanup', '+ a module-level cache keyed by url'] },
          vars: { 'lines of code': '70', 'bugs still open': 'stale after a write; no refetch on focus' },
        },
        {
          note: 'Then invalidation after a mutation, refetch on window focus, retry with backoff, and keeping the previous page visible while the next loads.',
          cursors: { phase: { at: 'a library' } },
          marks: { log: { 4: 'bad' } },
          cells: { log: ['useEffect(() => { fetch(url).then(setOrders) }, [url])', '+ loading / error flags', '+ a cancelled flag in the cleanup', '+ a module-level cache keyed by url', '+ invalidate, refocus, retry, keepPreviousData'] },
          vars: { 'lines of code': '180', 'bugs still open': 'the ones you have not hit yet' },
        },
        {
          note: 'That list *is* React Query. Recognising server state early is what lets you skip the whole staircase — and stops you copying fetched data into `useState` "so we can edit it".',
          cursors: { phase: { at: 'a library' } },
          marks: { log: { 5: 'hit' } },
          cells: { log: ['const { data, isLoading } = useQuery(["orders"], fetchOrders)'] },
          vars: { 'lines of code': '1', 'bugs still open': 'none of those' },
        },
      ],
      result: 'The library is the eight chores, not a nicer fetch',
    },
  },

  /* ── 28 · Context re-renders ───────────────────────────────────── */
  28: {
    diagram: 'context_propagation',
    alt: 'Every consumer re-renders when the value changes',
    trace: {
      input: 'createContext({ user, theme, cart }) — one context, three concerns',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'prov', label: 'AppContext.Provider' },
            { id: 'layout', label: 'Layout', parent: 'prov' },
            { id: 'side', label: 'memo(Sidebar)', parent: 'layout' },
            { id: 'name', label: 'UserName · reads user', parent: 'side' },
            { id: 'cartb', label: 'CartBadge · reads cart', parent: 'layout' },
          ],
        },
      ],
      vars: ['what changed', 'value reference'],
      steps: [
        {
          note: 'The theme toggle fires. Only `theme` changed — `user` and `cart` are the same values they were.',
          cursors: { tree: { at: 'prov' } },
          marks: { tree: { prov: 'active' } },
          vars: { 'what changed': 'theme', 'value reference': 'obj#1 → obj#2' },
        },
        {
          note: 'But the provider passes `{ user, theme, cart }` — a new object literal. Context subscription compares the *whole value* by identity, so every consumer is notified.',
          marks: { tree: { prov: 'active', name: 'bad', cartb: 'bad' } },
          vars: { 'what changed': 'theme', 'value reference': 'obj#2 ≠ obj#1 → notify all' },
        },
        {
          note: '`memo(Sidebar)` bails out — its props really are unchanged — and React walks straight past it anyway to reach `UserName`. A consumer is subscribed directly; nothing in between can shield it.',
          marks: { tree: { side: 'skip', name: 'bad' } },
          vars: { 'what changed': 'theme', 'value reference': 'memo cannot help here' },
        },
        {
          note: 'First fix, always: `useMemo` the value so it only changes when its contents do. That stops the *spurious* notifications.',
          marks: { tree: { prov: 'active', name: 'skip', cartb: 'skip' } },
          vars: { 'what changed': 'nothing relevant', 'value reference': 'obj#1 — stable' },
        },
        {
          note: 'Real fix: split it. `UserContext`, `ThemeContext`, `CartContext` — now a theme change reaches only the components that read the theme.',
          marks: { tree: { prov: 'hit', name: 'skip', cartb: 'skip' } },
          vars: { 'what changed': 'theme only', 'value reference': 'only ThemeContext changed' },
        },
      ],
      result: 'Memoise the value; split the context',
    },
  },

  /* ── 29 · CSR / SSR / SSG / ISR ────────────────────────────────── */
  29: {
    diagram: 'rendering_strategies_react',
    alt: 'When the HTML is built, and hydration',
    trace: {
      input: 'The same product page, delivered four ways',
      lanes: [
        { id: 'phase', label: 'SSR', kind: 'phases', of: ['request', 'HTML', 'paint', 'JS', 'hydrate', 'interactive'] },
        { id: 'log', label: 'the four', kind: 'log' },
      ],
      vars: ['first paint', 'first interaction'],
      steps: [
        {
          note: 'CSR: the browser gets an empty shell and a script tag. Nothing is visible until the JS has downloaded, parsed and run.',
          cursors: { phase: { now: 'JS' } },
          cells: { log: ['CSR — blank → spinner → content'] },
          vars: { 'first paint': 'late  (after JS)', 'first interaction': 'right after paint' },
        },
        {
          note: 'SSR: the server renders the page per request, so real content is in the first byte. The user sees the product immediately.',
          cursors: { phase: { now: 'paint' } },
          marks: { phase: { HTML: 'hit', paint: 'hit' } },
          cells: { log: ['CSR — blank → spinner → content', 'SSR — content in the first byte'] },
          vars: { 'first paint': 'early  ✓', 'first interaction': 'not yet…' },
        },
        {
          note: 'This is the part people skip. The page looks ready but every click is ignored until the JS loads and React re-renders the whole tree to attach handlers.',
          cursors: { phase: { now: 'hydrate' } },
          marks: { phase: { JS: 'bad', hydrate: 'bad' } },
          cells: { log: ['CSR — blank → spinner → content', 'SSR — content in the first byte', 'SSR — looks ready, ignores clicks (hydration gap)'] },
          vars: { 'first paint': 'early', 'first interaction': 'late — the gap' },
        },
        {
          note: 'And if the server HTML disagrees with the client render — a `Date.now()`, a `window` check, a random id — React discards that subtree and re-renders it. You paid for SSR and got CSR.',
          cursors: { phase: { now: 'hydrate' } },
          marks: { phase: { hydrate: 'bad' } },
          cells: { log: ['CSR — blank → spinner → content', 'SSR — content in the first byte', 'SSR — looks ready, ignores clicks (hydration gap)', 'mismatch → subtree re-rendered on the client'] },
          vars: { 'first paint': 'early', 'first interaction': 'later still' },
        },
        {
          note: 'SSG builds the HTML once at deploy and serves it from a CDN — fastest of all, but only for content that does not vary per user. ISR adds a background rebuild, so one unlucky visitor gets a stale page and everyone after them gets a fresh one.',
          cursors: { phase: { now: 'interactive' } },
          marks: { phase: { HTML: 'hit', interactive: 'hit' } },
          cells: { log: ['CSR — blank → spinner → content', 'SSR — content in the first byte', 'SSR — looks ready, ignores clicks (hydration gap)', 'mismatch → subtree re-rendered on the client', 'SSG — instant from a CDN · ISR — SSG + background rebuild'] },
          vars: { 'first paint': 'instant', 'first interaction': 'after hydration, as always' },
        },
      ],
      result: 'Pick by who owns the content and how fresh it must be',
    },
  },

  /* ── 30 · Server components, actions, use() ────────────────────── */
  30: {
    diagram: 'rsc_boundary',
    alt: 'The server/client component boundary',
    after: '## Mental model',
    trace: {
      input: 'A product page: server data, one interactive button',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'page', label: 'Page · server' },
            { id: 'list', label: 'ProductList · server', parent: 'page' },
            { id: 'cart', label: 'AddToCart · "use client"', parent: 'list' },
            { id: 'price', label: 'Price · server (as children)', parent: 'cart' },
          ],
        },
        { id: 'bundle', label: 'shipped JS', kind: 'log' },
      ],
      vars: ['runs on', 'bundle size'],
      steps: [
        {
          note: '`Page` is a server component. It can `await` a database query directly in the component body — no effect, no loading state, no endpoint.',
          cursors: { tree: { at: 'page' } },
          marks: { tree: { page: 'active' } },
          cells: { bundle: [] },
          vars: { 'runs on': 'the server', 'bundle size': '0 KB so far' },
        },
        {
          note: '`ProductList` uses a 300 KB markdown renderer for the descriptions. It runs on the server too, so that library is never sent to the browser.',
          marks: { tree: { page: 'done', list: 'hit' } },
          cells: { bundle: [] },
          vars: { 'runs on': 'the server', 'bundle size': '0 KB — the parser stays home' },
        },
        {
          note: '`AddToCart` needs `onClick` and `useState`, so it is marked `"use client"`. That directive is the boundary: this component and its imports get bundled.',
          cursors: { tree: { at: 'cart' } },
          marks: { tree: { cart: 'active' } },
          cells: { bundle: ['AddToCart + its imports — 8 KB'] },
          vars: { 'runs on': 'the browser', 'bundle size': '8 KB' },
        },
        {
          note: 'And `Price` — a server component — still appears *below* it, because `AddToCart` received it as `children`. The boundary is about where code is bundled, not about tree depth.',
          marks: { tree: { cart: 'done', price: 'hit' } },
          cells: { bundle: ['AddToCart + its imports — 8 KB'] },
          vars: { 'runs on': 'the server, rendered into a slot', 'bundle size': 'still 8 KB' },
        },
        {
          note: 'Props crossing the boundary must be serialisable, so a function cannot be passed down. Going the other way, `"use server"` lets the client component call a server function directly.',
          marks: { tree: { cart: 'window' } },
          cells: { bundle: ['AddToCart + its imports — 8 KB', 'a callback prop → error: not serialisable', 'a "use server" action → allowed'] },
          vars: { 'runs on': 'both, by contract', 'bundle size': '8 KB' },
        },
      ],
      result: 'Ship behaviour, not the library that produced the content',
    },
  },

  /* ── 31 · React 18 concurrent features ─────────────────────────── */
  31: {
    diagram: 'concurrent_lanes',
    alt: 'Urgent work interrupts non-urgent work',
    after: '## Mental model',
    trace: {
      input: 'setInputValue urgent; setResults inside startTransition',
      lanes: [
        { id: 'phase', label: 'thread', kind: 'phases', of: ['idle', 'urgent', 'transition', 'commit'] },
        { id: 'log', label: 'main thread', kind: 'log' },
      ],
      vars: ['input latency', 'work discarded'],
      steps: [
        {
          note: 'Before React 18 this was one synchronous render. Once it started, the main thread was gone until it finished — 240 ms of frozen input.',
          cursors: { phase: { now: 'urgent' } },
          marks: { phase: { urgent: 'bad' } },
          cells: { log: ['legacy: one uninterruptible 240 ms render'] },
          vars: { 'input latency': '240 ms', 'work discarded': 'none — you waited for all of it' },
        },
        {
          note: 'With a transition, React splits the update into two lanes and does the urgent one on its own. The character appears in about 4 ms.',
          cursors: { phase: { now: 'urgent' } },
          marks: { phase: { urgent: 'hit' } },
          cells: { log: ['legacy: one uninterruptible 240 ms render', 'urgent lane: input → 4 ms → committed'] },
          vars: { 'input latency': '4 ms  ✓', 'work discarded': 'none yet' },
        },
        {
          note: 'The transition renders in slices, yielding to the browser between them. React checks for higher-priority work at every yield.',
          cursors: { phase: { now: 'transition' } },
          marks: { phase: { transition: 'active' } },
          cells: { log: ['legacy: one uninterruptible 240 ms render', 'urgent lane: input → 4 ms → committed', 'transition: slice… yield… slice… yield…'] },
          vars: { 'input latency': '4 ms', 'work discarded': 'none yet' },
        },
        {
          note: 'Another keystroke arrives. React throws the half-built tree away and restarts — the CPU work is wasted, and nothing half-finished was ever shown.',
          cursors: { phase: { now: 'urgent' } },
          marks: { phase: { transition: 'bad', urgent: 'hit' } },
          cells: { log: ['legacy: one uninterruptible 240 ms render', 'urgent lane: input → 4 ms → committed', 'transition: slice… yield… slice… yield…', 'keypress → discard the WIP tree, restart'] },
          vars: { 'input latency': '4 ms', 'work discarded': '~90 ms of rendering' },
        },
        {
          note: 'Typing stops and the transition commits. Automatic batching is the other half of React 18 — timers and promises now batch too, so this whole sequence costs fewer renders than it would have in 17.',
          cursors: { phase: { now: 'commit' } },
          marks: { phase: { commit: 'hit' } },
          cells: { log: ['legacy: one uninterruptible 240 ms render', 'urgent lane: input → 4 ms → committed', 'transition: slice… yield… slice… yield…', 'keypress → discard the WIP tree, restart', 'transition committed'] },
          vars: { 'input latency': '4 ms throughout', 'work discarded': 'traded for responsiveness' },
        },
      ],
      result: 'Interruptible, not faster',
    },
  },

  /* ── 32 · useTransition vs useDeferredValue ────────────────────── */
  32: {
    diagram: 'concurrent_lanes',
    alt: 'Choosing between the two concurrent hooks',
    trace: {
      input: 'The same slow list, reached from two different positions',
      lanes: [
        { id: 'own', label: 'you own', kind: 'slots', slots: ['the setter', 'only the value'] },
      ],
      vars: ['reach for', 'why'],
      steps: [
        {
          note: 'The question is never "which is faster" — they schedule identically. It is "do you own the update that caused the slow render?"',
          marks: { own: { 'the setter': 'window', 'only the value': 'window' } },
          cells: { own: ['?', '?'] },
          vars: { 'reach for': 'to be decided', why: 'position, not performance' },
        },
        {
          note: 'You wrote `setResults(...)` yourself, in the same handler. Wrap that call: `startTransition(() => setResults(...))`.',
          marks: { own: { 'the setter': 'hit' } },
          cells: { own: ['useTransition', '—'] },
          vars: { 'reach for': 'useTransition', why: 'you can mark the update at its source' },
        },
        {
          note: 'It also hands you `isPending`, which is the honest way to show a subtle spinner without flashing the whole list away.',
          marks: { own: { 'the setter': 'hit' } },
          cells: { own: ['useTransition + isPending', '—'] },
          vars: { 'reach for': 'useTransition', why: 'you get a pending flag' },
        },
        {
          note: 'Now the slow value arrives as a **prop** from a parent you do not control. There is no setter to wrap.',
          marks: { own: { 'only the value': 'active' } },
          cells: { own: ['—', 'useDeferredValue'] },
          vars: { 'reach for': 'useDeferredValue', why: 'no setter in reach' },
        },
        {
          note: 'Defer the value instead and derive `isStale` from `query !== deferredQuery`. Same scheduler, applied at the reading end rather than the writing end.',
          marks: { own: { 'only the value': 'hit' } },
          cells: { own: ['—', 'useDeferredValue + isStale'] },
          vars: { 'reach for': 'useDeferredValue', why: 'defer the reader' },
        },
      ],
      result: 'Own the setter → transition. Own only the value → defer.',
    },
  },

  /* ── 33 · StrictMode double invoke ─────────────────────────────── */
  33: {
    diagram: 'strictmode_double_invoke',
    alt: 'Development runs effects twice on purpose',
    trace: {
      input: 'useEffect(() => { console.log("mounted"); return () => console.log("cleanup"); }, [])',
      lanes: [
        { id: 'log', label: 'console', kind: 'log' },
        { id: 'phase', label: 'build', kind: 'phases', of: ['development', 'production'] },
      ],
      vars: ['live subscriptions', 'what it proves'],
      steps: [
        {
          note: 'Mount in development. The effect runs: `mounted`.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 0: 'active' } },
          cells: { log: ['mounted'] },
          vars: { 'live subscriptions': '1', 'what it proves': 'nothing yet' },
        },
        {
          note: 'React immediately tears it down: `cleanup`. It is simulating the user navigating away.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 0: 'done', 1: 'active' } },
          cells: { log: ['mounted', 'cleanup'] },
          vars: { 'live subscriptions': '0', 'what it proves': 'the cleanup exists' },
        },
        {
          note: 'Then sets it up again: `mounted`. Back to one subscription — because the cleanup did its job.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { '0-1': 'done', 2: 'hit' } },
          cells: { log: ['mounted', 'cleanup', 'mounted'] },
          vars: { 'live subscriptions': '1  ✓', 'what it proves': 'the effect is re-runnable' },
        },
        {
          note: 'Now remove the cleanup and watch the same sequence: two subscriptions, one of them unreachable. That leak is real in production too — it just needs a user to navigate away and back.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 3: 'bad', 4: 'bad' } },
          cells: { log: ['mounted', 'cleanup', 'mounted', '— without a cleanup —', 'mounted, mounted → 2 live subscriptions'] },
          vars: { 'live subscriptions': '2  ✗', 'what it proves': 'you have a leak' },
        },
        {
          note: 'In production none of this happens — the effect runs once. Suppressing the double-invoke with a `hasRun` ref hides the signal and keeps the bug.',
          cursors: { phase: { now: 'production' } },
          marks: { log: { 5: 'hit' } },
          cells: { log: ['mounted'] },
          vars: { 'live subscriptions': '1', 'what it proves': 'development-only rehearsal' },
        },
      ],
      result: 'A leak found on render one instead of in a bug report',
    },
  },

  /* ── 34 · Testing strategy ─────────────────────────────────────── */
  34: {
    diagram: 'testing_pyramid',
    alt: 'Query the way a user looks',
    trace: {
      input: 'A save button that shows a confirmation',
      lanes: [
        { id: 'q', label: 'query', kind: 'slots', slots: ['getByRole', 'getByLabelText', 'getByText', 'getByTestId'] },
        { id: 'log', label: 'refactor', kind: 'log' },
      ],
      vars: ['test says', 'user affected?'],
      steps: [
        {
          note: 'Start with `getByRole("button", { name: /save/i })` — the element as assistive technology sees it, which is the closest a test gets to being the user.',
          marks: { q: { getByRole: 'hit' } },
          cells: { log: ['✓ passes'] },
          vars: { 'test says': 'pass', 'user affected?': '—' },
        },
        {
          note: 'Someone renames the internal state from `open` to `isOpen`. An implementation test goes red here. This one does not — nothing a user can perceive changed.',
          marks: { q: { getByRole: 'skip' } },
          cells: { log: ['✓ passes', 'refactor: open → isOpen  ·  still ✓'] },
          vars: { 'test says': 'pass', 'user affected?': 'no — correctly silent' },
        },
        {
          note: 'Someone replaces the `<button>` with a styled `<div onClick>`. It still looks identical and still works with a mouse.',
          marks: { q: { getByRole: 'bad' } },
          cells: { log: ['✓ passes', 'refactor: open → isOpen  ·  still ✓', 'refactor: button → div  ·  ✗ FAILS'] },
          vars: { 'test says': '**fail**', 'user affected?': 'yes — no keyboard, no screen reader' },
        },
        {
          note: 'That failure is the whole value. The test caught an accessibility regression that a snapshot or a `getByTestId` would have sailed straight past.',
          marks: { q: { getByRole: 'hit', getByTestId: 'bad' } },
          cells: { log: ['getByRole → caught it', 'getByTestId → would have passed'] },
          vars: { 'test says': 'fail, correctly', 'user affected?': 'yes' },
        },
        {
          note: 'Hence the priority order. `getByTestId` is the escape hatch — it is invisible to users, so passing it proves nothing about them.',
          marks: { q: { getByRole: 'hit', getByLabelText: 'hit', getByText: 'window', getByTestId: 'bad' } },
          cells: { log: ['role → label → text → testid, in that order'] },
          vars: { 'test says': '—', 'user affected?': '—' },
        },
      ],
      result: 'Red on a bug, silent on a refactor',
    },
  },

  /* ── 35 · Accessibility essentials ─────────────────────────────── */
  35: {
    diagram: 'a11y_tree',
    alt: 'The accessibility tree behind the pixels',
    trace: {
      input: 'A dialog opened from a button, built two ways',
      lanes: [
        { id: 'ax', label: 'announced', kind: 'log' },
        { id: 'focus', label: 'focus', kind: 'slots', slots: ['where it is'] },
      ],
      vars: ['keyboard user can…'],
      steps: [
        {
          note: 'The trigger is a `<div className="btn">`. A mouse user cannot tell; a keyboard user cannot reach it at all — it is not in the tab order.',
          marks: { ax: { 0: 'bad' } },
          cells: { ax: ['"Open settings" — plain text, no role'], focus: ['nowhere — not focusable'] },
          vars: { 'keyboard user can…': 'nothing' },
        },
        {
          note: 'Swap in a real `<button>`. Focusability, the tab order, Enter and Space, and the announced role all arrive together, for free.',
          marks: { ax: { 1: 'hit' } },
          cells: { ax: ['"Open settings" — plain text, no role', '"Open settings, button"'], focus: ['the button'] },
          vars: { 'keyboard user can…': 'reach it and press it' },
        },
        {
          note: 'The dialog opens — and focus is still on the button behind it. Tab now walks the page underneath while the dialog sits there unreachable.',
          marks: { ax: { 2: 'bad' } },
          cells: { ax: ['"Open settings" — plain text, no role', '"Open settings, button"', 'dialog opened — nothing announced'], focus: ['still the button'] },
          vars: { 'keyboard user can…': 'tab through the page behind the dialog' },
        },
        {
          note: 'Move focus into the dialog on open and trap it there; return it to the trigger on close. This is the part React makes you write, because the DOM moved and focus did not follow.',
          marks: { ax: { 3: 'hit' } },
          cells: { ax: ['"Open settings" — plain text, no role', '"Open settings, button"', 'dialog opened — nothing announced', '"Settings, dialog" — focus moved in, trapped'], focus: ['inside the dialog'] },
          vars: { 'keyboard user can…': 'use the dialog and Escape out' },
        },
        {
          note: 'Same story for an async result: the DOM changed but nothing was announced. `role="status"` on the confirmation makes it spoken, and `useId` keeps every label tied to its field.',
          marks: { ax: { 4: 'hit' } },
          cells: { ax: ['"Settings, dialog"', '"Saved" — role="status", announced politely'], focus: ['back on the trigger'] },
          vars: { 'keyboard user can…': 'hear that it worked' },
        },
      ],
      result: 'Native elements first, then focus and announcements',
    },
  },

  /* ── 36 · Micro-frontends ──────────────────────────────────────── */
  36: {
    diagram: 'microfrontend_topology',
    alt: 'A host loading remotes at runtime',
    trace: {
      input: 'ModuleFederationPlugin — host + a checkout remote',
      lanes: [
        { id: 'log', label: 'at runtime', kind: 'log' },
        { id: 'react', label: 'React copies', kind: 'slots', slots: ['host', 'remote'] },
      ],
      vars: ['bundle', 'who deploys'],
      steps: [
        {
          note: 'The host ships knowing only a URL. `checkout/Cart` is not in its bundle — it is a promise to fetch something at that address later.',
          cells: { log: ['host boots — remoteEntry.js not yet fetched'], react: ['18.3', '—'] },
          vars: { bundle: 'host only', 'who deploys': 'the host team' },
        },
        {
          note: 'The user reaches the cart route. `React.lazy(() => import("checkout/Cart"))` fetches `remoteEntry.js` and then the component chunk.',
          marks: { log: { 1: 'active' } },
          cells: { log: ['host boots — remoteEntry.js not yet fetched', 'fetch remoteEntry.js → Cart chunk'], react: ['18.3', '?'] },
          vars: { bundle: 'host + cart chunk', 'who deploys': 'the checkout team, independently' },
        },
        {
          note: 'Without `shared: { react: { singleton: true } }`, the remote brings its own React. Two copies means two hook dispatchers — and hooks called from the wrong one throw.',
          marks: { log: { 2: 'bad' }, react: { host: 'bad', remote: 'bad' } },
          cells: { log: ['host boots — remoteEntry.js not yet fetched', 'fetch remoteEntry.js → Cart chunk', 'two Reacts → "Invalid hook call"'], react: ['18.3', '19.0 — its own'] },
          vars: { bundle: 'two Reacts, ~130 KB wasted', 'who deploys': 'both, incompatibly' },
        },
        {
          note: '`singleton: true` makes them share one instance. That is also the coupling nobody advertises: the two teams now have to agree on a React version at runtime.',
          marks: { react: { host: 'hit', remote: 'skip' } },
          cells: { log: ['singleton: true → one React, shared'], react: ['18.3', 'uses the host\'s'] },
          vars: { bundle: 'one React', 'who deploys': 'independently — within a version range' },
        },
        {
          note: 'What you bought: the checkout team ships without a release train, and their broken build is their own. What you pay: a runtime contract to version, and a stack trace that spans repos you cannot see.',
          marks: { log: { 4: 'window' } },
          cells: { log: ['independent deploys  ✓', 'runtime version contract  ✗', 'debugging across repos  ✗'], react: ['18.3', 'shared'] },
          vars: { bundle: 'one React', 'who deploys': 'each team, on its own cadence' },
        },
      ],
      result: 'An organisational fix with a technical bill',
    },
  },

  /* ── 37 · Gotcha bank ──────────────────────────────────────────── */
  37: {
    diagram: 'rerender_triggers',
    alt: 'The mechanism behind most React gotchas',
    trace: {
      input: 'Four of the bank\'s gotchas, and the one idea underneath them',
      lanes: [
        { id: 'log', label: 'gotcha', kind: 'log' },
        { id: 'cause', label: 'root cause', kind: 'slots', slots: ['identity', 'timing'] },
      ],
      vars: ['why it surprises'],
      steps: [
        {
          note: '"`setState` then read the variable — it is still the old value." State is a request for the next render, not an assignment.',
          marks: { log: { 0: 'active' }, cause: { timing: 'active' } },
          cells: { log: ['setCount(1); console.log(count) → 0'], cause: ['—', 'the value belongs to this render'] },
          vars: { 'why it surprises': 'it reads like an assignment' },
        },
        {
          note: '"`useEffect` with an object dependency runs every time." The object is rebuilt each render, so `Object.is` never matches.',
          marks: { log: { 1: 'active' }, cause: { identity: 'active' } },
          cells: { log: ['setCount(1); console.log(count) → 0', 'useEffect(fn, [{ id }]) — runs forever'], cause: ['a new object every render', 'the value belongs to this render'] },
          vars: { 'why it surprises': 'the contents did not change' },
        },
        {
          note: '"`memo` does nothing." Same cause: an inline object, array or arrow as a prop.',
          marks: { log: { 2: 'active' }, cause: { identity: 'hit' } },
          cells: { log: ['setCount(1); console.log(count) → 0', 'useEffect(fn, [{ id }]) — runs forever', 'memo(Child) re-renders anyway'], cause: ['a new object every render', 'the value belongs to this render'] },
          vars: { 'why it surprises': 'the contents did not change' },
        },
        {
          note: '"The interval always sets 1." Same cause as the first: a closure holding render one\'s value.',
          marks: { log: { 3: 'active' }, cause: { timing: 'hit' } },
          cells: { log: ['setCount(1); console.log(count) → 0', 'useEffect(fn, [{ id }]) — runs forever', 'memo(Child) re-renders anyway', 'setInterval(() => setCount(count + 1)) — stuck at 1'], cause: ['a new object every render', 'the value belongs to this render'] },
          vars: { 'why it surprises': 'the variable looks shared' },
        },
        {
          note: 'Almost every gotcha in the bank is one of these two. A render is a snapshot, and comparison is by identity — hold both and the list stops needing memorising.',
          marks: { cause: { identity: 'hit', timing: 'hit' } },
          cells: { log: ['two ideas, fifteen symptoms'], cause: ['compare by identity', 'a render is a snapshot'] },
          vars: { 'why it surprises': 'it stops surprising' },
        },
      ],
      result: 'Identity and snapshots explain the bank',
    },
  },

  /* ── 38 · Rapid-fire Q&A ───────────────────────────────────────── */
  38: {
    diagram: 'guide_map',
    alt: 'Where each rapid-fire answer sits in the guide',
    trace: {
      input: 'How to answer a rapid-fire React question well',
      lanes: [
        { id: 'shape', label: 'answer', kind: 'phases', of: ['the claim', 'the mechanism', 'the caveat'] },
        { id: 'log', label: 'worked example', kind: 'log' },
      ],
      vars: ['reads as'],
      steps: [
        {
          note: '"Why do you need keys?" — lead with the claim, in one sentence. Do not narrate your way towards it.',
          cursors: { shape: { now: 'the claim' } },
          cells: { log: ['"Keys tell React which element is which across renders."'] },
          vars: { 'reads as': 'confident' },
        },
        {
          note: 'Then the mechanism, in one more. This is the sentence that separates someone who read a blog post from someone who knows.',
          cursors: { shape: { now: 'the mechanism' } },
          marks: { log: { 1: 'active' } },
          cells: { log: ['"Keys tell React which element is which across renders."', '"Without one it diffs by position, so it reuses the fiber and the state of whatever was at that index."'] },
          vars: { 'reads as': 'someone who has debugged it' },
        },
        {
          note: 'Then the caveat — the case where the simple rule breaks. Volunteering it is what makes the answer senior.',
          cursors: { shape: { now: 'the caveat' } },
          marks: { log: { 2: 'hit' } },
          cells: { log: ['"Keys tell React which element is which across renders."', '"Without one it diffs by position, so it reuses the fiber and the state of whatever was at that index."', '"Index keys are fine for a static list — the bug only appears when it reorders or you delete from the front."'] },
          vars: { 'reads as': 'someone who has shipped it' },
        },
        {
          note: 'Three sentences, then stop. Rapid-fire rounds reward the person who stops — it leaves room for the follow-up, which is where the real signal is.',
          cursors: { shape: { now: 'the caveat' } },
          marks: { log: { '0-2': 'hit' } },
          cells: { log: ['claim → mechanism → caveat → stop'] },
          vars: { 'reads as': 'someone who listens' },
        },
        {
          note: 'And if you do not know: say so, then say what you would check. "I would look at whether it re-runs on every render in the Profiler" beats a confident guess every time.',
          cursors: { shape: { now: 'the claim' } },
          marks: { log: { 0: 'window' } },
          cells: { log: ['"I do not know — here is how I would find out."'] },
          vars: { 'reads as': 'honest, and employable' },
        },
      ],
      result: 'Claim, mechanism, caveat — then stop',
    },
  },

  /* ── 39 · Cheat sheet ──────────────────────────────────────────── */
  39: {
    diagram: 'guide_map',
    alt: 'The cheat sheet as a map of the guide',
  },
  },
  'advanced-react': {
  /* ── 1 · Intro to re-renders ───────────────────────────────────── */
  1: {
    diagram: 'rerender_triggers',
    alt: 'What actually triggers a re-render',
    after: '## The myth',
    trace: {
      input: 'App holds `open`; <VerySlowComponent/> takes no props',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App · useState(open)' },
            { id: 'btn', label: 'button', parent: 'app' },
            { id: 'slow', label: 'VerySlowComponent', parent: 'app' },
            { id: 'other', label: 'AnotherSlowThing', parent: 'app' },
          ],
        },
      ],
      vars: ['open', 'what re-rendered'],
      steps: [
        {
          note: 'The Open button is clicked. `setOpen(true)` runs in App — the state that changed lives there and nowhere else.',
          cursors: { tree: { at: 'app' } },
          marks: { tree: { app: 'active' } },
          vars: { open: 'false → true', 'what re-rendered': 'nothing yet' },
        },
        {
          note: 'React re-renders App and then everything below it. `VerySlowComponent` re-renders — and it has no props at all, so "its props changed" cannot be the explanation.',
          marks: { tree: { app: 'done', btn: 'bad', slow: 'bad', other: 'bad' } },
          vars: { open: 'true', 'what re-rendered': 'the whole subtree' },
        },
        {
          note: 'Fix 1 — move the state down. Extract the button and its `open` state into their own component; now the state change is contained there.',
          marks: { tree: { app: 'skip', btn: 'active', slow: 'skip', other: 'skip' } },
          vars: { open: 'true, owned by <OpenButton>', 'what re-rendered': 'OpenButton only  ✓' },
        },
        {
          note: 'Fix 2 — children as props. Keep the state in App but have the slow components arrive as `children`, created by a component above.',
          marks: { tree: { app: 'active', slow: 'skip', other: 'skip' } },
          vars: { open: 'true', 'what re-rendered': 'App, then bail out on children  ✓' },
        },
        {
          note: 'The custom-hook trap: hiding the `useState` in a `useModal()` hook changes nothing. The state still lives in whatever component calls the hook, so App still re-renders.',
          marks: { tree: { app: 'bad', slow: 'bad', other: 'bad' } },
          vars: { open: 'true, via useModal()', 'what re-rendered': 'the whole subtree — again' },
        },
      ],
      result: 'The subtree below the state, not the components whose props changed',
    },
  },

  /* ── 2 · Elements, children as props ───────────────────────────── */
  2: {
    diagram: 'composition_over_memo',
    alt: 'An element made above cannot be re-created by state below',
    after: '## The bail-out rule',
    trace: {
      input: '<ScrollContainer><VerySlowComponent/></ScrollContainer>',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App · no state' },
            { id: 'sc', label: 'ScrollContainer · useState(pos)', parent: 'app' },
            { id: 'slow', label: '{children} → VerySlowComponent', parent: 'sc' },
          ],
        },
        { id: 'refs', label: 'element', kind: 'slots', slots: ['children prop'] },
      ],
      vars: ['pos', 'Object.is(prev, next)'],
      steps: [
        {
          note: 'App renders once and creates the `<VerySlowComponent/>` element — object el#1 — passing it into ScrollContainer as `children`.',
          marks: { tree: { app: 'active' } },
          cells: { refs: ['el#1'] },
          vars: { pos: '0', 'Object.is(prev, next)': 'n/a — first render' },
        },
        {
          note: 'The user scrolls. `setPos` fires inside ScrollContainer, which re-renders — but App does **not**, because nothing above changed.',
          cursors: { tree: { at: 'sc' } },
          marks: { tree: { app: 'skip', sc: 'active' } },
          cells: { refs: ['el#1'] },
          vars: { pos: '0 → 120', 'Object.is(prev, next)': 'about to run' },
        },
        {
          note: 'So `props.children` is the *same object* App made — nobody re-ran the code that creates it.',
          marks: { tree: { sc: 'active' } },
          cells: { refs: ['el#1  (unchanged)'] },
          vars: { pos: '120', 'Object.is(prev, next)': 'true' },
        },
        {
          note: 'React compares the element it got with the one it has, sees the same reference, and bails out of that subtree. This is the bail-out rule doing exactly what `memo` would have done — with no API.',
          marks: { tree: { sc: 'done', slow: 'skip' } },
          cells: { refs: ['el#1'] },
          vars: { pos: '120', 'Object.is(prev, next)': 'true → skip subtree' },
        },
        {
          note: 'The limit: this only works while the child does not need the state. The moment `VerySlowComponent` wants `pos`, it has to re-render — and then you are back to memoisation or moving the boundary.',
          marks: { tree: { slow: 'bad' } },
          cells: { refs: ['el#2 — pos is now a prop'] },
          vars: { pos: '120', 'Object.is(prev, next)': 'false' },
        },
      ],
      result: 'Created above, so unaffected by state below',
    },
  },

  /* ── 3 · Elements as props ─────────────────────────────────────── */
  3: {
    diagram: 'composition_over_memo',
    alt: 'Elements as props for configuration',
    after: '## The pattern',
    trace: {
      input: '<Layout header={<Header/>} sidebar={<Nav/>}>{page}</Layout>',
      lanes: [
        { id: 'slots', label: 'props', kind: 'slots', slots: ['header', 'sidebar', 'children'] },
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'app', label: 'App · creates all three' },
            { id: 'layout', label: 'Layout · useState(collapsed)', parent: 'app' },
          ],
        },
      ],
      vars: ['collapsed', 'elements rebuilt'],
      steps: [
        {
          note: 'App creates three elements and hands them over. Layout has no idea what is in them — it only decides where they go.',
          marks: { tree: { app: 'active' }, slots: { header: 'active', sidebar: 'active', children: 'active' } },
          cells: { slots: ['el#1', 'el#2', 'el#3'] },
          vars: { collapsed: 'false', 'elements rebuilt': 'all three, once' },
        },
        {
          note: 'The collapse button toggles `collapsed`. Layout re-renders — App does not.',
          cursors: { tree: { at: 'layout' } },
          marks: { tree: { app: 'skip', layout: 'active' } },
          cells: { slots: ['el#1', 'el#2', 'el#3'] },
          vars: { collapsed: 'true', 'elements rebuilt': 'none  ✓' },
        },
        {
          note: 'Every prop is still the same object, so `Header` and `Nav` bail out even though the layout around them changed completely.',
          marks: { slots: { header: 'skip', sidebar: 'skip', children: 'skip' } },
          cells: { slots: ['el#1', 'el#2', 'el#3'] },
          vars: { collapsed: 'true', 'elements rebuilt': 'none' },
        },
        {
          note: 'And `{!collapsed && <aside>{sidebar}</aside>}` is free. Not rendering an element you already hold costs nothing — you are choosing whether to mount an object, not whether to build one.',
          marks: { slots: { sidebar: 'window' } },
          cells: { slots: ['el#1', 'not mounted', 'el#3'] },
          vars: { collapsed: 'true', 'elements rebuilt': 'none' },
        },
        {
          note: 'Why this beats a config object: `header={{ title, icon, onClose }}` forces Layout to know every possible option and rebuild that object each render. An element is one opaque value the caller already owns.',
          marks: { slots: { header: 'hit' } },
          cells: { slots: ['el#1', 'el#2', 'el#3'] },
          vars: { collapsed: 'true', 'elements rebuilt': 'none' },
        },
      ],
      result: 'Configuration the caller owns, with the bail-out for free',
    },
  },

  /* ── 4 · Render props ──────────────────────────────────────────── */
  4: {
    diagram: 'composition_over_memo',
    alt: 'A render prop when the child needs the parent\'s state',
    after: '## The two problems elements-as-props can\'t solve',
    trace: {
      input: 'A resize detector that has to hand its width to whatever it wraps',
      lanes: [
        { id: 'who', label: 'owns', kind: 'slots', slots: ['the width', 'the markup'] },
        { id: 'log', label: 'sequence', kind: 'log' },
      ],
      vars: ['width', 'can an element prop do this?'],
      steps: [
        {
          note: 'An element prop is created by the caller *before* the parent has any state, so it cannot contain the width. That is the first thing elements-as-props cannot do.',
          marks: { who: { 'the width': 'active' } },
          cells: { who: ['ResizeDetector', 'the caller'], log: ['<ResizeDetector content={<Chart width={???}/>}/>'] },
          vars: { width: 'unknown at creation time', 'can an element prop do this?': '**no**' },
        },
        {
          note: '`cloneElement` is the old workaround — inject the prop from inside. It works and it is opaque: nothing at the call site says the element will be modified.',
          marks: { who: { 'the width': 'window' } },
          cells: { who: ['ResizeDetector', 'the caller'], log: ['<ResizeDetector content={<Chart width={???}/>}/>', 'cloneElement(content, { width })  — invisible to the reader'] },
          vars: { width: '820', 'can an element prop do this?': 'only by rewriting it' },
        },
        {
          note: 'Pass a function instead. Now the caller receives the width as an argument and decides what to build with it — explicit at the call site, no cloning.',
          marks: { who: { 'the markup': 'hit' } },
          cells: { who: ['ResizeDetector', 'the caller'], log: ['<ResizeDetector>{(width) => <Chart width={width}/>}</ResizeDetector>'] },
          vars: { width: '820', 'can an element prop do this?': 'a function can' },
        },
        {
          note: 'The cost: the element is now built *inside* the parent\'s render, so it is a new object every time and the bail-out from the previous pattern is gone.',
          marks: { who: { 'the markup': 'bad' } },
          cells: { who: ['ResizeDetector', 'the caller'], log: ['every render → children(width) → a new element'] },
          vars: { width: '820', 'can an element prop do this?': 'n/a — you gave up the bail-out' },
        },
        {
          note: 'So the decision rule is narrow: a hook for sharing stateful logic, elements-as-props for configuration, and a render prop only when the child needs state the parent owns *and* the tree position matters.',
          marks: { who: { 'the width': 'skip', 'the markup': 'skip' } },
          cells: { who: ['a hook, usually', 'the caller'], log: ['const width = useResize(ref)  — no wrapper at all'] },
          vars: { width: '820', 'can an element prop do this?': 'the hook makes the question moot' },
        },
      ],
      result: 'Explicit, but you trade away the bail-out',
    },
  },

  /* ── 5 · Mastering memoization ─────────────────────────────────── */
  5: {
    diagram: 'memo_reference_trap',
    alt: 'The broken-memoization gallery',
    after: '## Under the hood: the useMemo-vs-useCallback myth',
    trace: {
      input: 'memo(Child) with four different props, one at a time',
      lanes: [
        { id: 'prop', label: 'the prop', kind: 'slots', slots: ['value passed'] },
        { id: 'log', label: 'verdict', kind: 'log' },
      ],
      vars: ['Object.is', 'Child re-renders?'],
      steps: [
        {
          note: 'First, the myth. `useCallback(() => submit(data), [])` still *creates* the arrow on every render — the allocation happens either way. What it caches is which one you get back.',
          marks: { prop: { 'value passed': 'window' } },
          cells: { prop: ['the arrow is built every render'], log: ['useCallback does not stop the allocation'] },
          vars: { 'Object.is': 'n/a', 'Child re-renders?': 'n/a' },
        },
        {
          note: 'Gallery item one: `style={{ margin: 0 }}`. A new object literal, so the shallow compare fails and memo does nothing but add a comparison.',
          marks: { prop: { 'value passed': 'bad' } },
          cells: { prop: ['{ margin: 0 }  — obj#2'], log: ['useCallback does not stop the allocation', 'inline object → memo defeated'] },
          vars: { 'Object.is': 'false', 'Child re-renders?': 'yes — wasted' },
        },
        {
          note: 'Item two: `items={data.filter(f)}`. Same story — a new array, every render.',
          marks: { prop: { 'value passed': 'bad' } },
          cells: { prop: ['[…]  — arr#2'], log: ['useCallback does not stop the allocation', 'inline object → memo defeated', 'inline array → memo defeated'] },
          vars: { 'Object.is': 'false', 'Child re-renders?': 'yes — wasted' },
        },
        {
          note: 'Item three, the subtle one: `<Child icon={<Icon/>}/>`. JSX is an object too, so an element prop breaks a memo exactly the way an object does.',
          marks: { prop: { 'value passed': 'bad' } },
          cells: { prop: ['<Icon/>  — el#2'], log: ['useCallback does not stop the allocation', 'inline object → memo defeated', 'inline array → memo defeated', 'element prop → memo defeated'] },
          vars: { 'Object.is': 'false', 'Child re-renders?': 'yes — wasted' },
        },
        {
          note: 'Item four: `children`. A memo on a component that takes children is almost always useless, because children is a fresh element every render. And note the real lesson — "expensive calculations" are rarely the problem; wasted re-renders are.',
          marks: { prop: { 'value passed': 'bad' } },
          cells: { prop: ['children  — el#2'], log: ['memo(Wrapper) with children → never bails out'] },
          vars: { 'Object.is': 'false', 'Child re-renders?': 'yes — every time' },
        },
      ],
      result: 'All props must be stable, or none of them help',
    },
  },

  /* ── 6 · Diffing, reconciliation, keys ─────────────────────────── */
  6: {
    diagram: 'reconciliation_keys',
    alt: 'Diff by position, then by type',
    after: '## Why: the diff compares by position, then by type',
    trace: {
      input: '{isBusiness ? <Input id="business"/> : <Input id="personal"/>}',
      lanes: [
        { id: 'pos', label: 'position 2', kind: 'slots', slots: ['type', 'DOM node', 'typed value'] },
        { id: 'log', label: 'what React did', kind: 'log' },
      ],
      vars: ['isBusiness'],
      steps: [
        {
          note: 'The user types "12345" into the personal tax ID field. Uncontrolled, so the value lives in the DOM node.',
          marks: { pos: { 'typed value': 'active' } },
          cells: { pos: ['Input', 'node#1', '"12345"'], log: [] },
          vars: { isBusiness: 'false' },
        },
        {
          note: 'They tick the checkbox. The ternary now returns the other branch — a different `id`, a different placeholder, but the **same position and the same type**.',
          marks: { pos: { type: 'window' } },
          cells: { pos: ['Input', 'node#1', '"12345"'], log: ['position 2: Input → Input, same type'] },
          vars: { isBusiness: 'true' },
        },
        {
          note: 'So React reuses the fiber and the DOM node, and only updates the props that differ. The typed text is still sitting in that node.',
          marks: { pos: { 'DOM node': 'bad', 'typed value': 'bad' } },
          cells: { pos: ['Input', 'node#1  (reused)', '"12345"  ← still there'], log: ['position 2: Input → Input, same type', 'reuse the fiber, update id + placeholder'] },
          vars: { isBusiness: 'true' },
        },
        {
          note: 'Fix 1 — change the position, not the type. Render both branches as siblings and hide one; now they occupy different positions and never share a fiber.',
          marks: { pos: { 'DOM node': 'hit' } },
          cells: { pos: ['Input', 'node#2  (its own)', '""'], log: ['two siblings → two positions → two fibers'] },
          vars: { isBusiness: 'true' },
        },
        {
          note: 'Fix 2 — different keys. A key is an identity claim, so `key="business"` and `key="personal"` tell React these are not the same element even at the same position. Same mechanism as `key={userId}` to reset a form.',
          marks: { pos: { type: 'hit', 'DOM node': 'hit', 'typed value': 'hit' } },
          cells: { pos: ['Input key="business"', 'node#3  (fresh)', '""'], log: ['different key → unmount + mount → clean state'] },
          vars: { isBusiness: 'true' },
        },
      ],
      result: 'Same position + same type = same component, whatever you named it',
    },
  },

  /* ── 7 · HOCs in the modern world ──────────────────────────────── */
  7: {
    diagram: 'composition_over_memo',
    alt: 'What a HOC still does that a hook cannot',
    after: '## Writing one correctly',
    trace: {
      input: 'withTheme(Button), and the two ways to get it wrong',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'page', label: 'Page' },
            { id: 'wrap', label: 'WithTheme', parent: 'page' },
            { id: 'btn', label: 'Button · state: "pressed"', parent: 'wrap' },
          ],
        },
      ],
      vars: ['Button identity', 'state survives?'],
      steps: [
        {
          note: '`const ThemedButton = withTheme(Button)` at module scope. The wrapper component is created once, so its type is stable for the life of the app.',
          marks: { tree: { wrap: 'hit', btn: 'hit' } },
          vars: { 'Button identity': 'stable', 'state survives?': 'yes' },
        },
        {
          note: 'Mistake one — calling `withTheme(Button)` inside a render. Every render produces a new component *type*, so the diff sees a different type at that position.',
          cursors: { tree: { at: 'wrap' } },
          marks: { tree: { wrap: 'bad' } },
          vars: { 'Button identity': 'new every render', 'state survives?': 'no' },
        },
        {
          note: 'React unmounts the whole subtree and mounts it again. Every render. State, DOM nodes, focus and scroll position all gone — the rule that bites hardest.',
          marks: { tree: { wrap: 'bad', btn: 'bad' } },
          vars: { 'Button identity': 'new every render', 'state survives?': '**no** — remounted every time' },
        },
        {
          note: 'Mistake two — prop collision. `withTheme` injects `theme`, and the caller also passes `theme`. Whichever spread comes last silently wins, and nothing warns you.',
          marks: { tree: { wrap: 'window', btn: 'bad' } },
          vars: { 'Button identity': 'stable', 'state survives?': 'yes — but the wrong theme renders' },
        },
        {
          note: 'Where a HOC still earns its keep: intercepting props or DOM events before the component sees them — `onClick` logging, a keypress handler that must run first. A hook runs *inside* the component and cannot get in front of it.',
          marks: { tree: { wrap: 'hit', btn: 'skip' } },
          vars: { 'Button identity': 'stable', 'state survives?': 'yes' },
        },
      ],
      result: 'Build it at module scope, and spread the caller\'s props last',
    },
  },

  /* ── 8 · Context and performance ───────────────────────────────── */
  8: {
    diagram: 'context_propagation',
    alt: 'memo cannot stop a context re-render',
    after: '## Addition 1: `React.memo` does not stop a context re-render',
    trace: {
      input: 'const Child = React.memo(() => { const { theme } = useContext(Ctx); … })',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'prov', label: 'Ctx.Provider' },
            { id: 'mid', label: 'Middle · no context', parent: 'prov' },
            { id: 'child', label: 'memo(Child) · useContext', parent: 'mid' },
          ],
        },
      ],
      vars: ['props changed?', 'context changed?', 'renders?'],
      steps: [
        {
          note: 'The provider value changes. `Middle` takes no props from it and is not a consumer.',
          cursors: { tree: { at: 'prov' } },
          marks: { tree: { prov: 'active' } },
          vars: { 'props changed?': 'no', 'context changed?': 'yes', 'renders?': 'deciding' },
        },
        {
          note: '`memo(Child)` compares props — identical, so the memo check passes. Everyone expects the bail-out here.',
          cursors: { tree: { at: 'child' } },
          marks: { tree: { mid: 'done', child: 'skip' } },
          vars: { 'props changed?': 'no', 'context changed?': 'yes', 'renders?': 'not from props' },
        },
        {
          note: 'It re-renders anyway. A `useContext` call is a **separate subscription**, checked after the memo check — and it wins. `memo` only ever guards the props path.',
          marks: { tree: { child: 'bad' } },
          vars: { 'props changed?': 'no', 'context changed?': 'yes', 'renders?': '**yes** — via the subscription' },
        },
        {
          note: 'Addition 2 — a selector on top of context. Split the value, or wrap consumers so each reads a narrow slice and re-renders only for it.',
          marks: { tree: { child: 'skip' } },
          vars: { 'props changed?': 'no', 'context changed?': 'a slice this child ignores', 'renders?': 'no  ✓' },
        },
        {
          note: 'Addition 3 — when to stop. Once you are hand-rolling selectors and splitting providers three ways, a store with real selector subscriptions (Zustand, Redux) is the smaller thing to maintain.',
          marks: { tree: { prov: 'window' } },
          vars: { 'props changed?': 'no', 'context changed?': 'n/a — a store now', 'renders?': 'only the subscribers' },
        },
      ],
      result: 'Two paths in; memo guards one of them',
    },
  },

  /* ── 9 · Refs ──────────────────────────────────────────────────── */
  9: {
    diagram: 'refs_escape_hatch',
    alt: 'A ref is the same object on every render',
    after: '## What a ref actually is',
    trace: {
      input: 'const ref = useRef(0) — the same { current } object, every render',
      lanes: [
        { id: 'box', label: 'the box', kind: 'slots', slots: ['identity', 'current'] },
        { id: 'log', label: 'renders', kind: 'log' },
      ],
      vars: ['re-render scheduled?'],
      steps: [
        {
          note: 'Mount. `useRef(0)` creates `{ current: 0 }` and stores it in the component\'s hook slot.',
          marks: { box: { identity: 'active' } },
          cells: { box: ['obj#1', '0'], log: ['render 1'] },
          vars: { 're-render scheduled?': 'no' },
        },
        {
          note: 'Render 2 for any reason. `useRef` returns **the identical object** — that stable identity is the whole feature, and why a ref can hold a timer id safely.',
          marks: { box: { identity: 'hit' } },
          cells: { box: ['obj#1  (same)', '0'], log: ['render 1', 'render 2'] },
          vars: { 're-render scheduled?': 'no' },
        },
        {
          note: 'Write to it in an event handler: `ref.current = 5`. Nothing is scheduled. React was never told.',
          marks: { box: { current: 'active' } },
          cells: { box: ['obj#1', '5'], log: ['render 1', 'render 2'] },
          vars: { 're-render scheduled?': 'no — that is the point' },
        },
        {
          note: 'Which is also why a ref cannot be a dependency. The array is compared on render, and `obj#1` is always `obj#1` — mutating `.current` does not change the object, so the effect never re-runs.',
          marks: { box: { identity: 'bad' } },
          cells: { box: ['obj#1  — never changes', '5'], log: ['render 1', 'render 2', 'useEffect(fn, [ref]) → never re-runs'] },
          vars: { 're-render scheduled?': 'no' },
        },
        {
          note: 'A callback ref is the version that *does* notify you: React calls your function with the node on attach and with null on detach — which is how you measure an element that may not exist yet.',
          marks: { box: { current: 'hit' } },
          cells: { box: ['obj#1', '<div> attached'], log: ['ref={node => node && measure(node)}'] },
          vars: { 're-render scheduled?': 'only if you call setState in it' },
        },
      ],
      result: 'Stable identity, invisible mutation',
    },
  },

  /* ── 10 · Closures in React ────────────────────────────────────── */
  10: {
    diagram: 'stale_closure',
    alt: 'The stale closure and the ref escape hatch',
    after: '## Why those two aren\'t always enough',
    trace: {
      input: 'An interval that must both log `count` and call a changing `onTick`',
      lanes: [
        { id: 'held', label: 'captured', kind: 'slots', slots: ['count', 'onTick'] },
        { id: 'log', label: 'ticks', kind: 'log' },
      ],
      vars: ['fix in play', 'interval recreated?'],
      steps: [
        {
          note: 'Deps `[]`. The callback holds render one\'s `count` — 0 — forever. Both the log and the setState are wrong.',
          marks: { held: { count: 'bad' } },
          cells: { held: ['0  (render 1)', 'fn#1'], log: ['log 0 · setCount(0 + 1)', 'log 0 · setCount(0 + 1)'] },
          vars: { 'fix in play': 'none', 'interval recreated?': 'no' },
        },
        {
          note: 'Fix A — the updater form. `setCount(c => c + 1)` stops reading the closure, so the counter advances. But `console.log(count)` still prints 0: the updater only fixes the setState.',
          marks: { held: { count: 'window' } },
          cells: { held: ['0  (render 1)', 'fn#1'], log: ['log 0 · setCount(c => c+1) → 1', 'log 0 · setCount(c => c+1) → 2'] },
          vars: { 'fix in play': 'updater', 'interval recreated?': 'no' },
        },
        {
          note: 'Fix B — put `count` in the deps. Now the value is fresh, but the effect tears down and recreates the interval **every second**, which resets the timer and loses any internal state it had.',
          marks: { held: { count: 'hit', onTick: 'bad' } },
          cells: { held: ['current', 'fn#2, fn#3, …'], log: ['clearInterval + setInterval, every tick'] },
          vars: { 'fix in play': 'deps', 'interval recreated?': 'yes — every second' },
        },
        {
          note: 'Hence the escape hatch: keep the interval set up once, and store the *latest callback* in a ref updated on every render. The ref has stable identity, so the effect never re-runs.',
          marks: { held: { onTick: 'hit' } },
          cells: { held: ['read via ref', 'ref.current = latest'], log: ['useEffect(() => { ref.current = onTick })', 'interval calls ref.current() — always fresh'] },
          vars: { 'fix in play': 'latest-value ref', 'interval recreated?': 'no  ✓' },
        },
        {
          note: 'When *not* to use it: anything rendered from this value. The ref is invisible to rendering, so a component reading `ref.current` during render will show a stale frame — this pattern is for callbacks only.',
          marks: { held: { onTick: 'window' } },
          cells: { held: ['—', 'ref.current'], log: ['do not read a latest-ref during render'] },
          vars: { 'fix in play': 'latest-value ref', 'interval recreated?': 'no' },
        },
      ],
      result: 'Stable effect, fresh callback',
    },
  },

  /* ── 11 · Debouncing and throttling ────────────────────────────── */
  11: {
    diagram: 'refs_escape_hatch',
    alt: 'Keeping a debounced function alive across renders',
    after: '## The bug',
    trace: {
      input: 'const debouncedSearch = debounce(v => onSearch(v), 500) in the component body',
      lanes: [
        { id: 'fn', label: 'debounced fn', kind: 'slots', slots: ['identity', 'pending timer'] },
        { id: 'log', label: 'calls to onSearch', kind: 'log' },
      ],
      vars: ['keystrokes', 'fix in play'],
      steps: [
        {
          note: 'The user types "r". `onChange` fires, the debounced function schedules a call in 500 ms — and `setState` on the input re-renders the component.',
          marks: { fn: { identity: 'active' } },
          cells: { fn: ['fn#1', 'armed, 500 ms'], log: [] },
          vars: { keystrokes: '1', 'fix in play': 'none' },
        },
        {
          note: 'The re-render runs `debounce(...)` again, producing a **brand-new** debounced function with its own empty timer. The old one still fires — nothing cancelled it.',
          marks: { fn: { identity: 'bad' } },
          cells: { fn: ['fn#2  (fn#1 orphaned)', 'armed, 500 ms'], log: [] },
          vars: { keystrokes: '2', 'fix in play': 'none' },
        },
        {
          note: 'So every keystroke gets its own debouncer, and every one of them fires. Debouncing five characters produced five requests — the exact thing it was added to prevent.',
          marks: { fn: { identity: 'bad' } },
          cells: { fn: ['fn#5', 'five separate timers'], log: ['onSearch("r")', 'onSearch("re")', 'onSearch("rea")', 'onSearch("reac")', 'onSearch("react")'] },
          vars: { keystrokes: '5', 'fix in play': 'none' },
        },
        {
          note: 'Fix 1 — `useMemo(() => debounce(...), [])`. One function for the life of the component, so each keystroke resets the same timer. But it captures the first `onSearch`, so a changing callback goes stale.',
          marks: { fn: { identity: 'window' } },
          cells: { fn: ['fn#1  (cached)', 'one timer, reset'], log: ['onSearch("react")  — once  ✓'] },
          vars: { keystrokes: '5', 'fix in play': 'useMemo' },
        },
        {
          note: 'Fix 2 — the same `useMemo`, plus a ref holding the latest `onSearch`. Stable debouncer, fresh callback. And write the cleanup nobody writes: `debounced.cancel()` on unmount, or a late timer calls into a component that is gone.',
          marks: { fn: { identity: 'hit', 'pending timer': 'hit' } },
          cells: { fn: ['fn#1  (cached)', 'cancelled on unmount'], log: ['onSearch("react")  — once, with the latest callback  ✓'] },
          vars: { keystrokes: '5', 'fix in play': 'useMemo + latest ref + cancel' },
        },
      ],
      result: 'The debouncer must outlive the render that made it',
    },
  },

  /* ── 12 · useLayoutEffect and flicker ──────────────────────────── */
  12: {
    diagram: 'render_commit_effects',
    alt: 'Measuring before paint',
    after: '## The flicker',
    trace: {
      input: 'A tooltip that measures its anchor, then flips above if there is no room below',
      lanes: [
        { id: 'phase', label: 'phase', kind: 'phases', of: ['render', 'commit', 'layout effect', 'paint'] },
        { id: 'seen', label: 'frames', kind: 'log' },
      ],
      vars: ['position', 'frames the user saw'],
      steps: [
        {
          note: 'The tooltip renders at its default position. It has to be in the DOM before it can be measured — there is no measuring an element that does not exist.',
          cursors: { phase: { now: 'render' } },
          cells: { seen: [] },
          vars: { position: 'top 0, left 0', 'frames the user saw': '0' },
        },
        {
          note: 'Commit puts it there. With `useEffect`, the browser would paint **now** — one frame of a tooltip in the corner.',
          cursors: { phase: { now: 'commit' } },
          marks: { seen: { 0: 'bad' } },
          cells: { seen: ['— with useEffect: frame at 0,0 —'] },
          vars: { position: 'top 0, left 0', 'frames the user saw': '1 wrong one' },
        },
        {
          note: '`useLayoutEffect` runs here instead, synchronously, before the browser gets its turn. It reads both rectangles and decides to flip above the anchor.',
          cursors: { phase: { now: 'layout effect' } },
          marks: { phase: { 'layout effect': 'hit' } },
          cells: { seen: ['— with useEffect: frame at 0,0 —'] },
          vars: { position: 'measured → flip above', 'frames the user saw': '0' },
        },
        {
          note: '`setPosition` inside a layout effect re-renders and re-commits synchronously, still before paint. The intermediate position is never given to the compositor.',
          cursors: { phase: { now: 'commit' } },
          marks: { phase: { 'layout effect': 'hit' } },
          cells: { seen: ['— with useEffect: frame at 0,0 —'] },
          vars: { position: 'top 40, left 240', 'frames the user saw': '0' },
        },
        {
          note: 'Paint, once, correct. The cost: the browser waited for your measurement, so keep the work small. And on the server there is no layout at all — `useLayoutEffect` does not run, so SSR needs a sensible first-paint position or a mount guard.',
          cursors: { phase: { now: 'paint' } },
          marks: { phase: { paint: 'hit' }, seen: { 1: 'hit' } },
          cells: { seen: ['— with useEffect: frame at 0,0 —', 'with useLayoutEffect: one frame, correct  ✓'] },
          vars: { position: 'top 40, left 240', 'frames the user saw': '1 correct one' },
        },
      ],
      result: 'Measure and correct inside the same frame',
    },
  },

  /* ── 13 · Portals ──────────────────────────────────────────────── */
  13: {
    diagram: 'portals_stacking',
    alt: 'Escaping overflow and stacking contexts',
    after: '## Why the usual fixes fail',
    trace: {
      input: 'A dropdown inside <div style={{ overflow: "hidden" }}>',
      lanes: [
        { id: 'try', label: 'attempt', kind: 'slots', slots: ['what you changed', 'result'] },
        { id: 'log', label: 'why', kind: 'log' },
      ],
      vars: ['dropdown visible?'],
      steps: [
        {
          note: 'The menu is clipped. It renders fine, it is just cut off at the ancestor\'s box.',
          marks: { try: { result: 'bad' } },
          cells: { try: ['nothing yet', 'clipped'], log: ['overflow: hidden on an ancestor clips descendants'] },
          vars: { 'dropdown visible?': 'half of it' },
        },
        {
          note: 'First instinct: `z-index: 9999`. No effect — z-index orders things within a stacking context and does nothing about clipping.',
          marks: { try: { result: 'bad' } },
          cells: { try: ['z-index: 9999', 'still clipped'], log: ['overflow: hidden on an ancestor clips descendants', 'z-index orders, it does not un-clip'] },
          vars: { 'dropdown visible?': 'half of it' },
        },
        {
          note: 'Next: `position: fixed`. Usually works — unless an ancestor has a `transform`, `filter` or `will-change`, which makes it the containing block and fixed positioning is measured against *it*.',
          marks: { try: { result: 'bad' } },
          cells: { try: ['position: fixed', 'works… until a transform'], log: ['overflow: hidden on an ancestor clips descendants', 'z-index orders, it does not un-clip', 'transform on an ancestor captures position: fixed'] },
          vars: { 'dropdown visible?': 'depends on a parent you do not control' },
        },
        {
          note: 'A portal sidesteps all of it by moving the node out of that ancestor entirely — appended to `body` or a dedicated root, where no ancestor clips or contains it.',
          marks: { try: { result: 'hit' } },
          cells: { try: ['createPortal(…, document.body)', 'visible  ✓'], log: ['the node is no longer inside the clipping ancestor'] },
          vars: { 'dropdown visible?': 'yes' },
        },
        {
          note: 'What a portal does **not** do for you: focus management, closing on Escape, click-outside, or the tab order. The node moved in the DOM, so its tab position moved with it — and events still bubble through the React tree, not the new DOM position.',
          marks: { try: { result: 'window' } },
          cells: { try: ['createPortal', 'visible, but not accessible yet'], log: ['still to write: focus trap, Escape, click-outside, aria'] },
          vars: { 'dropdown visible?': 'yes — and unusable by keyboard' },
        },
      ],
      result: 'Solves clipping; everything else is still yours',
    },
  },

  /* ── 14 · Request waterfalls ───────────────────────────────────── */
  14: {
    diagram: 'fetch_waterfalls',
    alt: 'Serial versus parallel requests',
    after: '## Waterfall 1: nested components each fetching',
    trace: {
      input: 'useUser() → usePermissions(user) → useProjects(user)',
      lanes: [
        { id: 'req', label: 'in flight', kind: 'slots', slots: ['user', 'permissions', 'projects'] },
        { id: 'log', label: 'timeline', kind: 'log' },
      ],
      vars: ['elapsed', 'network busy?'],
      steps: [
        {
          note: '`useUser()` starts immediately. The other two take `user` as an argument, so they cannot begin — they are waiting on a value, not on the network.',
          marks: { req: { user: 'active' } },
          cells: { req: ['fetching', 'blocked', 'blocked'], log: ['0 ms — GET /user'] },
          vars: { elapsed: '0 ms', 'network busy?': 'one request' },
        },
        {
          note: 'User arrives at 200 ms. Only now do the other two start — and they are independent of each other, so at least they overlap.',
          marks: { req: { user: 'done', permissions: 'active', projects: 'active' } },
          cells: { req: ['done', 'fetching', 'fetching'], log: ['0 ms — GET /user', '200 ms — GET /permissions, GET /projects'] },
          vars: { elapsed: '200 ms', 'network busy?': 'two requests' },
        },
        {
          note: 'Everything resolves at 380 ms. The network sat idle for the first 200, which is the shape of a waterfall: a staircase in the Network panel, not a block.',
          marks: { req: { permissions: 'bad', projects: 'bad' } },
          cells: { req: ['done', 'done', 'done'], log: ['0 ms — GET /user', '200 ms — GET /permissions, GET /projects', '380 ms — all done'] },
          vars: { elapsed: '380 ms', 'network busy?': 'idle half the time' },
        },
        {
          note: 'The real question is whether the dependency is genuine. If `/projects` only needs a user **id** that is already in the URL or a cookie, it never had to wait.',
          marks: { req: { projects: 'window' } },
          cells: { req: ['fetching', 'blocked', 'fetching'], log: ['0 ms — GET /user, GET /projects?userId=… together'] },
          vars: { elapsed: '0 ms', 'network busy?': 'two requests' },
        },
        {
          note: 'Hoist what has no real dependency and start it at the top; keep only the genuinely dependent call downstream. 380 ms becomes 200 — and the fix was reading the code, not adding a cache.',
          marks: { req: { user: 'hit', projects: 'hit' } },
          cells: { req: ['done', 'done', 'done'], log: ['0 ms — GET /user, GET /projects', '200 ms — GET /permissions (genuinely needs user.role)', '200 ms — first paint'] },
          vars: { elapsed: '200 ms  ✓', 'network busy?': 'throughout' },
        },
      ],
      result: 'A staircase is a waterfall; a block is not',
    },
  },

  /* ── 15 · Race conditions ──────────────────────────────────────── */
  15: {
    diagram: 'race_conditions',
    alt: 'The slow answer to the old question arrives last',
    after: '## The bug',
    trace: {
      input: 'query goes "re" → "react"; the first request is slower',
      lanes: [
        { id: 'flight', label: 'in flight', kind: 'slots', slots: ['"re"', '"react"'] },
        { id: 'log', label: 'setResults', kind: 'log' },
      ],
      vars: ['input shows', 'list shows'],
      steps: [
        {
          note: 'The effect fires for "re" and a request goes out. It will take 600 ms — a cold cache, a slow shard, it does not matter why.',
          marks: { flight: { '"re"': 'active' } },
          cells: { flight: ['600 ms', '—'], log: [] },
          vars: { 'input shows': '"re"', 'list shows': 'the old list' },
        },
        {
          note: 'The user keeps typing. `query` becomes "react", the effect re-runs, and a second request goes out — this one takes 150 ms.',
          marks: { flight: { '"re"': 'active', '"react"': 'active' } },
          cells: { flight: ['600 ms', '150 ms'], log: [] },
          vars: { 'input shows': '"react"', 'list shows': 'the old list' },
        },
        {
          note: '"react" lands first and sets the results. Everything looks right.',
          marks: { flight: { '"react"': 'hit' } },
          cells: { flight: ['600 ms', 'done'], log: ['setResults(react results)'] },
          vars: { 'input shows': '"react"', 'list shows': 'results for "react"  ✓' },
        },
        {
          note: 'Then "re" lands — and overwrites it. The box says "react" and the list shows results for "re". No error, no warning, and it only reproduces on a slow connection.',
          marks: { flight: { '"re"': 'bad' } },
          cells: { flight: ['done', 'done'], log: ['setResults(react results)', 'setResults(re results)  ← overwrites'] },
          vars: { 'input shows': '"react"', 'list shows': 'results for "re"  ✗' },
        },
        {
          note: 'Fix 1, the ignore flag, works because cleanup runs before the next effect: by the time the slow response lands, its `ignore` is already true. Fix 2, `AbortController`, also frees the connection. Fix 3 tracks the latest query string. Fix 4 is a query library, which is doing fix 2 and 3 for you.',
          marks: { flight: { '"re"': 'skip', '"react"': 'hit' } },
          cells: { flight: ['ignored / aborted', 'done'], log: ['setResults(react results)', '"re" response → ignored  ✓'] },
          vars: { 'input shows': '"react"', 'list shows': 'results for "react"  ✓' },
        },
      ],
      result: 'Last to arrive wins, unless you say otherwise',
    },
  },

  /* ── 16 · Universal error handling ─────────────────────────────── */
  16: {
    diagram: 'error_boundaries',
    alt: 'The layers of error handling you actually need',
    after: '## What they miss',
    trace: {
      input: 'Four errors thrown from four places in the same component',
      lanes: [
        { id: 'src', label: 'thrown from', kind: 'slots', slots: ['render', 'event handler', 'promise', 'the boundary itself'] },
        { id: 'log', label: 'caught by', kind: 'log' },
      ],
      vars: ['fallback shown?'],
      steps: [
        {
          note: 'During render. The boundary above catches it: `getDerivedStateFromError` sets the state, `componentDidCatch` reports it, and the fallback renders.',
          marks: { src: { render: 'hit' } },
          cells: { src: ['✓ caught', '—', '—', '—'], log: ['render → ErrorBoundary'] },
          vars: { 'fallback shown?': 'yes' },
        },
        {
          note: 'From an `onClick`. Rendering finished long ago, so no boundary is involved — the error reaches `window.onerror` and the UI carries on looking fine while doing nothing.',
          marks: { src: { 'event handler': 'bad' } },
          cells: { src: ['✓ caught', '✗ missed', '—', '—'], log: ['render → ErrorBoundary', 'onClick → window.onerror'] },
          vars: { 'fallback shown?': 'no' },
        },
        {
          note: 'From a rejected promise in an effect. Same story — async work escapes the render pass entirely.',
          marks: { src: { promise: 'bad' } },
          cells: { src: ['✓ caught', '✗ missed', '✗ missed', '—'], log: ['render → ErrorBoundary', 'onClick → window.onerror', '.then() → unhandledrejection'] },
          vars: { 'fallback shown?': 'no' },
        },
        {
          note: 'The bridge: catch it yourself and re-throw during render — `setError(e)` in the handler, then `if (error) throw error` in the body. Now the boundary sees it.',
          marks: { src: { 'event handler': 'hit', promise: 'hit' } },
          cells: { src: ['✓ caught', '✓ bridged', '✓ bridged', '—'], log: ['setError(e) → throw during render → ErrorBoundary'] },
          vars: { 'fallback shown?': 'yes' },
        },
        {
          note: 'And the one nothing catches: an error in the boundary\'s own render. It needs a boundary above it — which is why the layers are a root boundary, per-route boundaries, per-widget boundaries, plus `window.onerror` and `unhandledrejection` for everything outside React.',
          marks: { src: { 'the boundary itself': 'bad' } },
          cells: { src: ['✓', '✓', '✓', '✗ — needs a boundary above'], log: ['root · route · widget · window handlers'] },
          vars: { 'fallback shown?': 'only if something is above it' },
        },
      ],
      result: 'Boundaries for render, try/catch for everything else',
    },
  },
  },
  'react-learnings': {
  /* ── 1 · Collapsible list ──────────────────────────────────────── */
  1: {
    diagram: 'component_anatomy',
    alt: 'The four decisions in a machine-coding build',
    after: '## Mental model',
    trace: {
      input: 'A tree where expanding one node must not lose the others',
      lanes: [
        { id: 'state', label: 'state', kind: 'slots', slots: ['shape', 'expanded'] },
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'root', label: 'src' },
            { id: 'comp', label: 'components', parent: 'root' },
            { id: 'btn', label: 'Button.jsx', parent: 'comp' },
            { id: 'utils', label: 'utils', parent: 'root' },
          ],
        },
      ],
      vars: ['re-renders'],
      steps: [
        {
          note: 'The tempting shape: an `isOpen` boolean inside each `TreeNode`. It works — until you need "collapse all", or to restore state from a URL.',
          marks: { state: { shape: 'bad' } },
          cells: { state: ['one boolean per node', 'scattered'] },
          vars: { 're-renders': 'each node owns its own truth' },
        },
        {
          note: 'The shape that survives the follow-ups: one `Set` of open ids, owned by the list. Every node derives `isOpen` from it — one source of truth, nothing to keep in sync.',
          marks: { state: { shape: 'hit', expanded: 'active' } },
          cells: { state: ['Set<id>, owned by the list', '{ }'] },
          vars: { 're-renders': 'the list and its nodes' },
        },
        {
          note: 'Expanding `src` adds one id. `TreeNode` reads `expanded.has(node.id)` — derived, never copied into local state, so it cannot go stale.',
          cursors: { tree: { at: 'root' } },
          marks: { tree: { root: 'hit', comp: 'active', utils: 'active' }, state: { expanded: 'active' } },
          cells: { state: ['Set<id>, owned by the list', '{ src }'] },
          vars: { 're-renders': 'derived, so always correct' },
        },
        {
          note: 'Expanding `components` adds a second. "Collapse all" is now `setExpanded(new Set())` — one line, because the state was shaped for the question.',
          marks: { tree: { root: 'hit', comp: 'hit', btn: 'active' }, state: { expanded: 'hit' } },
          cells: { state: ['Set<id>, owned by the list', '{ src, components }'] },
          vars: { 're-renders': 'one setState, whole tree correct' },
        },
        {
          note: 'And the fourth decision, the one candidates skip: the toggle is a `<button>` with `aria-expanded`, and the container has `role="tree"`. A row that only answers a click is not finished.',
          marks: { tree: { btn: 'hit' } },
          cells: { state: ['Set<id>', '{ src, components }'] },
          vars: { 're-renders': 'keyboard and screen reader work too' },
        },
      ],
      result: 'One Set, derived everywhere, keyboard-operable',
    },
  },

  /* ── 2 · Reusable button ───────────────────────────────────────── */
  2: {
    diagram: 'component_anatomy',
    alt: 'Designing a component API',
    after: '## API design',
    trace: {
      input: '<Button variant="primary" size="md" onClick={…}>Save</Button>',
      lanes: [
        { id: 'api', label: 'the API', kind: 'slots', slots: ['props', 'class'] },
        { id: 'log', label: 'review', kind: 'log' },
      ],
      vars: ['new variant costs'],
      steps: [
        {
          note: 'The first instinct: a boolean per look — `primary`, `danger`, `ghost`. Three booleans mean eight combinations, and six of them are nonsense.',
          marks: { api: { props: 'bad' } },
          cells: { api: ['primary · danger · ghost', '?'], log: ['<Button primary danger /> — what now?'] },
          vars: { 'new variant costs': 'another boolean, twice the invalid states' },
        },
        {
          note: 'One `variant` prop instead. The states are mutually exclusive by construction, and TypeScript can enumerate them.',
          marks: { api: { props: 'hit' } },
          cells: { api: ['variant · size', '?'], log: ['<Button primary danger /> — what now?', 'variant: "primary" | "danger" | "ghost"'] },
          vars: { 'new variant costs': 'one union member' },
        },
        {
          note: 'Then the variant map — a lookup from value to class string, declared outside the component so it is not rebuilt on every render.',
          marks: { api: { class: 'active' } },
          cells: { api: ['variant · size', 'VARIANTS[variant]'], log: ['const VARIANTS = { primary: "…", danger: "…" }'] },
          vars: { 'new variant costs': 'one line in the map' },
        },
        {
          note: 'Spread the rest. `...rest` onto the `<button>` means `type`, `aria-label`, `disabled` and `data-*` all work without the component knowing about them.',
          marks: { api: { props: 'hit', class: 'hit' } },
          cells: { api: ['variant · size · ...rest', 'VARIANTS[variant]'], log: ['<button className={…} {...rest} />'] },
          vars: { 'new variant costs': 'nothing for HTML attributes' },
        },
        {
          note: 'And the detail interviewers look for: default `type="button"`. Without it a button inside a form submits it — a bug that reaches production more often than any styling mistake.',
          marks: { api: { props: 'hit' } },
          cells: { api: ['type="button" by default', 'VARIANTS[variant]'], log: ['no accidental form submits'] },
          vars: { 'new variant costs': 'nothing' },
        },
      ],
      result: 'A union, a map, a spread, and a sane default',
    },
  },

  /* ── 3 · Class lifecycle, hooks & reconciliation ───────────────── */
  3: {
    diagram: 'reconciliation_keys',
    alt: 'Reconciliation and effect order',
    after: '## Reconciliation',
    trace: {
      input: 'items.map((item, i) => <Row key={i} data={item} />) — then the first item is deleted',
      lanes: [
        { id: 'rows', label: 'rows', cells: ['Ada', 'Grace', 'Linus'], indices: true },
        { id: 'keys', label: 'keys', kind: 'log' },
      ],
      vars: ['key at position 0', 'Row state at position 0'],
      steps: [
        {
          note: 'Three rows, keyed by index. Each `Row` holds some local state — a checkbox, an inline edit, a scroll position.',
          marks: { rows: { '0-2': 'window' } },
          cells: { keys: ['0 → Ada', '1 → Grace', '2 → Linus'] },
          vars: { 'key at position 0': '0', 'Row state at position 0': 'Ada\'s' },
        },
        {
          note: 'Delete "Ada". The array shifts, so Grace is now at index 0 — and her key becomes 0, the key Ada had.',
          marks: { rows: { 0: 'bad' } },
          cells: { keys: ['0 → Grace', '1 → Linus'] },
          vars: { 'key at position 0': '0  (was Ada\'s)', 'Row state at position 0': 'Ada\'s — kept' },
        },
        {
          note: 'React compares position 0: same key, same type. So it **reuses** the fiber, updates the `data` prop, and keeps everything else — Grace now has Ada\'s checkbox state.',
          marks: { rows: { 0: 'bad', 1: 'bad' } },
          cells: { keys: ['0 → Grace  (Ada\'s fiber)', '1 → Linus  (Grace\'s fiber)'] },
          vars: { 'key at position 0': '0', 'Row state at position 0': '**Ada\'s** — on Grace\'s row' },
        },
        {
          note: 'With `key={item.id}` there is no position to confuse. React matches by key across the whole list, sees Ada\'s key is gone, and unmounts exactly that row.',
          marks: { rows: { 0: 'hit', 1: 'hit' } },
          cells: { keys: ['g1 → Grace  (her own fiber)', 'l1 → Linus  (his own fiber)'] },
          vars: { 'key at position 0': 'g1', 'Row state at position 0': 'Grace\'s  ✓' },
        },
        {
          note: 'The same diff decides effect order: on mount, children\'s effects run before the parent\'s; on update, cleanups run before the new effects. Both follow from React finishing the subtree before it finishes the node above it.',
          marks: { rows: { '0-1': 'skip' } },
          cells: { keys: ['mount: child effects → parent effects', 'update: cleanup → effect'] },
          vars: { 'key at position 0': 'g1', 'Row state at position 0': 'Grace\'s' },
        },
      ],
      result: 'Index keys are a claim that nothing ever moves',
    },
  },

  /* ── 4 · Big list virtualization ───────────────────────────────── */
  4: {
    diagram: 'virtualization',
    alt: 'Windowing a 100,000-row list',
    after: '## Windowing mental model',
    trace: {
      input: '100,000 items · a viewport that fits ~20 rows · 5 rows of overscan',
      lanes: [
        { id: 'counts', label: 'counts', kind: 'slots', slots: ['items', 'DOM nodes', 'mount time'] },
        { id: 'log', label: 'what changed', kind: 'log' },
      ],
      vars: ['scroll position'],
      steps: [
        {
          note: 'Rendered naively: 100,000 list items in the DOM. The browser has to lay out and paint every one of them before the page is usable.',
          marks: { counts: { 'DOM nodes': 'bad', 'mount time': 'bad' } },
          cells: { counts: ['100,000', '100,000', '~4 s'], log: ['render all → the tab locks up'] },
          vars: { 'scroll position': 'top' },
        },
        {
          note: 'Windowing: compute which rows are visible from `scrollTop / itemHeight`, and render only that slice plus a small overscan buffer.',
          marks: { counts: { 'DOM nodes': 'hit', 'mount time': 'hit' } },
          cells: { counts: ['100,000', '25', '~5 ms'], log: ['render all → the tab locks up', 'slice(0, 25)'] },
          vars: { 'scroll position': 'top' },
        },
        {
          note: 'The overscan is why scrolling does not flash: five rows beyond the viewport are already mounted when they come into view.',
          marks: { counts: { 'DOM nodes': 'window' } },
          cells: { counts: ['100,000', '25  (20 visible + 5 spare)', '~5 ms'], log: ['render all → the tab locks up', 'slice(0, 25)', 'overscan absorbs a fast scroll'] },
          vars: { 'scroll position': 'scrolling' },
        },
        {
          note: 'Scroll to row 50,000 and the counts do not move. That flatness is the whole result — mount cost and memory stop depending on the length of the list.',
          marks: { counts: { 'DOM nodes': 'hit' } },
          cells: { counts: ['100,000', '25', '~5 ms'], log: ['slice(50000, 50025) — still 25 nodes'] },
          vars: { 'scroll position': 'row 50,000' },
        },
        {
          note: 'The trade-offs to volunteer: Ctrl-F cannot find an unmounted row, variable heights need measuring rather than division, and sticky headers or grouped rows complicate the arithmetic. Reach for `@tanstack/virtual` or `react-window`.',
          marks: { counts: { items: 'window' } },
          cells: { counts: ['100,000', '25', '~5 ms'], log: ['Ctrl-F, print and anchor links all break'] },
          vars: { 'scroll position': 'row 50,000' },
        },
      ],
      result: 'Constant DOM size, whatever the data',
    },
  },

  /* ── 5 · ES5 React-like class components ───────────────────────── */
  5: {
    diagram: 'component_anatomy',
    alt: 'Building the component model from scratch',
    after: '## Minimal Component base (ES5)',
    trace: {
      input: 'Component.prototype.setState, written by hand',
      lanes: [
        { id: 'inst', label: 'instance', kind: 'slots', slots: ['this.state', 'this.props'] },
        { id: 'log', label: 'what setState does', kind: 'log' },
      ],
      vars: ['re-render'],
      steps: [
        {
          note: 'The constructor gives each instance its own `props` and `state`. This is the part hooks later replaced with a slot list on the fiber.',
          marks: { inst: { 'this.state': 'active' } },
          cells: { inst: ['{ count: 0 }', '{ label: "Add" }'], log: ['new Counter(props)'] },
          vars: { 're-render': 'not yet' },
        },
        {
          note: '`setState(partial)` **merges** — it copies each own key of the partial over the existing state. That shallow merge is the behaviour hooks deliberately dropped.',
          marks: { inst: { 'this.state': 'hit' } },
          cells: { inst: ['{ count: 1 }', '{ label: "Add" }'], log: ['new Counter(props)', 'setState({ count: 1 }) → merge, not replace'] },
          vars: { 're-render': 'scheduled by the merge' },
        },
        {
          note: 'Writing it by hand makes the difference obvious: `useState` replaces, so `setState({ count: 1 })` on a `{count, name}` object would lose `name`. Hence the spread you write in every hook setter.',
          marks: { inst: { 'this.state': 'window' } },
          cells: { inst: ['{ count: 1 }  — name lost with useState', '{ label: "Add" }'], log: ['class: merge · hooks: replace → setState({...s, count: 1})'] },
          vars: { 're-render': 'scheduled' },
        },
        {
          note: 'Then it calls `render()` again and swaps the output. A real implementation diffs instead of replacing — that diff is reconciliation, and it is the only part this sketch leaves out.',
          marks: { inst: { 'this.props': 'active' } },
          cells: { inst: ['{ count: 1 }', '{ label: "Add" }'], log: ['render() → new output → replace the node'] },
          vars: { 're-render': 'done, expensively' },
        },
        {
          note: 'And the lifecycle hooks are just calls at fixed points: `componentDidMount` after the first insert, `componentDidUpdate` after each subsequent one. Nothing magic — which is the point of writing it.',
          marks: { inst: { 'this.state': 'skip', 'this.props': 'skip' } },
          cells: { inst: ['{ count: 1 }', '{ label: "Add" }'], log: ['mount → componentDidMount()', 'update → componentDidUpdate(prev)'] },
          vars: { 're-render': 'idle' },
        },
      ],
      result: 'setState merges; useState replaces',
    },
  },

  /* ── 6 · Closures, useState & stale closures ───────────────────── */
  6: {
    diagram: 'stale_closure',
    alt: 'useState built on a closure, and the trap it creates',
    after: '## The stale closure trap',
    trace: {
      input: 'The closure-based `React` in this article, then the interval bug',
      lanes: [
        { id: 'mem', label: 'memory', kind: 'slots', slots: ['0'] },
        { id: 'log', label: 'what happened', kind: 'log' },
      ],
      vars: ['index', 'value the callback holds'],
      steps: [
        {
          note: 'The toy implementation closes over `memory` and `index`. `render()` resets `index` to 0, so the same `useState` call claims the same slot every time.',
          marks: { mem: { 0: 'active' } },
          cells: { mem: ['0'], log: ['render() → index = 0', 'useState(0) → slot 0'] },
          vars: { index: '1', 'value the callback holds': '0' },
        },
        {
          note: 'That is also where the trap comes from. `useState` returns the value *as it is now* — a plain number, copied into this render\'s scope.',
          marks: { mem: { 0: 'window' } },
          cells: { mem: ['0'], log: ['render() → index = 0', 'useState(0) → slot 0', 'const count = 0  — a local, in this render'] },
          vars: { index: '1', 'value the callback holds': '0' },
        },
        {
          note: 'An interval created in this render closes over that local. `setCount(count + 1)` is `setCount(0 + 1)` — and will be, forever, because deps are `[]` and nothing recreates it.',
          marks: { mem: { 0: 'bad' } },
          cells: { mem: ['1'], log: ['tick → setCount(0 + 1) → 1', 'tick → setCount(0 + 1) → 1', 'tick → setCount(0 + 1) → 1'] },
          vars: { index: '1', 'value the callback holds': '0  — frozen' },
        },
        {
          note: 'Fix: the functional update. `setCount(prev => prev + 1)` never reads the captured local — it asks the store for the current slot value.',
          marks: { mem: { 0: 'hit' } },
          cells: { mem: ['3'], log: ['tick → setCount(c => c+1) → 1', 'tick → setCount(c => c+1) → 2', 'tick → setCount(c => c+1) → 3'] },
          vars: { index: '1', 'value the callback holds': 'nothing — it asks' },
        },
        {
          note: 'Alternative fix: put `count` in the deps so the effect — and the closure — is rebuilt each time it changes. Correct, but it tears down and recreates the interval on every tick.',
          marks: { mem: { 0: 'window' } },
          cells: { mem: ['3'], log: ['deps [count] → clearInterval + setInterval, every second'] },
          vars: { index: '1', 'value the callback holds': 'current, at a cost' },
        },
      ],
      result: 'A render is a snapshot, and a closure keeps it',
    },
  },

  /* ── 7 · StrictMode ────────────────────────────────────────────── */
  7: {
    diagram: 'strictmode_double_invoke',
    alt: 'Mount, unmount, remount in development',
    after: '## What it does in development',
    trace: {
      input: 'useEffect(() => { console.log("mounted"); return () => console.log("cleanup"); }, [])',
      lanes: [
        { id: 'log', label: 'console', kind: 'log' },
        { id: 'phase', label: 'build', kind: 'phases', of: ['development', 'production'] },
      ],
      vars: ['listeners alive', 'verdict'],
      steps: [
        {
          note: 'Mount. `mounted` logs. Everything looks normal.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 0: 'active' } },
          cells: { log: ['mounted'] },
          vars: { 'listeners alive': '1', verdict: 'too early to tell' },
        },
        {
          note: 'React immediately unmounts the effect — `cleanup` logs. It is rehearsing the user navigating away.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 1: 'active' } },
          cells: { log: ['mounted', 'cleanup'] },
          vars: { 'listeners alive': '0', verdict: 'the cleanup exists' },
        },
        {
          note: 'Then remounts — `mounted` again. Back to exactly one listener, because the teardown undid the setup. This effect passes.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 2: 'hit' } },
          cells: { log: ['mounted', 'cleanup', 'mounted'] },
          vars: { 'listeners alive': '1  ✓', verdict: 'idempotent' },
        },
        {
          note: 'The same rehearsal on an effect with no cleanup: two listeners, one unreachable. That leak is real in production — it just needs a route change to trigger it.',
          cursors: { phase: { now: 'development' } },
          marks: { log: { 3: 'bad' } },
          cells: { log: ['mounted', 'cleanup', 'mounted', 'no cleanup → 2 live listeners'] },
          vars: { 'listeners alive': '2  ✗', verdict: 'a leak, found early' },
        },
        {
          note: 'It also double-invokes the render body and `useState` initialisers, which is what catches an impure render — pushing to a module array, mutating a prop. None of it happens in production.',
          cursors: { phase: { now: 'production' } },
          marks: { log: { 4: 'hit' } },
          cells: { log: ['mounted'] },
          vars: { 'listeners alive': '1', verdict: 'development-only' },
        },
      ],
      result: 'A remount rehearsal, not a bug to suppress',
    },
  },

  /* ── 8 · Pure functions & pure components ──────────────────────── */
  8: {
    diagram: 'render_commit_effects',
    alt: 'Why purity matters to the render phase',
    after: '## Pure components',
    trace: {
      input: 'A component that mutates a module variable during render',
      lanes: [
        { id: 'out', label: 'module state', kind: 'slots', slots: ['total'] },
        { id: 'log', label: 'renders', kind: 'log' },
      ],
      vars: ['same input → same output?'],
      steps: [
        {
          note: 'The render body does `total += props.n`. First render: `total` is 5 and the output reflects it.',
          marks: { out: { total: 'active' } },
          cells: { out: ['5'], log: ['render 1 with n=5 → shows 5'] },
          vars: { 'same input → same output?': 'looks fine' },
        },
        {
          note: 'React re-renders with the *same* props — a parent re-rendered, nothing else. The body runs again and `total` becomes 10.',
          marks: { out: { total: 'bad' } },
          cells: { out: ['10'], log: ['render 1 with n=5 → shows 5', 'render 2 with n=5 → shows 10  ✗'] },
          vars: { 'same input → same output?': '**no**' },
        },
        {
          note: 'That is the contract React depends on. It re-renders freely — to bail out, to retry a suspended tree, to double-invoke in StrictMode — and every one of those assumes the body has no lasting effect.',
          marks: { out: { total: 'bad' } },
          cells: { out: ['20'], log: ['render 1 with n=5 → shows 5', 'render 2 with n=5 → shows 10  ✗', 'StrictMode doubles it again → 20'] },
          vars: { 'same input → same output?': 'no — and concurrency makes it worse' },
        },
        {
          note: 'Pure version: derive the value. `const total = items.reduce(...)` produces the same answer however many times it runs, so React can run it as often as it likes.',
          marks: { out: { total: 'hit' } },
          cells: { out: ['5'], log: ['const total = items.reduce(…) — derived'] },
          vars: { 'same input → same output?': 'yes' },
        },
        {
          note: 'And that is also what makes `React.memo` sound: skipping a render is only safe if rendering had no side effect worth keeping. Purity is the precondition for every optimisation in the list.',
          marks: { out: { total: 'skip' } },
          cells: { out: ['5'], log: ['pure → safe to skip, retry, or double-invoke'] },
          vars: { 'same input → same output?': 'yes' },
        },
      ],
      result: 'Side effects belong in effects and handlers',
    },
  },

  /* ── 9 · useEffect vs useLayoutEffect ──────────────────────────── */
  9: {
    diagram: 'render_commit_effects',
    alt: 'The pipeline and where each effect sits',
    after: '## Timing comparison',
    trace: {
      input: 'Render → DOM commit → useLayoutEffect → paint → useEffect',
      lanes: [
        { id: 'phase', label: 'pipeline', kind: 'phases', of: ['render', 'commit', 'useLayoutEffect', 'paint', 'useEffect'] },
        { id: 'log', label: 'safe to do here', kind: 'log' },
      ],
      vars: ['user can see?', 'browser blocked?'],
      steps: [
        {
          note: 'Render. Pure computation only — the DOM of this pass does not exist yet, so there is nothing to measure.',
          cursors: { phase: { now: 'render' } },
          cells: { log: ['compute the output'] },
          vars: { 'user can see?': 'no', 'browser blocked?': 'yes' },
        },
        {
          note: 'Commit. The DOM now matches the new tree and refs are attached — but no frame has been drawn.',
          cursors: { phase: { now: 'commit' } },
          cells: { log: ['compute the output', 'DOM mutated, refs attached'] },
          vars: { 'user can see?': 'no', 'browser blocked?': 'yes' },
        },
        {
          note: '`useLayoutEffect`. The only window where you can read layout *and* change it without the user seeing the first version. Measure, reposition, scroll — synchronously.',
          cursors: { phase: { now: 'useLayoutEffect' } },
          marks: { phase: { useLayoutEffect: 'window' }, log: { 2: 'active' } },
          cells: { log: ['compute the output', 'DOM mutated, refs attached', 'measure + reposition — invisibly'] },
          vars: { 'user can see?': 'no', 'browser blocked?': 'yes — keep it short' },
        },
        {
          note: 'Paint. The first frame. Everything above this line delayed it.',
          cursors: { phase: { now: 'paint' } },
          marks: { phase: { paint: 'hit' } },
          cells: { log: ['compute the output', 'DOM mutated, refs attached', 'measure + reposition — invisibly', 'the user sees it'] },
          vars: { 'user can see?': 'yes', 'browser blocked?': 'no' },
        },
        {
          note: '`useEffect`. After the frame, so the user never waits for it — which is why it is the default and `useLayoutEffect` is the exception you reach for only to avoid a visible jump.',
          cursors: { phase: { now: 'useEffect' } },
          marks: { phase: { useEffect: 'hit' }, log: { 4: 'hit' } },
          cells: { log: ['compute the output', 'DOM mutated, refs attached', 'measure + reposition — invisibly', 'the user sees it', 'fetch · subscribe · log · analytics'] },
          vars: { 'user can see?': 'yes', 'browser blocked?': 'no' },
        },
      ],
      result: 'useEffect by default; useLayoutEffect to hide a frame',
    },
  },

  /* ── 10 · React 18 & concurrent features ───────────────────────── */
  10: {
    diagram: 'concurrent_lanes',
    alt: 'Concurrent rendering, transitions and deferred values',
    after: '## Concurrent rendering mental model',
    trace: {
      input: 'createRoot + a search box filtering 10,000 items',
      lanes: [
        { id: 'phase', label: 'work', kind: 'phases', of: ['idle', 'urgent', 'transition', 'commit'] },
        { id: 'log', label: 'React 18 gives you', kind: 'log' },
      ],
      vars: ['input latency', 'renders per event'],
      steps: [
        {
          note: 'Opting in is `createRoot` rather than `ReactDOM.render`. Everything below depends on that one line — without it you are in legacy mode and nothing here applies.',
          cursors: { phase: { now: 'idle' } },
          cells: { log: ['createRoot(el).render(<App/>) — the opt-in'] },
          vars: { 'input latency': '—', 'renders per event': '—' },
        },
        {
          note: 'Automatic batching arrives for free: updates inside timers and promises now batch too, not just the ones inside React event handlers.',
          cursors: { phase: { now: 'commit' } },
          marks: { log: { 1: 'hit' } },
          cells: { log: ['createRoot(el).render(<App/>) — the opt-in', 'setTimeout(() => { setA(1); setB(2) }) → one render, not two'] },
          vars: { 'input latency': '—', 'renders per event': '2 → 1' },
        },
        {
          note: '`useTransition` splits one event into two priorities. The input update is urgent and commits alone, in a few milliseconds.',
          cursors: { phase: { now: 'urgent' } },
          marks: { phase: { urgent: 'hit' }, log: { 2: 'active' } },
          cells: { log: ['createRoot(el).render(<App/>) — the opt-in', 'setTimeout(() => { setA(1); setB(2) }) → one render, not two', 'startTransition(() => setResults(…)) — non-urgent'] },
          vars: { 'input latency': '4 ms', 'renders per event': '2, by design' },
        },
        {
          note: 'The filter renders in interruptible slices. A new keystroke throws the half-built tree away and starts again — the typing never stutters.',
          cursors: { phase: { now: 'transition' } },
          marks: { phase: { transition: 'window' } },
          cells: { log: ['startTransition(() => setResults(…)) — non-urgent', 'a keystroke discards the work in progress'] },
          vars: { 'input latency': '4 ms', 'renders per event': 'as many as it takes' },
        },
        {
          note: '`useDeferredValue` is the same scheduler applied at the reading end, for when the slow value arrives as a prop. And Suspense + `lazy` use the same machinery to hold a boundary while a chunk loads.',
          cursors: { phase: { now: 'commit' } },
          marks: { phase: { commit: 'hit' }, log: { 2: 'hit' } },
          cells: { log: ['useDeferredValue — defer the reader', 'Suspense + lazy — same interruption machinery'] },
          vars: { 'input latency': '4 ms throughout', 'renders per event': 'invisible to the user' },
        },
      ],
      result: 'Interruptible rendering, opted into with createRoot',
    },
  },

  /* ── 11 · Rules of hooks ───────────────────────────────────────── */
  11: {
    diagram: 'hook_slots',
    alt: 'Why hook call order cannot vary',
    after: '## The two rules',
    trace: {
      input: 'function Bad({ show }) { if (show) useState(""); useState(0); }',
      lanes: [
        { id: 'slots', label: 'slots', kind: 'slots', slots: ['0', '1'] },
        { id: 'log', label: 'React', kind: 'log' },
      ],
      vars: ['show', 'hooks called'],
      steps: [
        {
          note: 'Render 1, `show` true. `name` takes slot 0 and `count` takes slot 1. React records that this component called two hooks.',
          marks: { slots: { 0: 'active', 1: 'active' } },
          cells: { slots: ['"" — name', '0 — count'], log: ['render 1: 2 hooks'] },
          vars: { show: 'true', 'hooks called': '2' },
        },
        {
          note: 'Render 2, `show` false. The first `useState` is skipped, so `count` is now the first call and reaches for slot 0.',
          cursors: { slots: { next: '0' } },
          marks: { slots: { 0: 'bad' } },
          cells: { slots: ['"" — name', '0 — count'], log: ['render 1: 2 hooks', 'render 2: count reads slot 0'] },
          vars: { show: 'false', 'hooks called': '1' },
        },
        {
          note: 'React compares the count — one now, two before — and throws: "Rendered fewer hooks than expected". Better than silently returning a string where a number was expected.',
          marks: { slots: { 0: 'bad', 1: 'bad' } },
          cells: { slots: ['orphaned', 'orphaned'], log: ['render 1: 2 hooks', 'render 2: count reads slot 0', 'Error: Rendered fewer hooks than expected'] },
          vars: { show: 'false', 'hooks called': '1  ✗' },
        },
        {
          note: 'Rule one, top level only, exists to make this impossible. Loops, conditions, early returns and nested functions all break it in exactly this way.',
          marks: { slots: { 0: 'hit', 1: 'hit' } },
          cells: { slots: ['"" — name', '0 — count'], log: ['both hooks, unconditionally → order is fixed'] },
          vars: { show: 'false', 'hooks called': '2  ✓' },
        },
        {
          note: 'Rule two — only from components or custom hooks — exists because there is no slot list anywhere else. A hook called from a plain function has no fiber to read from, and `eslint-plugin-react-hooks` catches both rules at author time.',
          marks: { slots: { 0: 'skip', 1: 'skip' } },
          cells: { slots: ['"" — name', '0 — count'], log: ['a plain function has no fiber → nowhere to store state'] },
          vars: { show: 'false', 'hooks called': '2' },
        },
      ],
      result: 'Same hooks, same order, every render',
    },
  },

  /* ── 12 · When does a component re-render ──────────────────────── */
  12: {
    diagram: 'rerender_triggers',
    alt: 'What does and does not trigger a re-render',
    after: '## Triggers',
    trace: {
      input: '<Parent> with a count button and a propless <Child/>',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent · useState(count)' },
            { id: 'btn', label: 'button', parent: 'parent' },
            { id: 'child', label: 'Child · no props', parent: 'parent' },
          ],
        },
      ],
      vars: ['trigger', 'Child re-renders?'],
      steps: [
        {
          note: 'Click. `setCount(c => c + 1)` is a new value, so React schedules a render of Parent.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active' } },
          vars: { trigger: 'own state changed', 'Child re-renders?': 'deciding' },
        },
        {
          note: '`Child` re-renders. It takes no props, so nothing about it changed — it re-renders because its parent did, which is the trigger people forget.',
          marks: { tree: { parent: 'done', child: 'bad' } },
          vars: { trigger: 'parent re-rendered', 'Child re-renders?': 'yes' },
        },
        {
          note: 'Now `setCount(c => c)` — the same value. `Object.is` says nothing changed, so React bails out before rendering anything.',
          marks: { tree: { parent: 'skip', child: 'skip' } },
          vars: { trigger: 'same value → no render', 'Child re-renders?': 'no' },
        },
        {
          note: 'And `items.push(x)` on a state array. The array is mutated but the reference is identical, so React compares it to itself and does nothing — the screen goes stale.',
          marks: { tree: { parent: 'bad' } },
          vars: { trigger: 'mutation → **no render**', 'Child re-renders?': 'no — and the UI is now wrong' },
        },
        {
          note: 'Which is the key insight: a re-render is not "something changed", it is "React was told something changed". A ref write, an in-place mutation and a module variable are all invisible to it.',
          marks: { tree: { parent: 'hit' } },
          vars: { trigger: 'setItems([...items, x]) → new reference', 'Child re-renders?': 'yes  ✓' },
        },
      ],
      result: 'New reference, or React never hears about it',
    },
  },

  /* ── 13 · React.memo & custom comparison ───────────────────────── */
  13: {
    diagram: 'memo_reference_trap',
    alt: 'memo and its comparison function',
    after: '## Basic usage',
    trace: {
      input: 'memo(ExpensiveList) receiving `items` and `onSelect`',
      lanes: [
        { id: 'props', label: 'props', kind: 'slots', slots: ['items', 'onSelect'] },
        { id: 'log', label: 'memo decides', kind: 'log' },
      ],
      vars: ['result'],
      steps: [
        {
          note: 'The parent re-renders for an unrelated reason. Both props were built inline, so both are new objects.',
          marks: { props: { items: 'bad', onSelect: 'bad' } },
          cells: { props: ['arr#2', 'fn#2'], log: ['shallow compare: items ✗, onSelect ✗'] },
          vars: { result: 're-render — memo bought nothing' },
        },
        {
          note: 'Stabilise both — `useMemo` for the array, `useCallback` for the handler — and the shallow compare finally succeeds.',
          marks: { props: { items: 'hit', onSelect: 'hit' } },
          cells: { props: ['arr#1', 'fn#1'], log: ['shallow compare: items ✗, onSelect ✗', 'shallow compare: items ✓, onSelect ✓ → skip'] },
          vars: { result: 'bail out  ✓' },
        },
        {
          note: 'Now a case the default cannot handle: `items` is genuinely a new array each time, but only the `id`s matter. Pass a custom comparator as memo\'s second argument.',
          marks: { props: { items: 'window' } },
          cells: { props: ['arr#3  (new, same ids)', 'fn#1'], log: ['default compare says ✗ — but nothing meaningful changed'] },
          vars: { result: 'would re-render, unnecessarily' },
        },
        {
          note: 'The comparator returns **true to skip** — the inverse of `shouldComponentUpdate`, and the single most common mistake when writing one.',
          marks: { props: { items: 'hit' } },
          cells: { props: ['arr#3', 'fn#1'], log: ['(prev, next) => sameIds(prev.items, next.items) → true → skip'] },
          vars: { result: 'bail out  ✓' },
        },
        {
          note: 'And the warning that goes with it: a deep comparison over a large array can cost more than the render it avoids. Reach for a comparator only when the props are small and the subtree is genuinely expensive.',
          marks: { props: { items: 'bad' } },
          cells: { props: ['10,000 items', 'fn#1'], log: ['deep compare of 10,000 items > the render it saved'] },
          vars: { result: 'slower than no memo at all' },
        },
      ],
      result: 'Return true to skip; measure before writing a comparator',
    },
  },

  /* ── 14 · Optimising a slow React app ──────────────────────────── */
  14: {
    diagram: 'rerender_triggers',
    alt: 'The optimisation playbook',
    after: '## Step-by-step playbook',
    trace: {
      input: 'A dashboard that stutters when you type in its filter box',
      lanes: [
        { id: 'step', label: 'step', kind: 'phases', of: ['profile', 'classify', 'fix', 'verify'] },
        { id: 'log', label: 'notes', kind: 'log' },
      ],
      vars: ['commit time', 'what you know'],
      steps: [
        {
          note: 'Profile first. React DevTools flame chart plus "highlight updates" — never a `memo` before you have a number.',
          cursors: { step: { now: 'profile' } },
          cells: { log: ['commit 180 ms · 2,400 components highlighted'] },
          vars: { 'commit time': '180 ms', 'what you know': 'a number, not a theory' },
        },
        {
          note: 'Classify. 2,400 components for one keystroke is a *count* problem, not a *cost-per-component* problem — and the two have different fixes.',
          cursors: { step: { now: 'classify' } },
          marks: { log: { 1: 'active' } },
          cells: { log: ['commit 180 ms · 2,400 components highlighted', 'too many renders, not one slow render'] },
          vars: { 'commit time': '180 ms', 'what you know': 'which kind of slow' },
        },
        {
          note: 'Fix for "too many": move the input state down into its own component so typing stops re-rendering the dashboard, and stabilise the props the memoised list receives.',
          cursors: { step: { now: 'fix' } },
          marks: { log: { 2: 'hit' } },
          cells: { log: ['commit 180 ms · 2,400 components highlighted', 'too many renders, not one slow render', 'move state down + useCallback the handler'] },
          vars: { 'commit time': 'to be measured', 'what you know': 'the fix matches the diagnosis' },
        },
        {
          note: 'The anti-patterns, and why they are on the list: `useMemo` on everything adds comparisons without removing renders, and an index key quietly defeats the `memo` you just added by changing which row is which.',
          cursors: { step: { now: 'fix' } },
          marks: { log: { 3: 'bad' } },
          cells: { log: ['anti-pattern: memo everything', 'anti-pattern: index keys under a memoised row'] },
          vars: { 'commit time': 'unchanged', 'what you know': 'what not to do' },
        },
        {
          note: 'Verify. 180 ms to 8 ms, and 2,400 highlighted components down to 12. Without this step you have added caches and cannot say whether they helped.',
          cursors: { step: { now: 'verify' } },
          marks: { log: { 4: 'hit' } },
          cells: { log: ['commit 8 ms · 12 components highlighted  ✓'] },
          vars: { 'commit time': '8 ms  ✓', 'what you know': 'it worked' },
        },
      ],
      result: 'Profile, classify, fix, verify',
    },
  },

  /* ── 15 · Preventing context re-renders ────────────────────────── */
  15: {
    diagram: 'context_propagation',
    alt: 'Four fixes for a busy context',
    after: '## The problem',
    trace: {
      input: 'createContext({ user, theme, cart }) — a theme toggle fires',
      lanes: [
        { id: 'fix', label: 'fix', kind: 'phases', of: ['none', 'split by rate', 'memo the value', 'split state/dispatch', 'store + selectors'] },
        { id: 'who', label: 're-renders', kind: 'log' },
      ],
      vars: ['components re-rendered'],
      steps: [
        {
          note: 'One context holding three unrelated things. Toggling the theme notifies every consumer, including `UserName`, which only reads `user`.',
          cursors: { fix: { now: 'none' } },
          marks: { who: { 0: 'bad' } },
          cells: { who: ['UserName · CartBadge · ThemeSwitch — all of them'] },
          vars: { 'components re-rendered': '~40' },
        },
        {
          note: 'Fix 1 — split by update frequency. `theme` changes rarely, `cart` changes constantly; putting them in one value means the slow one pays for the fast one.',
          cursors: { fix: { now: 'split by rate' } },
          marks: { who: { 1: 'hit' } },
          cells: { who: ['UserName · CartBadge · ThemeSwitch — all of them', 'ThemeSwitch only'] },
          vars: { 'components re-rendered': '~3' },
        },
        {
          note: 'Fix 2 — memoise the provider value. This is the minimum, not an optimisation: an inline `{{ user, setUser }}` is a new object every render, so consumers re-render even when nothing changed at all.',
          cursors: { fix: { now: 'memo the value' } },
          marks: { who: { 2: 'hit' } },
          cells: { who: ['all of them', 'ThemeSwitch only', 'nobody, when nothing changed'] },
          vars: { 'components re-rendered': '0 on an unrelated render' },
        },
        {
          note: 'Fix 3 — split state from dispatch. Setters never change, so a component that only writes can subscribe to a context that never updates.',
          cursors: { fix: { now: 'split state/dispatch' } },
          marks: { who: { 3: 'hit' } },
          cells: { who: ['ThemeSwitch only', 'writers never re-render at all'] },
          vars: { 'components re-rendered': 'readers only' },
        },
        {
          note: 'Fix 4 — an external store with selectors. Once you are splitting three ways and hand-rolling comparators, a store subscribing per-slice is less machinery than the context you are maintaining.',
          cursors: { fix: { now: 'store + selectors' } },
          marks: { who: { 4: 'hit' } },
          cells: { who: ['only components whose selected slice changed'] },
          vars: { 'components re-rendered': 'exactly the ones that had to' },
        },
      ],
      result: 'Memoise always; split when it still hurts',
    },
  },

  /* ── 16 · SSR, SSG, ISR & CSR ──────────────────────────────────── */
  16: {
    diagram: 'rendering_strategies_react',
    alt: 'Four rendering strategies and hydration',
    after: '## Comparison',
    trace: {
      input: 'The same page, and the question "who builds the HTML, and when?"',
      lanes: [
        { id: 'phase', label: 'SSR timeline', kind: 'phases', of: ['request', 'HTML', 'paint', 'JS', 'hydrate', 'interactive'] },
        { id: 'log', label: 'strategy', kind: 'log' },
      ],
      vars: ['content visible', 'clicks work'],
      steps: [
        {
          note: 'CSR — the browser builds it. An empty shell ships first, so nothing is visible until the bundle has downloaded, parsed and run.',
          cursors: { phase: { now: 'JS' } },
          marks: { log: { 0: 'window' } },
          cells: { log: ['CSR — browser downloads JS → empty shell → hydrates'] },
          vars: { 'content visible': 'late', 'clicks work': 'as soon as it paints' },
        },
        {
          note: 'SSR — the server builds it, per request. Real HTML in the first byte, so the content is visible immediately.',
          cursors: { phase: { now: 'paint' } },
          marks: { phase: { HTML: 'hit', paint: 'hit' }, log: { 1: 'hit' } },
          cells: { log: ['CSR — browser downloads JS → empty shell → hydrates', 'SSR — server sends full HTML → browser hydrates'] },
          vars: { 'content visible': 'early  ✓', 'clicks work': 'not yet' },
        },
        {
          note: 'The hydration gap: the page looks finished and ignores every click until React has re-rendered the tree to attach handlers. SSR improves what the user *sees*, not when they can *act*.',
          cursors: { phase: { now: 'hydrate' } },
          marks: { phase: { JS: 'bad', hydrate: 'bad' } },
          cells: { log: ['SSR — server sends full HTML → browser hydrates', 'the gap: visible but inert'] },
          vars: { 'content visible': 'early', 'clicks work': 'after hydration' },
        },
        {
          note: 'SSG — built once at deploy, served from a CDN. Fastest possible, and only usable when the content does not vary per user. ISR adds a background rebuild on a timer: one visitor after the window gets a stale page, everyone after gets the fresh one.',
          cursors: { phase: { now: 'HTML' } },
          marks: { phase: { HTML: 'hit' }, log: { 3: 'hit' } },
          cells: { log: ['SSG — pre-built at deploy → CDN serves instantly', 'ISR — SSG + periodic background rebuild'] },
          vars: { 'content visible': 'instant', 'clicks work': 'after hydration, as always' },
        },
        {
          note: 'React 18 streaming SSR narrows the gap: the server flushes HTML in chunks and hydrates selectively, so an interactive header does not wait for a slow product grid below it.',
          cursors: { phase: { now: 'interactive' } },
          marks: { phase: { interactive: 'hit' } },
          cells: { log: ['streaming SSR — flush in chunks, hydrate selectively'] },
          vars: { 'content visible': 'progressively', 'clicks work': 'region by region' },
        },
      ],
      result: 'Decide by ownership of the content and required freshness',
    },
  },

  /* ── 17 · useImperativeHandle + forwardRef ─────────────────────── */
  17: {
    diagram: 'refs_escape_hatch',
    alt: 'Exposing a narrow API through a ref',
    after: '## The React pattern: forwardRef + useImperativeHandle',
    trace: {
      input: 'A child that wants to offer `focus()` and `reset()` — and nothing else',
      lanes: [
        { id: 'exposed', label: 'parentRef.current', kind: 'slots', slots: ['what it is'] },
        { id: 'log', label: 'the parent can call', kind: 'log' },
      ],
      vars: ['encapsulation'],
      steps: [
        {
          note: 'A ref placed on a function component goes nowhere — function components have no instance. React warns and `current` stays null.',
          marks: { exposed: { 'what it is': 'bad' } },
          cells: { exposed: ['null'], log: ['Warning: Function components cannot be given refs'] },
          vars: { encapsulation: 'total, but useless' },
        },
        {
          note: '`forwardRef` passes the ref through as a second parameter. Attach it to the inner `<input>` and the parent holds the raw DOM node.',
          marks: { exposed: { 'what it is': 'window' } },
          cells: { exposed: ['the <input> element'], log: ['ref.current.focus()  ✓', 'ref.current.value = "x"  ← unintended', 'ref.current.remove()   ← also unintended'] },
          vars: { encapsulation: 'none — the parent owns the node' },
        },
        {
          note: '`useImperativeHandle(ref, () => ({ focus, reset }))` replaces what the ref points at. The parent now sees only what the child chose to publish.',
          marks: { exposed: { 'what it is': 'hit' } },
          cells: { exposed: ['{ focus, reset }'], log: ['ref.current.focus()  ✓', 'ref.current.reset()  ✓', 'ref.current.value → undefined  ✓'] },
          vars: { encapsulation: 'a contract you chose' },
        },
        {
          note: 'The child keeps its own `useRef` to the real node, so it loses nothing — it is handing out a public interface, not giving up access.',
          marks: { exposed: { 'what it is': 'hit' } },
          cells: { exposed: ['{ focus, reset }'], log: ['inner useRef → still the real <input>'] },
          vars: { encapsulation: 'child keeps full access' },
        },
        {
          note: 'Where it earns its place: focus, scroll-into-view, text selection, play/pause. The difference from Vue\'s `defineExpose` is only syntax — and in React 19 `ref` is a plain prop, so `forwardRef` is no longer needed.',
          marks: { exposed: { 'what it is': 'skip' } },
          cells: { exposed: ['{ focus, reset }'], log: ['imperative for actions · props for data'] },
          vars: { encapsulation: 'narrow, on purpose' },
        },
      ],
      result: 'Publish verbs, not the node',
    },
  },

  /* ── 18 · Accessibility in React ───────────────────────────────── */
  18: {
    diagram: 'a11y_tree',
    alt: 'Focus, roles and announcements',
    after: '## Core practices',
    trace: {
      input: 'A modal opened from a button',
      lanes: [
        { id: 'focus', label: 'focus is on', kind: 'slots', slots: ['element'] },
        { id: 'log', label: 'announced', kind: 'log' },
      ],
      vars: ['keyboard user can…'],
      steps: [
        {
          note: 'The modal opens. It is visible, and focus is still on the trigger behind it — so Tab walks the page underneath while the dialog sits there unreachable.',
          marks: { focus: { element: 'bad' } },
          cells: { focus: ['the trigger, behind the overlay'], log: ['(nothing announced)'] },
          vars: { 'keyboard user can…': 'tab through the page behind it' },
        },
        {
          note: 'The effect moves focus in: `dialogRef.current?.focus()` on open. Now the reader announces the dialog and its contents are reachable.',
          marks: { focus: { element: 'active' } },
          cells: { focus: ['the dialog'], log: ['(nothing announced)', '"Settings, dialog"'] },
          vars: { 'keyboard user can…': 'reach the dialog' },
        },
        {
          note: 'Escape closes it — bound in the same effect, and removed in the cleanup. An effect that adds a listener without removing it leaks one per open.',
          marks: { focus: { element: 'active' } },
          cells: { focus: ['the dialog'], log: ['"Settings, dialog"', 'Escape → onClose()'] },
          vars: { 'keyboard user can…': 'get out again' },
        },
        {
          note: 'On close, return focus to the trigger. Skip this and focus falls back to `<body>` — the user is dumped at the top of the page with no idea where they were.',
          marks: { focus: { element: 'hit' } },
          cells: { focus: ['back on the trigger'], log: ['"Settings, dialog"', 'Escape → onClose()', '"Open settings, button"'] },
          vars: { 'keyboard user can…': 'carry on where they left off' },
        },
        {
          note: 'The React-specific parts throughout: `useId` for label↔input ids that survive SSR, `role="status"` so an async result is spoken, and a portal\'s tab position following its new DOM location rather than its React position.',
          marks: { focus: { element: 'skip' } },
          cells: { focus: ['back on the trigger'], log: ['useId → htmlFor  ·  role="status" → "Saved"'] },
          vars: { 'keyboard user can…': 'hear that it worked' },
        },
      ],
      result: 'Native elements, then focus, then announcements',
    },
  },

  /* ── 19 · Micro-frontend architecture ──────────────────────────── */
  19: {
    diagram: 'microfrontend_topology',
    alt: 'A host composing independently-deployed remotes',
    after: '## Why teams adopt it',
    trace: {
      input: 'A host with a checkout remote, via Module Federation',
      lanes: [
        { id: 'react', label: 'React copies', kind: 'slots', slots: ['host', 'remote'] },
        { id: 'log', label: 'at runtime', kind: 'log' },
      ],
      vars: ['who ships', 'coupling'],
      steps: [
        {
          note: 'The host ships knowing only a URL. `checkout/Cart` is not in its bundle — it is a promise to fetch a module from `localhost:3001` when the route is reached.',
          cells: { react: ['18.3', '—'], log: ['host boots — no remote fetched yet'] },
          vars: { 'who ships': 'host team', coupling: 'a URL' },
        },
        {
          note: 'The user reaches checkout. `remoteEntry.js` is fetched, then the `Cart` chunk. The checkout team deployed it an hour ago and nobody rebuilt the host.',
          marks: { log: { 1: 'hit' } },
          cells: { react: ['18.3', 'loading'], log: ['host boots — no remote fetched yet', 'fetch remoteEntry.js → Cart'] },
          vars: { 'who ships': 'checkout team, independently  ✓', coupling: 'a URL' },
        },
        {
          note: 'Without `shared: { react: { singleton: true } }`, the remote brings its own React. Two copies means two hook dispatchers, and any hook called through the wrong one throws "Invalid hook call".',
          marks: { react: { host: 'bad', remote: 'bad' } },
          cells: { react: ['18.3', '19.0 — its own'], log: ['two Reacts → Invalid hook call'] },
          vars: { 'who ships': 'both', coupling: 'broken' },
        },
        {
          note: '`singleton: true` makes them share one instance — and creates the coupling nobody advertises: both teams now have to agree on a React version, at runtime, across repos.',
          marks: { react: { host: 'hit', remote: 'skip' } },
          cells: { react: ['18.3', 'uses the host\'s'], log: ['singleton: true → one React'] },
          vars: { 'who ships': 'independently, within a version range', coupling: 'a shared runtime' },
        },
        {
          note: 'The rest of the bill: versioning a shared contract, duplicated design-system code unless that is shared too, and a stack trace that spans repositories you cannot see. Below roughly four teams, a monorepo with real module boundaries buys the same isolation for far less.',
          marks: { react: { host: 'window' } },
          cells: { react: ['18.3', 'shared'], log: ['contract versioning · duplicated deps · cross-repo debugging'] },
          vars: { 'who ships': 'each team', coupling: 'organisational, now technical' },
        },
      ],
      result: 'Independent deploys, paid for at runtime',
    },
  },

  /* ── 20 · Custom hooks vs extracted helpers ────────────────────── */
  20: {
    diagram: 'custom_hook_boundary',
    alt: 'When it must be a hook, and when a function will do',
    after: '## The useTasks pattern',
    trace: {
      input: 'generateRandomTasks(count) vs useTasks(initialCount)',
      lanes: [
        { id: 'kind', label: 'should be', kind: 'slots', slots: ['a plain helper', 'a custom hook'] },
        { id: 'log', label: 'test', kind: 'log' },
      ],
      vars: ['calls a hook?', 'testable how'],
      steps: [
        {
          note: '`generateRandomTasks` takes a number and returns an array. No state, no effect, no context — it touches nothing React-shaped.',
          marks: { kind: { 'a plain helper': 'hit' } },
          cells: { kind: ['generateRandomTasks', '—'], log: ['expect(generateRandomTasks(3)).toHaveLength(3)'] },
          vars: { 'calls a hook?': 'no', 'testable how': 'call it — no renderer needed' },
        },
        {
          note: '`useTasks` owns `useState` and returns a stable `addTask` from `useCallback`. It has to be a hook: there is nowhere else for that state to live.',
          marks: { kind: { 'a custom hook': 'hit' } },
          cells: { kind: ['generateRandomTasks', 'useTasks'], log: ['expect(generateRandomTasks(3)).toHaveLength(3)', 'renderHook(() => useTasks(5))'] },
          vars: { 'calls a hook?': 'yes', 'testable how': 'renderHook' },
        },
        {
          note: 'Note the composition: `useTasks` calls the plain helper for its initialiser. Keeping the pure part pure is what makes the interesting logic testable without a renderer.',
          marks: { kind: { 'a plain helper': 'window', 'a custom hook': 'hit' } },
          cells: { kind: ['generateRandomTasks', 'useTasks → uses the helper'], log: ['useState(() => generateRandomTasks(initialCount))'] },
          vars: { 'calls a hook?': 'the hook does', 'testable how': 'both, separately' },
        },
        {
          note: 'The anti-pattern: naming something `useFormatPrice` when it calls no hook. It now has to obey the rules of hooks — no conditionals, no loops — for no benefit at all.',
          marks: { kind: { 'a plain helper': 'bad' } },
          cells: { kind: ['useFormatPrice — a helper in costume', 'useTasks'], log: ['linted as a hook, constrained as a hook, benefits as neither'] },
          vars: { 'calls a hook?': 'no', 'testable how': 'awkwardly' },
        },
        {
          note: 'The mirror image, and the worse one: a "helper" that secretly needs state, so someone reaches for a module-level variable. Now two components silently share it.',
          marks: { kind: { 'a plain helper': 'bad', 'a custom hook': 'hit' } },
          cells: { kind: ['let cache = …  ← shared by every caller', 'useTasks'], log: ['module state → cross-component bleed'] },
          vars: { 'calls a hook?': 'it needed to', 'testable how': 'not reliably' },
        },
      ],
      result: 'Prefix with `use` only if it calls a hook',
    },
  },

  /* ── 21 · useMemo: why it might not behave as expected ─────────── */
  21: {
    diagram: 'memo_reference_trap',
    alt: 'The four ways useMemo silently does nothing',
    after: '## How it works',
    trace: {
      input: 'const value = useMemo(() => expensiveComputation(a, b), [a, b])',
      lanes: [
        { id: 'deps', label: 'deps', kind: 'slots', slots: ['a', 'b'] },
        { id: 'log', label: 'failure', kind: 'log' },
      ],
      vars: ['cache hit?', 'net effect'],
      steps: [
        {
          note: 'Failure 1 — an object or array dependency. `a` is `{ id: 1 }` built inline by the parent, so it is a new reference every render and the cache never hits.',
          marks: { deps: { a: 'bad' } },
          cells: { deps: ['obj#2 (new)', '5'], log: ['object dep → never equal → recompute every render'] },
          vars: { 'cache hit?': 'never', 'net effect': 'the work, plus a comparison' },
        },
        {
          note: 'Failure 2 — the array is wrong. A value used inside but left out of the deps means the cache holds a **stale** result: not slow, incorrect.',
          marks: { deps: { b: 'bad' } },
          cells: { deps: ['obj#1', 'c is used but not listed'], log: ['object dep → never equal → recompute every render', 'missing dep → stale value returned'] },
          vars: { 'cache hit?': 'always — wrongly', 'net effect': 'a bug, not a slowdown' },
        },
        {
          note: 'Failure 3 — memoising the wrong thing. The value is cached but then spread into a new object at the call site, so the consumer sees a fresh reference anyway.',
          marks: { deps: { a: 'window' } },
          cells: { deps: ['obj#1', '5'], log: ['missing dep → stale value returned', '<Child data={{ ...memoised }}/> → new object again'] },
          vars: { 'cache hit?': 'yes, and wasted', 'net effect': 'nothing downstream' },
        },
        {
          note: 'Failure 4 — it was never expensive. `useMemo(() => a + b, [a, b])` costs an array allocation and two comparisons to avoid an addition. Strictly slower.',
          marks: { deps: { a: 'bad', b: 'bad' } },
          cells: { deps: ['3', '5'], log: ['useMemo(() => a + b, [a, b]) — slower than a + b'] },
          vars: { 'cache hit?': 'yes', 'net effect': 'negative' },
        },
        {
          note: 'When it does work: genuinely costly computation over stable inputs, or a reference that something downstream compares — a memoised child, an effect dependency, another memo.',
          marks: { deps: { a: 'hit', b: 'hit' } },
          cells: { deps: ['arr#1 (stable)', '5'], log: ['sort 10,000 rows, or feed a memo(Child)  ✓'] },
          vars: { 'cache hit?': 'yes', 'net effect': 'positive, and measurable' },
        },
      ],
      result: 'Stable deps, real cost, or a reader downstream',
    },
  },

  /* ── 22 · Understanding React.memo ─────────────────────────────── */
  22: {
    diagram: 'memo_reference_trap',
    alt: 'What React.memo does and does not do',
    after: '## The problem it solves',
    trace: {
      input: '<ExpensiveChart data={staticData}/> beside a count button',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent · useState(count)' },
            { id: 'btn', label: 'button', parent: 'parent' },
            { id: 'chart', label: 'ExpensiveChart', parent: 'parent' },
          ],
        },
      ],
      vars: ['data prop', 'chart renders?'],
      steps: [
        {
          note: 'Click the counter. Parent re-renders, and so does the chart — even though `staticData` is the same value it has always been.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active', chart: 'bad' } },
          vars: { 'data prop': 'staticData (unchanged)', 'chart renders?': 'yes — 400 ms wasted' },
        },
        {
          note: 'Wrap it: `React.memo(ExpensiveChart)`. Now React shallow-compares the props before rendering, sees `staticData` is identical, and skips the whole subtree.',
          marks: { tree: { parent: 'done', chart: 'skip' } },
          vars: { 'data prop': 'staticData === staticData', 'chart renders?': 'no  ✓' },
        },
        {
          note: 'What it does **not** do: stop a re-render caused by the component\'s own state. `memo` guards the props path only.',
          cursors: { tree: { at: 'chart' } },
          marks: { tree: { chart: 'active' } },
          vars: { 'data prop': 'unchanged', 'chart renders?': 'yes — its own setState' },
        },
        {
          note: 'Nor a context change. A `useContext` inside the chart is a separate subscription, checked after the memo check, and it wins.',
          marks: { tree: { chart: 'bad' } },
          vars: { 'data prop': 'unchanged', 'chart renders?': 'yes — context' },
        },
        {
          note: 'And the distinction that gets asked: `React.memo` caches a **component\'s output** given props; `useMemo` caches a **value** inside a component given deps. Different subjects, one shared idea — compare by identity.',
          marks: { tree: { chart: 'skip' } },
          vars: { 'data prop': 'stable', 'chart renders?': 'no' },
        },
      ],
      result: 'Guards props; not state, not context',
    },
  },

  /* ── 23 · useLocalStorage ──────────────────────────────────────── */
  23: {
    diagram: 'custom_hook_boundary',
    alt: 'The decisions inside a real custom hook',
    after: '## The hook',
    trace: {
      input: 'const [theme, setTheme] = useLocalStorage("theme", "light")',
      lanes: [
        { id: 'store', label: 'where', kind: 'slots', slots: ['React state', 'localStorage'] },
        { id: 'log', label: 'decision', kind: 'log' },
      ],
      vars: ['in sync?'],
      steps: [
        {
          note: 'Mount. The initial value is read through a **lazy** initialiser — `useState(() => readValue(...))` — so the parse happens once instead of on every render.',
          marks: { store: { 'React state': 'active' } },
          cells: { store: ['"dark"', '"dark"'], log: ['lazy initialiser → read once, not every render'] },
          vars: { 'in sync?': 'yes' },
        },
        {
          note: 'The read is wrapped in `try/catch`. Storage throws in private mode and in a sandboxed iframe, and a stored value can be malformed JSON from an older version of the app.',
          marks: { store: { localStorage: 'window' } },
          cells: { store: ['"dark"', 'quota / parse errors possible'], log: ['lazy initialiser → read once, not every render', 'try/catch → fall back rather than crash'] },
          vars: { 'in sync?': 'yes, defensively' },
        },
        {
          note: '`setTheme("light")` writes both: React state so the UI updates, and storage so it survives a reload. Writing only one is the bug this hook exists to prevent.',
          marks: { store: { 'React state': 'hit', localStorage: 'hit' } },
          cells: { store: ['"light"', '"light"'], log: ['write both, in one setter'] },
          vars: { 'in sync?': 'yes' },
        },
        {
          note: 'Another tab changes the theme. Its `localStorage` write does not touch this tab\'s React state, so the two diverge — until a `storage` event listener brings them back together.',
          marks: { store: { 'React state': 'bad' } },
          cells: { store: ['"light"  (stale)', '"dark"  (other tab)'], log: ['window.addEventListener("storage", …) → cross-tab sync'] },
          vars: { 'in sync?': 'no, then yes' },
        },
        {
          note: 'And SSR: there is no `window` on the server, so reading during the initialiser throws. Start from the fallback and read storage in an effect — accepting one frame of the default rather than a hydration mismatch.',
          marks: { store: { localStorage: 'window' } },
          cells: { store: ['"light"  (the fallback)', 'unreadable on the server'], log: ['server: fallback → effect reads storage after mount'] },
          vars: { 'in sync?': 'after the first effect' },
        },
      ],
      result: 'Lazy init, try/catch, both writes, storage event, SSR guard',
    },
  },

  /* ── 24 · When useMemo hurts ───────────────────────────────────── */
  24: {
    diagram: 'memo_reference_trap',
    alt: 'The cost side of memoisation',
    after: '## It is never free',
    trace: {
      input: 'const total = useMemo(() => price * quantity, [price, quantity])',
      lanes: [
        { id: 'cost', label: 'per render', kind: 'slots', slots: ['without useMemo', 'with useMemo'] },
        { id: 'log', label: 'what you pay', kind: 'log' },
      ],
      vars: ['net'],
      steps: [
        {
          note: 'Without it: one multiplication. Nanoseconds, and nothing is retained.',
          marks: { cost: { 'without useMemo': 'hit' } },
          cells: { cost: ['1 multiply', '—'], log: ['price * quantity'] },
          vars: { net: 'baseline' },
        },
        {
          note: 'With it: allocate the deps array, compare two values with `Object.is`, read the hook slot, and keep the cached result alive. To avoid one multiplication.',
          marks: { cost: { 'with useMemo': 'bad' } },
          cells: { cost: ['1 multiply', 'array + 2 compares + a slot'], log: ['price * quantity', 'strictly more work than the work it skipped'] },
          vars: { net: 'negative' },
        },
        {
          note: 'The memory cost is the one people miss. A memoised derivation of a 10,000-row list keeps both the source and the derived copy alive until the component unmounts.',
          marks: { cost: { 'with useMemo': 'bad' } },
          cells: { cost: ['one array', 'two arrays, both retained'], log: ['every cached value pins its inputs'] },
          vars: { net: 'negative, and it is memory' },
        },
        {
          note: 'It also costs readability: a reader now has to check whether the deps are complete, whether they are stable, and whether anything downstream actually relies on the identity.',
          marks: { cost: { 'with useMemo': 'window' } },
          cells: { cost: ['obvious', 'three questions per call site'], log: ['maintenance is a cost too'] },
          vars: { net: 'negative' },
        },
        {
          note: '"Expensive" means milliseconds in a profile, not "it is a loop". The rule: reach for it when you have measured the cost, or when something downstream compares the reference — and nowhere else.',
          marks: { cost: { 'with useMemo': 'hit' } },
          cells: { cost: ['40 ms sort', 'cached — measured in the Profiler'], log: ['measured, or feeding a memo → keep it'] },
          vars: { net: 'positive, provably' },
        },
      ],
      result: 'A cache with no measured hit is just overhead',
    },
  },

  /* ── 25 · memo vs useMemo ──────────────────────────────────────── */
  25: {
    diagram: 'memo_reference_trap',
    alt: 'Which one caches what',
    after: '## The one-line distinction',
    trace: {
      input: 'Parent filters rawItems and passes the result to a memoised list',
      lanes: [
        { id: 'what', label: 'caches', kind: 'slots', slots: ['React.memo', 'useMemo'] },
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent · useState(count)' },
            { id: 'list', label: 'memo(ExpensiveList)', parent: 'parent' },
          ],
        },
      ],
      vars: ['items reference', 'list renders?'],
      steps: [
        {
          note: 'The count button is clicked. Parent re-renders and `rawItems.filter(...)` runs again, producing a new array.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active' }, what: { 'useMemo': 'bad' } },
          cells: { what: ['a component\'s output', 'a value'] },
          vars: { 'items reference': 'arr#2  (new)', 'list renders?': 'deciding' },
        },
        {
          note: '`React.memo` compares props. `arr#2 ≠ arr#1`, so it re-renders — the memo is there, and it is useless on its own.',
          marks: { tree: { list: 'bad' } },
          vars: { 'items reference': 'arr#2 ≠ arr#1', 'list renders?': 'yes — wasted' },
        },
        {
          note: 'Add `useMemo` around the filter. Now the array keeps its identity while `rawItems` and `filter` are unchanged.',
          marks: { what: { 'useMemo': 'hit' } },
          cells: { what: ['a component\'s output', 'a value'] },
          vars: { 'items reference': 'arr#1  (stable)', 'list renders?': 'deciding' },
        },
        {
          note: 'And now `React.memo` succeeds. The two are not alternatives — `useMemo` supplies the stable reference that `React.memo` needs in order to bail out.',
          marks: { tree: { parent: 'done', list: 'skip' }, what: { 'React.memo': 'hit', 'useMemo': 'hit' } },
          vars: { 'items reference': 'arr#1 === arr#1', 'list renders?': 'no  ✓' },
        },
        {
          note: 'The answer that scores: "`React.memo` caches a component\'s rendered output given its props; `useMemo` caches a value inside a component given its dependencies. You usually need both, because the second is what makes the first work."',
          marks: { what: { 'React.memo': 'hit', 'useMemo': 'hit' } },
          vars: { 'items reference': 'stable', 'list renders?': 'no' },
        },
      ],
      result: 'Output vs value — and they work as a pair',
    },
  },

  /* ── 26 · State management ladder ──────────────────────────────── */
  26: {
    diagram: 'state_ladder',
    alt: 'The state placement ladder',
    after: '## The Problem',
    trace: {
      input: 'One value, climbing the ladder as the requirements grow',
      lanes: [
        { id: 'rung', label: 'rung', kind: 'phases', of: ['useState', 'lift', 'useReducer', 'the URL', 'context', 'a store', 'server cache'] },
      ],
      vars: ['what forced the move'],
      steps: [
        {
          note: 'One component, one `useState`. Most state ends here and should — the ladder is a list of escape hatches, not a progression to complete.',
          cursors: { rung: { now: 'useState' } },
          vars: { 'what forced the move': '—' },
        },
        {
          note: 'A sibling needs it too, so lift it to their closest common parent. Still no library, still no context.',
          cursors: { rung: { now: 'lift' } },
          marks: { rung: { lift: 'hit' } },
          vars: { 'what forced the move': 'a second reader' },
        },
        {
          note: 'The rung people skip: **the URL**. A filter, a tab, a page number and a selected id all belong in the query string — it makes the state shareable, refresh-proof and back-button-correct for free.',
          cursors: { rung: { now: 'the URL' } },
          marks: { rung: { 'the URL': 'hit' } },
          vars: { 'what forced the move': 'it should survive a refresh' },
        },
        {
          note: 'Context next, when the depth of the prop drilling is the problem — not the number of readers. Memoise the value and split by update rate, or you have traded drilling for re-renders.',
          cursors: { rung: { now: 'context' } },
          marks: { rung: { context: 'window' } },
          vars: { 'what forced the move': 'four levels of pass-through' },
        },
        {
          note: 'And the distinction that matters most, 6 versus 7: a store is for **client** state with many writers; a server cache is for data someone else owns. Reaching for Redux to hold fetched data is the most common wrong answer to this question.',
          cursors: { rung: { now: 'server cache' } },
          marks: { rung: { 'a store': 'window', 'server cache': 'hit' } },
          vars: { 'what forced the move': 'the server owns the truth' },
        },
      ],
      result: 'The URL is a rung; server data is not state',
    },
  },

  /* ── 27 · Redux in one page ────────────────────────────────────── */
  27: {
    diagram: 'redux_flow',
    alt: 'The Redux loop and what RTK removes',
    after: '## The Solution — one-way flow',
    trace: {
      input: 'Clicking "Add to cart"',
      lanes: [
        { id: 'phase', label: 'step', kind: 'phases', of: ['UI event', 'dispatch', 'reducer', 'store', 'selector', 're-render'] },
        { id: 'log', label: 'devtools', kind: 'log' },
      ],
      vars: ['state', 'who re-renders'],
      steps: [
        {
          note: 'The click handler does not change anything. It describes what happened: `{ type: "cart/add", payload: 42 }`.',
          cursors: { phase: { now: 'dispatch' } },
          cells: { log: ['cart/add  { payload: 42 }'] },
          vars: { state: '{ items: [] }', 'who re-renders': 'nobody yet' },
        },
        {
          note: 'The reducer receives the current state and that action, and returns the next state. Pure — no fetches, no `Date.now()`, no mutation — which is what makes it replayable.',
          cursors: { phase: { now: 'reducer' } },
          marks: { log: { 0: 'active' } },
          cells: { log: ['cart/add  { payload: 42 }'] },
          vars: { state: '{ items: [42] }', 'who re-renders': 'nobody yet' },
        },
        {
          note: 'The store holds one object tree for the whole app, and `dispatch` is the only way in. That single entry point is what devtools, time-travel and middleware are built on.',
          cursors: { phase: { now: 'store' } },
          marks: { log: { 0: 'done' } },
          cells: { log: ['cart/add  { payload: 42 }  — logged, replayable'] },
          vars: { state: '{ items: [42] }', 'who re-renders': 'nobody yet' },
        },
        {
          note: 'Each `useSelector` re-runs and compares its **slice**. `CartBadge` selected `items.length`, which changed from 0 to 1, so it re-renders.',
          cursors: { phase: { now: 'selector' } },
          marks: { log: { 1: 'hit' } },
          cells: { log: ['cart/add  { payload: 42 }  — logged, replayable', 'CartBadge: 0 → 1 → re-render'] },
          vars: { state: '{ items: [42] }', 'who re-renders': 'CartBadge' },
        },
        {
          note: '`Header`, which selected `user.name`, does not — its slice is unchanged. And RTK removes the boilerplate around all of this: `createSlice` generates the action types and creators, and Immer lets you write `state.items.push(...)` while still producing a new object.',
          cursors: { phase: { now: 're-render' } },
          marks: { log: { 2: 'skip' } },
          cells: { log: ['CartBadge: 0 → 1 → re-render', 'Header: "Ada" → "Ada" → skipped'] },
          vars: { state: '{ items: [42] }', 'who re-renders': 'CartBadge only  ✓' },
        },
      ],
      result: 'Every change is a loggable object; selectors keep renders narrow',
    },
  },

  /* ── 28 · Scalable React architecture ──────────────────────────── */
  28: {
    diagram: 'state_ladder',
    alt: 'Feature folders and state ownership',
    after: '## The Problem',
    trace: {
      input: 'src/components/ with 180 files in it',
      lanes: [
        {
          id: 'tree',
          label: 'structure',
          kind: 'tree',
          nodes: [
            { id: 'src', label: 'src' },
            { id: 'comps', label: 'components/ · 180 files', parent: 'src' },
            { id: 'hooks', label: 'hooks/ · 40 files', parent: 'src' },
            { id: 'utils', label: 'utils/ · 60 files', parent: 'src' },
          ],
        },
      ],
      vars: ['to change checkout you open', 'what breaks'],
      steps: [
        {
          note: 'Organised by *kind*. A checkout change means touching three folders and reading past 170 unrelated files to find the four that matter.',
          marks: { tree: { comps: 'bad', hooks: 'bad', utils: 'bad' } },
          vars: { 'to change checkout you open': '3 folders, 280 files', 'what breaks': 'unknowable without grep' },
        },
        {
          note: 'Reorganised by *feature*: `features/checkout/` holds its components, hooks, API calls and tests together. The blast radius of a change is now a directory.',
          marks: { tree: { comps: 'hit' } },
          vars: { 'to change checkout you open': '1 folder', 'what breaks': 'what is in that folder' },
        },
        {
          note: 'The rule that stops it rotting: a feature may import from `shared/`, never from another feature. Cross-feature needs go up into `shared/` or through a route — otherwise you get folders with a dependency graph as tangled as before.',
          marks: { tree: { comps: 'window' } },
          vars: { 'to change checkout you open': '1 folder', 'what breaks': 'enforced by lint, not by hope' },
        },
        {
          note: 'State follows the same boundary. Feature-local state stays inside the feature; only genuinely cross-cutting state goes up — which is the decision ladder applied at the folder level.',
          marks: { tree: { hooks: 'skip', utils: 'skip' } },
          vars: { 'to change checkout you open': '1 folder', 'what breaks': 'one feature' },
        },
        {
          note: 'And the honest caveat: at fifteen components this is overhead. Reorganise when navigating the folder is costing you, not on the first commit — the structure is a response to size, not a prerequisite for it.',
          marks: { tree: { src: 'window' } },
          vars: { 'to change checkout you open': '1 folder', 'what breaks': 'nothing, until it is too early' },
        },
      ],
      result: 'By feature, with a one-way import rule',
    },
  },
  },
  'react-mcq-questions': {
  /* ── 1 · Three setCount calls with the value form ──────────────── */
  1: {
    diagram: 'batching_updates',
    alt: 'Batching and the update queue',
    trace: {
      input: 'setCount(count + 1) × 3, with count === 0 in this render',
      lanes: [
        { id: 'queue', label: 'queue', kind: 'log' },
        { id: 'vals', label: 'values', kind: 'slots', slots: ['count in this render', 'queued result'] },
      ],
      vars: ['renders scheduled'],
      steps: [
        {
          note: '`count` is 0 in this render — a plain local, captured by the handler when it was created.',
          marks: { vals: { 'count in this render': 'window' } },
          cells: { queue: [], vals: ['0', '—'] },
          vars: { 'renders scheduled': '0' },
        },
        {
          note: 'First call. `count + 1` is `0 + 1`, so the queue gets "set to 1".',
          marks: { queue: { 0: 'active' } },
          cells: { queue: ['set 1'], vals: ['0', '1'] },
          vars: { 'renders scheduled': '1' },
        },
        {
          note: 'Second call. `count` is still 0 — nothing reassigned it, and nothing could. So the queue gets "set to 1" again.',
          marks: { queue: { 1: 'bad' } },
          cells: { queue: ['set 1', 'set 1'], vals: ['0', '1'] },
          vars: { 'renders scheduled': '1 — batched' },
        },
        {
          note: 'Third call, same. Three entries, all of them "set to 1", because all three read the same frozen local.',
          marks: { queue: { '0-2': 'bad' } },
          cells: { queue: ['set 1', 'set 1', 'set 1'], vals: ['0', '1'] },
          vars: { 'renders scheduled': '1 — batched' },
        },
        {
          note: 'One re-render, `count` is 1. With `setCount(c => c + 1)` each entry would receive the previous result — 0→1, 1→2, 2→3 — and the answer would be 3.',
          marks: { queue: { '0-2': 'skip' }, vals: { 'queued result': 'hit' } },
          cells: { queue: ['c => c+1  → 1', 'c => c+1  → 2', 'c => c+1  → 3'], vals: ['0', '3 with the updater'] },
          vars: { 'renders scheduled': '1' },
        },
      ],
      result: 'B — 1',
    },
  },

  /* ── 2 · Cleanup order with [count] ────────────────────────────── */
  2: {
    diagram: 'effect_deps_cleanup',
    alt: 'Cleanup runs before the next effect',
    trace: {
      input: 'useEffect(…, [count]) — count goes 0 → 1',
      lanes: [
        { id: 'phase', label: 'phase', kind: 'phases', of: ['render', 'commit', 'cleanup', 'effect'] },
        { id: 'log', label: 'console', kind: 'log' },
      ],
      vars: ['count in the old closure', 'count in the new one'],
      steps: [
        {
          note: 'After mount the effect ran once and logged `effect 0`. Its cleanup function closed over that render\'s `count` — the number 0.',
          cursors: { phase: { now: 'effect' } },
          marks: { log: { 0: 'done' } },
          cells: { log: ['effect 0'] },
          vars: { 'count in the old closure': '0', 'count in the new one': '—' },
        },
        {
          note: 'The click sets `count` to 1. React re-renders and commits, then notices the dependency changed.',
          cursors: { phase: { now: 'commit' } },
          cells: { log: ['effect 0'] },
          vars: { 'count in the old closure': '0', 'count in the new one': '1' },
        },
        {
          note: 'Cleanup runs **first** — and it is the *old* render\'s cleanup, holding the old value. So it logs `cleanup 0`, not `cleanup 1`.',
          cursors: { phase: { now: 'cleanup' } },
          marks: { log: { 1: 'hit' } },
          cells: { log: ['effect 0', 'cleanup 0'] },
          vars: { 'count in the old closure': '0  ← this one runs', 'count in the new one': '1' },
        },
        {
          note: 'Then the new effect runs with the new closure: `effect 1`.',
          cursors: { phase: { now: 'effect' } },
          marks: { log: { 2: 'hit' } },
          cells: { log: ['effect 0', 'cleanup 0', 'effect 1'] },
          vars: { 'count in the old closure': 'discarded', 'count in the new one': '1' },
        },
        {
          note: 'Both halves of the answer come from the same fact — each render has its own closure — and the ordering is what makes an effect safe to re-run at all.',
          marks: { log: { '1-2': 'hit' } },
          cells: { log: ['effect 0', 'cleanup 0', 'effect 1'] },
          vars: { 'count in the old closure': '0', 'count in the new one': '1' },
        },
      ],
      result: 'B — "cleanup 0", then "effect 1"',
    },
  },

  /* ── 3 · What does not re-render ───────────────────────────────── */
  3: {
    diagram: 'rerender_triggers',
    alt: 'What does and does not schedule a render',
    trace: {
      input: 'Four candidate causes, one of which is invisible to React',
      lanes: [
        { id: 'cause', label: 'cause', kind: 'slots', slots: ['same value', 'parent rendered', 'ref.current =', 'context changed'] },
      ],
      vars: ['React is notified?'],
      steps: [
        {
          note: 'A — `setState` with the same value. React *is* notified; it compares with `Object.is`, finds no change, and bails out. It may still render once before bailing.',
          marks: { cause: { 'same value': 'window' } },
          vars: { 'React is notified?': 'yes — then it bails' },
        },
        {
          note: 'B — the parent re-rendered. The default is to render the whole subtree, so this is one of the three real triggers.',
          marks: { cause: { 'parent rendered': 'bad' } },
          vars: { 'React is notified?': 'yes' },
        },
        {
          note: 'D — a context value changed. Every consumer is subscribed directly and re-renders, `memo` in between or not.',
          marks: { cause: { 'context changed': 'bad' } },
          vars: { 'React is notified?': 'yes' },
        },
        {
          note: 'C — `ref.current = x`. This is a plain property write on a plain object. There is no setter, no proxy, no listener — React is never told, so nothing is scheduled.',
          marks: { cause: { 'ref.current =': 'hit' } },
          vars: { 'React is notified?': '**no**' },
        },
        {
          note: 'Which is exactly what a ref is for: a value that survives renders without causing one — a timer id, a DOM node, a previous value. The same silence makes it wrong for anything displayed.',
          marks: { cause: { 'ref.current =': 'hit' } },
          vars: { 'React is notified?': 'no — by design' },
        },
      ],
      result: 'C — changing a useRef value',
    },
  },

  /* ── 4 · useEffect with [] ─────────────────────────────────────── */
  4: {
    diagram: 'effect_deps_cleanup',
    alt: 'The three dependency-array shapes',
    trace: {
      input: 'useEffect(() => { fetchData(); }, [])',
      lanes: [
        { id: 'log', label: 'fetchData calls', kind: 'log' },
        { id: 'phase', label: 'lifecycle', kind: 'phases', of: ['mount', 'update', 'update', 'unmount'] },
      ],
      vars: ['deps compared', 'ran?'],
      steps: [
        {
          note: 'Mount. There is no previous deps array to compare against, so the effect runs — after the first paint, not before it.',
          cursors: { phase: { now: 'mount' } },
          marks: { log: { 0: 'hit' } },
          cells: { log: ['fetchData()'] },
          vars: { 'deps compared': 'none yet', 'ran?': 'yes' },
        },
        {
          note: 'A re-render. React compares `[]` with `[]` — both empty, so every element matches, and the effect is skipped.',
          cursors: { phase: { now: 'update' } },
          cells: { log: ['fetchData()'] },
          vars: { 'deps compared': '[] vs [] — equal', 'ran?': 'no' },
        },
        {
          note: 'And again. An empty array can never differ from an empty array, so this is true for every subsequent render, forever.',
          cursors: { phase: { now: 'update' } },
          cells: { log: ['fetchData()'] },
          vars: { 'deps compared': '[] vs [] — equal', 'ran?': 'no' },
        },
        {
          note: 'Unmount. The **cleanup** runs here — but there is none in this code, so nothing happens. A fetch with no cleanup can set state after unmount.',
          cursors: { phase: { now: 'unmount' } },
          marks: { log: { 1: 'window' } },
          cells: { log: ['fetchData()', '(no cleanup to run)'] },
          vars: { 'deps compared': 'n/a', 'ran?': 'no' },
        },
        {
          note: 'So: only on mount. Worth knowing that StrictMode in development runs mount → cleanup → mount, which is why a fetch here fires twice locally and once in production.',
          marks: { log: { 0: 'hit' } },
          cells: { log: ['fetchData()  — once in production'] },
          vars: { 'deps compared': '[] — constant', 'ran?': 'once' },
        },
      ],
      result: 'B — only on mount',
    },
  },

  /* ── 5 · memo defeated by an inline object ─────────────────────── */
  5: {
    diagram: 'memo_reference_trap',
    alt: 'An inline object prop defeats memo',
    trace: {
      input: 'const data = { name: "Alice" } in Parent\'s body',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'parent', label: 'Parent · useState(count)' },
            { id: 'child', label: 'React.memo(Child)', parent: 'parent' },
          ],
        },
        { id: 'log', label: 'console', kind: 'log' },
      ],
      vars: ['data', 'Object.is(prev, next)'],
      steps: [
        {
          note: 'First render. `data` is created — obj#1 — and Child renders, logging once.',
          marks: { tree: { parent: 'active', child: 'active' }, log: { 0: 'active' } },
          cells: { log: ['Child rendered'] },
          vars: { data: 'obj#1', 'Object.is(prev, next)': 'n/a' },
        },
        {
          note: 'The button is clicked. `setCount` re-renders Parent, which re-runs its whole body — including the line that creates `data`.',
          cursors: { tree: { at: 'parent' } },
          marks: { tree: { parent: 'active' } },
          cells: { log: ['Child rendered'] },
          vars: { data: 'obj#2  (new object)', 'Object.is(prev, next)': 'about to run' },
        },
        {
          note: '`memo` shallow-compares the props. `{ name: "Alice" }` and `{ name: "Alice" }` have the same contents and different identities — and `Object.is` compares identity.',
          cursors: { tree: { at: 'child' } },
          marks: { tree: { child: 'bad' } },
          cells: { log: ['Child rendered', 'Child rendered  ← memo did not help'] },
          vars: { data: 'obj#2 ≠ obj#1', 'Object.is(prev, next)': 'false' },
        },
        {
          note: 'So Child re-renders on every click. The `memo` is not broken — it is being asked to compare two different objects.',
          marks: { tree: { child: 'bad' } },
          cells: { log: ['Child rendered', 'Child rendered', 'Child rendered'] },
          vars: { data: 'a new object every render', 'Object.is(prev, next)': 'false, always' },
        },
        {
          note: 'Fix: `useMemo(() => ({ name: "Alice" }), [])`, or hoist it out of the component entirely since it depends on nothing. Then the compare succeeds and Child is skipped.',
          marks: { tree: { parent: 'done', child: 'skip' } },
          cells: { log: ['Child rendered  — once  ✓'] },
          vars: { data: 'obj#1 === obj#1', 'Object.is(prev, next)': 'true' },
        },
      ],
      result: 'B — `data` is a new object reference each render',
    },
  },

  /* ── 6 · defaultValue ──────────────────────────────────────────── */
  6: {
    diagram: 'controlled_uncontrolled',
    alt: 'Who holds the value',
    trace: {
      input: '<input defaultValue="hello" />',
      lanes: [
        { id: 'who', label: 'value in', kind: 'slots', slots: ['React state', 'the DOM node'] },
      ],
      vars: ['React knows the value?'],
      steps: [
        {
          note: 'Mount. `defaultValue` sets the DOM node\'s initial value once, then steps out of the way — it is not a binding.',
          marks: { who: { 'the DOM node': 'active' } },
          cells: { who: ['—', '"hello"'] },
          vars: { 'React knows the value?': 'only what it set' },
        },
        {
          note: 'The user types. The DOM node updates itself, the way an `<input>` has always worked. No render, no state.',
          marks: { who: { 'the DOM node': 'hit' } },
          cells: { who: ['—', '"hello world"'] },
          vars: { 'React knows the value?': '**no**' },
        },
        {
          note: 'To read it you need a ref: `inputRef.current.value` at submit time. There is nowhere else the value exists.',
          marks: { who: { 'the DOM node': 'hit' } },
          cells: { who: ['—', '"hello world"'] },
          vars: { 'React knows the value?': 'only when it asks' },
        },
        {
          note: 'That is the definition of uncontrolled: the DOM is the source of truth, and React is a spectator.',
          marks: { who: { 'React state': 'window' } },
          cells: { who: ['—', '"hello world"'] },
          vars: { 'React knows the value?': 'no' },
        },
        {
          note: 'Controlled is the other half: `value={v}` plus `onChange`. Note that `value` **without** `onChange` gives a read-only field and a warning — the pairing is what makes it controlled.',
          marks: { who: { 'React state': 'hit', 'the DOM node': 'skip' } },
          cells: { who: ['"hello world"', '"hello world"'] },
          vars: { 'React knows the value?': 'yes, every keystroke' },
        },
      ],
      result: 'B — uncontrolled',
    },
  },

  /* ── 7 · What error boundaries catch ───────────────────────────── */
  7: {
    diagram: 'error_boundaries',
    alt: 'The scope of an error boundary',
    trace: {
      input: 'The same error thrown from four places',
      lanes: [
        { id: 'src', label: 'thrown from', kind: 'slots', slots: ['render', 'lifecycle', 'event handler', 'setTimeout'] },
      ],
      vars: ['caught?', 'why'],
      steps: [
        {
          note: 'During render. The boundary is in the middle of that render pass, so it can catch the throw and swap in a fallback.',
          marks: { src: { render: 'hit' } },
          vars: { 'caught?': 'yes', why: 'React is on the stack' },
        },
        {
          note: 'In a lifecycle method or a constructor of a descendant. Same answer, same reason — still inside the work React is driving.',
          marks: { src: { lifecycle: 'hit' } },
          vars: { 'caught?': 'yes', why: 'React is on the stack' },
        },
        {
          note: 'In an `onClick`. Rendering finished long ago; the browser is calling your function directly. React is not on the stack and has nothing to catch.',
          marks: { src: { 'event handler': 'bad' } },
          vars: { 'caught?': 'no', why: 'the render is over' },
        },
        {
          note: 'In a `setTimeout` or a `.then()`. Same again, and it is the same reason both times rather than two separate rules.',
          marks: { src: { setTimeout: 'bad' } },
          vars: { 'caught?': 'no', why: 'a different task entirely' },
        },
        {
          note: 'The bridge for the uncaught two: catch it yourself, put it in state, and re-throw during render — `if (error) throw error`. Now React *is* on the stack, and the boundary works.',
          marks: { src: { 'event handler': 'window', setTimeout: 'window' } },
          vars: { 'caught?': 'yes, once bridged', why: 'you moved it into render' },
        },
      ],
      result: 'C — rendering, lifecycle methods and constructors of descendants',
    },
  },

  /* ── 8 · Portal event bubbling ─────────────────────────────────── */
  8: {
    diagram: 'portals_stacking',
    alt: 'Events follow the React tree, not the DOM tree',
    trace: {
      input: 'A Modal portalled to #modal-root, rendered inside <Card onClick>',
      lanes: [
        {
          id: 'react',
          label: 'React',
          kind: 'tree',
          nodes: [
            { id: 'card', label: 'Card · onClick' },
            { id: 'modal', label: 'Modal', parent: 'card' },
            { id: 'btn', label: 'button', parent: 'modal' },
          ],
        },
        {
          id: 'dom',
          label: 'DOM',
          kind: 'tree',
          nodes: [
            { id: 'body', label: 'body' },
            { id: 'root', label: 'div#root', parent: 'body' },
            { id: 'dcard', label: 'div.card', parent: 'root' },
            { id: 'proot', label: 'div#modal-root', parent: 'body' },
          ],
        },
      ],
      vars: ['Card onClick fires?', 'context reaches Modal?'],
      steps: [
        {
          note: 'The modal\'s DOM node is appended to `#modal-root`, which is not inside `div.card` at all — that is the whole point of the portal.',
          marks: { dom: { proot: 'active' } },
          vars: { 'Card onClick fires?': '?', 'context reaches Modal?': '?' },
        },
        {
          note: 'In the React tree nothing moved. `Modal` is still `Card`\'s child, so it still receives Card\'s props and still reads any context Card provides — ruling out option D.',
          marks: { react: { card: 'active', modal: 'hit' } },
          vars: { 'Card onClick fires?': '?', 'context reaches Modal?': 'yes' },
        },
        {
          note: 'A click inside the modal. Native bubbling goes up the DOM — `#modal-root`, `body` — and never passes `div.card`.',
          cursors: { dom: { at: 'proot' } },
          marks: { dom: { proot: 'active', body: 'window', dcard: 'skip' } },
          vars: { 'Card onClick fires?': 'not via the DOM', 'context reaches Modal?': 'yes' },
        },
        {
          note: 'But React propagates its own synthetic events along the **React** tree. So the event travels Modal → Card, and `Card`\'s `onClick` fires — ruling out option A.',
          cursors: { react: { at: 'card' } },
          marks: { react: { btn: 'active', modal: 'window', card: 'hit' } },
          vars: { 'Card onClick fires?': '**yes**', 'context reaches Modal?': 'yes' },
        },
        {
          note: 'And styles come from the modal\'s own classes, not from wherever the node landed — ruling out B. The practical consequence: a "click outside to close" handler on Card sees this click as inside.',
          marks: { react: { card: 'hit' }, dom: { proot: 'skip' } },
          vars: { 'Card onClick fires?': 'yes', 'context reaches Modal?': 'yes' },
        },
      ],
      result: 'C — events bubble through React\'s tree, not the DOM tree',
    },
  },

  /* ── 9 · useLayoutEffect vs useEffect ──────────────────────────── */
  9: {
    diagram: 'render_commit_effects',
    alt: 'Where each effect sits in the commit cycle',
    trace: {
      input: 'The commit cycle, with both effects present',
      lanes: [
        { id: 'phase', label: 'order', kind: 'phases', of: ['render', 'DOM mutated', 'useLayoutEffect', 'paint', 'useEffect'] },
      ],
      vars: ['DOM updated?', 'user has seen it?'],
      steps: [
        {
          note: 'Render. The output is computed; the DOM is still showing the previous version.',
          cursors: { phase: { now: 'render' } },
          vars: { 'DOM updated?': 'no', 'user has seen it?': 'no' },
        },
        {
          note: 'React mutates the DOM. Note this comes **before** either effect — which is what rules out option A.',
          cursors: { phase: { now: 'DOM mutated' } },
          marks: { phase: { 'DOM mutated': 'window' } },
          vars: { 'DOM updated?': 'yes', 'user has seen it?': 'no' },
        },
        {
          note: '`useLayoutEffect` runs synchronously here, after the mutation and before paint. It can read layout and change it invisibly — and it is blocking the browser while it does.',
          cursors: { phase: { now: 'useLayoutEffect' } },
          marks: { phase: { useLayoutEffect: 'hit' } },
          vars: { 'DOM updated?': 'yes', 'user has seen it?': 'no — the window' },
        },
        {
          note: 'Paint. The first frame the user sees.',
          cursors: { phase: { now: 'paint' } },
          marks: { phase: { paint: 'window' } },
          vars: { 'DOM updated?': 'yes', 'user has seen it?': 'yes' },
        },
        {
          note: '`useEffect` runs asynchronously after that, so it never delays the frame. Hence: layout effects block paint, passive effects follow it — option B.',
          cursors: { phase: { now: 'useEffect' } },
          marks: { phase: { useEffect: 'hit' } },
          vars: { 'DOM updated?': 'yes', 'user has seen it?': 'yes' },
        },
      ],
      result: 'B — synchronously after DOM mutation, before paint; useEffect after paint',
    },
  },

  /* ── 10 · Context re-renders all consumers ─────────────────────── */
  10: {
    diagram: 'context_propagation',
    alt: 'Consumers subscribe to the whole value',
    trace: {
      input: 'createContext({ user, theme }) — only `theme` changes',
      lanes: [
        {
          id: 'tree',
          label: 'tree',
          kind: 'tree',
          nodes: [
            { id: 'prov', label: 'MyContext.Provider' },
            { id: 'name', label: 'UserName · reads user', parent: 'prov' },
            { id: 'sw', label: 'ThemeSwitch · reads theme', parent: 'prov' },
          ],
        },
      ],
      vars: ['value reference', 'what UserName uses'],
      steps: [
        {
          note: '`UserName` destructures only `user`. It is tempting to read that as "it subscribes to `user`" — that is option A, and it is the wrong model.',
          marks: { tree: { name: 'window' } },
          vars: { 'value reference': 'obj#1', 'what UserName uses': 'user' },
        },
        {
          note: 'The subscription is to the provider\'s `value` **as a whole**. Destructuring happens after the component has already been told to re-render; it is ordinary JavaScript on a value React handed over.',
          marks: { tree: { prov: 'active' } },
          vars: { 'value reference': 'obj#1', 'what UserName uses': 'user, from the whole object' },
        },
        {
          note: 'The theme toggle fires. The provider passes a new object — `{ user, theme }` — so the value changed by reference.',
          cursors: { tree: { at: 'prov' } },
          marks: { tree: { prov: 'active' } },
          vars: { 'value reference': 'obj#2 ≠ obj#1', 'what UserName uses': 'user' },
        },
        {
          note: 'Every consumer is notified, `UserName` included — even though the `user` it reads is byte-for-byte the same. React has no field-level subscription to compare against.',
          marks: { tree: { name: 'bad', sw: 'bad' } },
          vars: { 'value reference': 'obj#2', 'what UserName uses': 'the same user as before' },
        },
        {
          note: 'The fixes follow directly: split the context so `user` and `theme` live apart, or put a selector layer on top. Memoising the value stops *spurious* changes but not this one — `theme` genuinely changed.',
          marks: { tree: { name: 'skip', sw: 'active' } },
          vars: { 'value reference': 'separate contexts', 'what UserName uses': 'UserContext only' },
        },
      ],
      result: 'B — any context value change re-renders all consumers',
    },
  },

  /* ── 11 · Index keys on a removal ──────────────────────────────── */
  11: {
    diagram: 'reconciliation_keys',
    alt: 'Index keys shift when the list changes',
    trace: {
      input: '<input key={index} defaultValue={item.name}/> — the first item is removed',
      lanes: [
        { id: 'before', label: 'before', cells: ['Ada', 'Grace', 'Linus'], indices: true },
        { id: 'after', label: 'after', cells: ['Grace', 'Linus'], indices: true },
      ],
      vars: ['key at slot 0', 'DOM value at slot 0'],
      steps: [
        {
          note: 'Three uncontrolled inputs. `defaultValue` seeds each DOM node once, and from then on the node owns its own value.',
          marks: { before: { '0-2': 'window' } },
          vars: { 'key at slot 0': '0 → Ada', 'DOM value at slot 0': '"Ada"' },
        },
        {
          note: 'Remove the first item. The array shifts: Grace is now at index 0, so her key is 0 — the key Ada had a moment ago.',
          marks: { before: { 0: 'bad' }, after: { 0: 'active' } },
          vars: { 'key at slot 0': '0 → Grace', 'DOM value at slot 0': '"Ada"' },
        },
        {
          note: 'React matches by key. Key 0 existed before and exists now, and the type is the same, so it **reuses** that fiber and its DOM node.',
          marks: { after: { 0: 'bad' } },
          vars: { 'key at slot 0': '0 — matched to the old one', 'DOM value at slot 0': '"Ada"  ← kept' },
        },
        {
          note: 'It updates the props that differ — but `defaultValue` only applies on mount, and this node did not remount. The first input still shows "Ada".',
          marks: { after: { 0: 'bad', 1: 'bad' } },
          vars: { 'key at slot 0': '0', 'DOM value at slot 0': '**"Ada"** — the removed item\'s value' },
        },
        {
          note: 'With `key={item.id}` there is no index to shift. React sees Ada\'s key is gone, unmounts exactly that node, and every surviving row keeps its own.',
          marks: { after: { '0-1': 'hit' } },
          vars: { 'key at slot 0': 'grace-id', 'DOM value at slot 0': '"Grace"  ✓' },
        },
      ],
      result: 'C — the first input shows the second item\'s original value',
    },
  },

  /* ── 12 · Suspense fallback timing ─────────────────────────────── */
  12: {
    diagram: 'suspense_lazy',
    alt: 'The fallback covers the chunk download',
    trace: {
      input: 'React.lazy(() => import("./Heavy")) inside <Suspense fallback={<Loading/>}>',
      lanes: [
        { id: 'phase', label: 'state', kind: 'phases', of: ['idle', 'chunk loading', 'rendering Heavy', 'done'] },
        { id: 'log', label: 'on screen', kind: 'log' },
      ],
      vars: ['promise', 'what is shown'],
      steps: [
        {
          note: 'App renders and reaches `<LazyComp/>`. The module has not been fetched, so `lazy` starts the dynamic `import()` and suspends.',
          cursors: { phase: { now: 'chunk loading' } },
          marks: { log: { 0: 'active' } },
          cells: { log: ['<Loading/>'] },
          vars: { promise: 'pending — the network request', 'what is shown': '<Loading/>' },
        },
        {
          note: 'The nearest boundary above catches the suspension and renders its fallback. This is the whole window the fallback covers: while the promise is pending.',
          cursors: { phase: { now: 'chunk loading' } },
          marks: { log: { 0: 'hit' } },
          cells: { log: ['<Loading/>'] },
          vars: { promise: 'pending', 'what is shown': '<Loading/>' },
        },
        {
          note: 'The promise resolves to a module with a default export. React retries the subtree.',
          cursors: { phase: { now: 'rendering Heavy' } },
          cells: { log: ['<Loading/>', 'retry → Heavy renders'] },
          vars: { promise: 'resolved', 'what is shown': 'still <Loading/> for this instant' },
        },
        {
          note: 'Heavy renders and commits. Note that rendering itself is synchronous — it does not suspend, which is what rules out option B.',
          cursors: { phase: { now: 'done' } },
          marks: { log: { 1: 'hit' } },
          cells: { log: ['<Loading/>', 'Heavy'] },
          vars: { promise: 'resolved', 'what is shown': 'Heavy' },
        },
        {
          note: 'And an error in the import is not a Suspense concern — that needs an error boundary, ruling out C. The fallback covers the download, and only the download.',
          marks: { log: { 1: 'hit' } },
          cells: { log: ['<Loading/>  — while downloading', 'Heavy  — after'] },
          vars: { promise: 'resolved', 'what is shown': 'Heavy' },
        },
      ],
      result: 'A — while the Heavy module is being downloaded',
    },
  },

  /* ── 13 · startTransition ──────────────────────────────────────── */
  13: {
    diagram: 'concurrent_lanes',
    alt: 'Marking an update as non-urgent',
    trace: {
      input: 'setInputValue urgent; setSearchResults inside startTransition',
      lanes: [
        { id: 'lane', label: 'lane', kind: 'slots', slots: ['urgent', 'transition'] },
        { id: 'log', label: 'main thread', kind: 'log' },
      ],
      vars: ['input latency', 'isPending'],
      steps: [
        {
          note: 'One keystroke produces two state updates. `setInputValue` is left urgent; `setSearchResults` is wrapped.',
          marks: { lane: { urgent: 'active', transition: 'active' } },
          cells: { lane: ['setInputValue', 'setSearchResults'], log: ['keypress'] },
          vars: { 'input latency': '—', isPending: 'true' },
        },
        {
          note: 'React renders and commits the urgent lane on its own. The character appears in a few milliseconds — it did not wait behind the filter.',
          marks: { lane: { urgent: 'hit' } },
          cells: { lane: ['committed', 'queued'], log: ['keypress', 'urgent commit — 4 ms'] },
          vars: { 'input latency': '4 ms', isPending: 'true' },
        },
        {
          note: 'The transition renders in slices, yielding between them so the browser can handle input. This is what "interruptible" means — ruling out option A, which describes a debounce.',
          marks: { lane: { transition: 'window' } },
          cells: { lane: ['idle', 'rendering, yielding'], log: ['keypress', 'urgent commit — 4 ms', 'transition rendering (interruptible)'] },
          vars: { 'input latency': '4 ms', isPending: 'true' },
        },
        {
          note: 'Another keystroke arrives. React discards the partial tree and restarts with the new query — it does not wait for a pause in typing, which rules out D.',
          marks: { lane: { transition: 'bad', urgent: 'hit' } },
          cells: { lane: ['setInputValue', 'restarted'], log: ['keypress → discard the work in progress, restart'] },
          vars: { 'input latency': '4 ms', isPending: 'true' },
        },
        {
          note: 'It all runs on the main thread — there is no worker involved, which rules out C. The work is not faster; it is interruptible, so the urgent update never queues behind it.',
          marks: { lane: { transition: 'hit' } },
          cells: { lane: ['idle', 'committed'], log: ['transition committed — same total work'] },
          vars: { 'input latency': '4 ms throughout', isPending: 'false' },
        },
      ],
      result: 'B — marks the update non-urgent so React can interrupt it',
    },
  },

  /* ── 14 · Valid use of hooks ───────────────────────────────────── */
  14: {
    diagram: 'hook_slots',
    alt: 'Hooks are matched by call order',
    trace: {
      input: 'The four options, against one rule',
      lanes: [
        { id: 'slots', label: 'slots', kind: 'slots', slots: ['0', '1'] },
        { id: 'log', label: 'verdict', kind: 'log' },
      ],
      vars: ['call order stable?'],
      steps: [
        {
          note: 'React matches hook state by **position**, not by name. That single fact decides all four options.',
          marks: { slots: { 0: 'window', 1: 'window' } },
          cells: { slots: ['?', '?'], log: ['state is matched by call order'] },
          vars: { 'call order stable?': 'the only question' },
        },
        {
          note: 'A — inside an `if`. The hook runs on some renders and not others, so every slot after it shifts. React throws "Rendered fewer hooks than expected".',
          marks: { slots: { 0: 'bad' } },
          cells: { slots: ['shifts', '—'], log: ['state is matched by call order', 'A: conditional → order varies  ✗'] },
          vars: { 'call order stable?': 'no' },
        },
        {
          note: 'D — inside a `forEach`. Same problem with a different shape: the number of calls depends on the array length, so it changes whenever the data does.',
          marks: { slots: { 1: 'bad' } },
          cells: { slots: ['shifts', 'shifts'], log: ['A: conditional → order varies  ✗', 'D: loop → count varies  ✗'] },
          vars: { 'call order stable?': 'no' },
        },
        {
          note: 'C — inside a plain function. There is no fiber and no slot list outside a component or a custom hook, so there is nowhere for the state to live.',
          marks: { slots: { 0: 'bad', 1: 'bad' } },
          cells: { slots: ['no fiber', 'no fiber'], log: ['C: no fiber → nowhere to store state  ✗'] },
          vars: { 'call order stable?': 'n/a — no store at all' },
        },
        {
          note: 'B — top level of a component. Runs unconditionally, exactly once, in the same position on every render. That is the whole rule, and the reason for it.',
          marks: { slots: { 0: 'hit', 1: 'hit' } },
          cells: { slots: ['0 — count', '— '], log: ['B: top level → same order, every render  ✓'] },
          vars: { 'call order stable?': 'yes' },
        },
      ],
      result: 'B — at the top level of a component',
    },
  },

  /* ── 15 · Immutable updates ────────────────────────────────────── */
  15: {
    diagram: 'rerender_triggers',
    alt: 'React compares state by reference',
    trace: {
      input: 'items = [{ id: 1, done: false }] — toggling `done`',
      lanes: [
        { id: 'state', label: 'state', kind: 'slots', slots: ['reference', 'contents'] },
        { id: 'log', label: 'React', kind: 'log' },
      ],
      vars: ['Object.is(prev, next)', 'UI updates?'],
      steps: [
        {
          note: 'The mutating version: `items[0].done = true; setItems(items)`. The contents changed and the screen should follow.',
          marks: { state: { contents: 'active' } },
          cells: { state: ['arr#1', 'done: true'], log: ['setItems(items)'] },
          vars: { 'Object.is(prev, next)': 'about to run', 'UI updates?': '?' },
        },
        {
          note: 'But `setItems` received the same array it already had. `Object.is(arr#1, arr#1)` is true, so React concludes nothing changed and bails out.',
          marks: { state: { reference: 'bad' } },
          cells: { state: ['arr#1  (identical)', 'done: true'], log: ['setItems(items)', 'Object.is → true → bail out'] },
          vars: { 'Object.is(prev, next)': 'true', 'UI updates?': '**no**' },
        },
        {
          note: 'The data is now correct and the screen is wrong — the worst kind of bug, because nothing errored and the state looks right in the debugger.',
          marks: { state: { reference: 'bad', contents: 'bad' } },
          cells: { state: ['arr#1', 'done: true'], log: ['setItems(items)', 'Object.is → true → bail out', 'state ✓  ·  screen ✗'] },
          vars: { 'Object.is(prev, next)': 'true', 'UI updates?': 'no' },
        },
        {
          note: '`.map()` with a spread builds a **new** array containing a **new** object for the changed item, leaving the others untouched.',
          marks: { state: { reference: 'hit' } },
          cells: { state: ['arr#2  (new)', 'done: true'], log: ['setItems(items.map(…))', 'Object.is → false → re-render'] },
          vars: { 'Object.is(prev, next)': 'false', 'UI updates?': 'yes  ✓' },
        },
        {
          note: 'Keeping the unchanged items as the same references is the other half of the trick: a memoised row whose item did not change still bails out, so only the toggled row re-renders.',
          marks: { state: { reference: 'hit', contents: 'skip' } },
          cells: { state: ['arr#2', 'only item 1 is new'], log: ['unchanged rows keep their identity → memo still works'] },
          vars: { 'Object.is(prev, next)': 'false', 'UI updates?': 'yes — minimally' },
        },
      ],
      result: 'B — React uses Object.is; a mutation creates no new reference',
    },
  },
  },
};
