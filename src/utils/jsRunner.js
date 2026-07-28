function formatConsoleArg(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value.toString();
  if (value === undefined) return 'undefined';
  if (Number.isNaN(value)) return 'NaN';
  if (value === null) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatConsoleLine(args) {
  return args.map(formatConsoleArg).join(' ');
}

function createSandboxConsole(lines) {
  const capture = (...args) => {
    lines.push(formatConsoleLine(args));
  };

  return {
    log: capture,
    info: capture,
    warn: capture,
    error: capture,
  };
}

async function flushAsync(macrotasks, microtasks) {
  await Promise.resolve();

  while (microtasks.length > 0) {
    const batch = microtasks.splice(0, microtasks.length);
    for (const task of batch) {
      task();
    }
    await Promise.resolve();
  }

  while (macrotasks.length > 0) {
    const batch = macrotasks.splice(0, macrotasks.length);
    for (const task of batch) {
      task.fn(...task.args);
    }
    await Promise.resolve();

    if (microtasks.length > 0) {
      const microBatch = microtasks.splice(0, microtasks.length);
      for (const task of microBatch) {
        task();
      }
      await Promise.resolve();
    }
  }
}

function createAsyncGlobals() {
  const macrotasks = [];
  const microtasks = [];

  const setTimeout = (fn, delay = 0, ...args) => {
    macrotasks.push({ fn, args, order: macrotasks.length });
    return macrotasks.length;
  };

  const setInterval = (fn, delay = 0, ...args) => setTimeout(fn, delay, ...args);

  const queueMicrotask = (fn) => {
    microtasks.push(fn);
  };

  return {
    setTimeout,
    setInterval,
    clearTimeout: () => {},
    clearInterval: () => {},
    queueMicrotask,
    flush: () => flushAsync(macrotasks, microtasks),
  };
}

export async function runOutputCode(code, { async: isAsync = false } = {}) {
  const lines = [];
  let error = null;
  const sandboxConsole = createSandboxConsole(lines);

  try {
    if (isAsync) {
      const timers = createAsyncGlobals();
      const runner = new AsyncFunction(
        'console',
        'setTimeout',
        'setInterval',
        'clearTimeout',
        'clearInterval',
        'queueMicrotask',
        'Promise',
        'Math',
        'JSON',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean',
        'Symbol',
        'Map',
        'Set',
        'WeakMap',
        'WeakSet',
        'Date',
        'RegExp',
        'Error',
        'TypeError',
        'ReferenceError',
        'SyntaxError',
        'RangeError',
        'parseInt',
        'parseFloat',
        'isNaN',
        'isFinite',
        'NaN',
        'Infinity',
        code
      );

      await runner(
        sandboxConsole,
        timers.setTimeout,
        timers.setInterval,
        timers.clearTimeout,
        timers.clearInterval,
        timers.queueMicrotask,
        Promise,
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Symbol,
        Map,
        Set,
        WeakMap,
        WeakSet,
        Date,
        RegExp,
        Error,
        TypeError,
        ReferenceError,
        SyntaxError,
        RangeError,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        NaN,
        Infinity
      );

      await timers.flush();
    } else {
      const runner = new Function(
        'console',
        'Math',
        'JSON',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean',
        'Symbol',
        'Map',
        'Set',
        'WeakMap',
        'WeakSet',
        'Date',
        'RegExp',
        'Error',
        'TypeError',
        'ReferenceError',
        'SyntaxError',
        'RangeError',
        'parseInt',
        'parseFloat',
        'isNaN',
        'isFinite',
        'NaN',
        'Infinity',
        code
      );

      runner(
        sandboxConsole,
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Symbol,
        Map,
        Set,
        WeakMap,
        WeakSet,
        Date,
        RegExp,
        Error,
        TypeError,
        ReferenceError,
        SyntaxError,
        RangeError,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        NaN,
        Infinity
      );
    }
  } catch (err) {
    error = err?.name && err?.message ? `${err.name}: ${err.message}` : String(err);
  }

  return { lines, error };
}

export function formatOutputLines(lines, error) {
  if (error) return error;
  if (!lines.length) return '';
  return lines.join(', ');
}
