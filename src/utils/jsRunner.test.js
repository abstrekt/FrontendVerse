import test from 'node:test';
import assert from 'node:assert/strict';

import { runOutputCode } from './jsRunner.js';

const asyncRun = (code) => runOutputCode(code, { async: true });

test('timers fire in delay order, not insertion order', async () => {
  const { lines } = await asyncRun(`
    setTimeout(() => console.log('slow'), 100);
    setTimeout(() => console.log('fast'), 0);
    console.log('sync');
  `);

  assert.deepEqual(lines, ['sync', 'fast', 'slow']);
});

test('equal delays keep scheduling order', async () => {
  const { lines } = await asyncRun(`
    setTimeout(() => console.log('a'), 10);
    setTimeout(() => console.log('b'), 10);
    setTimeout(() => console.log('c'), 10);
  `);

  assert.deepEqual(lines, ['a', 'b', 'c']);
});

test('clearTimeout actually cancels', async () => {
  const { lines } = await asyncRun(`
    const id = setTimeout(() => console.log('should not run'), 0);
    clearTimeout(id);
    setTimeout(() => console.log('did run'), 0);
  `);

  assert.deepEqual(lines, ['did run']);
});

test('microtasks drain before macrotasks', async () => {
  const { lines } = await asyncRun(`
    console.log('start');
    setTimeout(() => console.log('timeout'), 0);
    Promise.resolve().then(() => console.log('promise'));
    console.log('end');
  `);

  assert.deepEqual(lines, ['start', 'end', 'promise', 'timeout']);
});

test('a timer callback does not see the runner internals as `this`', async () => {
  // Previously `this` was the internal {fn, args, order} task record, so a
  // snippet inspecting `this` inside a timer got nonsense. Sloppy-mode
  // functions coerce a nullish `this` to the global object, which is what a
  // real setTimeout callback sees.
  const { lines, error } = await asyncRun(`
    setTimeout(function () {
      console.log(typeof this.fn, typeof this.args, typeof this.order);
    }, 0);
  `);

  assert.equal(error, null);
  assert.deepEqual(lines, ['undefined undefined undefined']);
});

test('an arrow timer callback keeps the enclosing `this`', async () => {
  const { lines, error } = await asyncRun(`
    setTimeout(() => console.log('arrow ran'), 0);
  `);

  assert.equal(error, null);
  assert.deepEqual(lines, ['arrow ran']);
});

test('timer arguments are forwarded', async () => {
  const { lines } = await asyncRun(`setTimeout((a, b) => console.log(a + b), 0, 2, 3);`);
  assert.deepEqual(lines, ['5']);
});

test('a self-rescheduling timer is stopped rather than hanging the caller', async () => {
  const { error } = await asyncRun(`
    function tick() { setTimeout(tick, 1); }
    tick();
  `);

  assert.match(error ?? '', /TimerBudgetExceeded|rescheduling/);
});

test('thrown errors are reported as name: message', async () => {
  const { error, lines } = await runOutputCode(`null.foo;`);
  assert.deepEqual(lines, []);
  assert.match(error, /TypeError/);
});

test('sync snippets capture console output', async () => {
  const { lines, error } = await runOutputCode(`
    console.log(typeof undefined);
    console.log(0.1 + 0.2);
    console.log([1, 2] + [3]);
  `);

  assert.equal(error, null);
  assert.deepEqual(lines, ['undefined', '0.30000000000000004', '1,23']);
});
