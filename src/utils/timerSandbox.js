/**
 * A virtual event loop for running quiz snippets and user solutions.
 *
 * Timers fire in delay order (not insertion order), `clearTimeout` actually
 * cancels, and callbacks are invoked with `this` undefined rather than bound to
 * the internal task record.
 *
 * Every drain is bounded. A snippet that reschedules itself — the natural shape
 * of a `setInterval` polyfill — would otherwise spin forever on the main thread.
 */
const MAX_TASKS_PER_DRAIN = 10000;

export class TimerBudgetExceeded extends Error {
  constructor() {
    super('Timer callbacks did not settle — is a timer rescheduling itself forever?');
    this.name = 'TimerBudgetExceeded';
  }
}

export function createTimerSandbox() {
  const macrotasks = [];
  const microtasks = [];
  let now = 0;
  let nextId = 1;

  const setTimeout = (fn, delay = 0, ...args) => {
    const id = nextId++;
    const ms = Number(delay);
    macrotasks.push({
      id,
      fn,
      args,
      runAt: now + (Number.isFinite(ms) && ms > 0 ? ms : 0),
      order: id,
    });
    // Stable sort by due time, then scheduling order — the ordering real
    // engines guarantee, and the one output questions are written against.
    macrotasks.sort((a, b) => a.runAt - b.runAt || a.order - b.order);
    return id;
  };

  const setInterval = (fn, delay = 0, ...args) => setTimeout(fn, delay, ...args);

  const clearTimeout = (id) => {
    const idx = macrotasks.findIndex((task) => task.id === id);
    if (idx >= 0) macrotasks.splice(idx, 1);
  };

  const queueMicrotask = (fn) => {
    microtasks.push(fn);
  };

  async function drainMicrotasks() {
    await Promise.resolve();
    while (microtasks.length > 0) {
      const batch = microtasks.splice(0, microtasks.length);
      // `this` is undefined inside a timer callback, not the task record.
      for (const task of batch) task.call(undefined);
      await Promise.resolve();
    }
  }

  /** Run every timer due at or before `now + ms`. */
  async function advance(ms = 0) {
    now += Number.isFinite(Number(ms)) ? Number(ms) : 0;
    let executed = 0;

    await drainMicrotasks();
    while (macrotasks.length > 0 && macrotasks[0].runAt <= now) {
      const task = macrotasks.shift();
      if (++executed > MAX_TASKS_PER_DRAIN) throw new TimerBudgetExceeded();
      task.fn.call(undefined, ...task.args);
      await drainMicrotasks();
    }
  }

  /** Run every pending timer, jumping virtual time forward to each in turn. */
  async function flush() {
    let executed = 0;
    await drainMicrotasks();
    while (macrotasks.length > 0) {
      const task = macrotasks.shift();
      if (++executed > MAX_TASKS_PER_DRAIN) throw new TimerBudgetExceeded();
      now = Math.max(now, task.runAt);
      task.fn.call(undefined, ...task.args);
      await drainMicrotasks();
    }
  }

  return {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval: clearTimeout,
    queueMicrotask,
    advance,
    flush,
  };
}
