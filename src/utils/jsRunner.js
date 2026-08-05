import { createTimerSandbox } from './timerSandbox.js';
import { createCapturingConsole } from './consoleCapture.js';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export async function runOutputCode(code, { async: isAsync = false } = {}) {
  const { lines, console: sandboxConsole } = createCapturingConsole();
  let error = null;

  try {
    if (isAsync) {
      const timers = createTimerSandbox();
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
