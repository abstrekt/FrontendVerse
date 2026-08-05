function formatConsoleArg(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value.toString();
  if (value === undefined) return 'undefined';
  if (typeof value === 'number' && Number.isNaN(value)) return 'NaN';
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

export function formatConsoleLine(args) {
  return args.map(formatConsoleArg).join(' ');
}

/**
 * A console that records instead of printing.
 *
 * Returns the backing array alongside it so callers can surface what the
 * snippet logged — both for grading output questions and for letting people
 * debug their own solutions in the coding editor.
 */
export function createCapturingConsole() {
  const lines = [];
  const capture = (...args) => {
    lines.push(formatConsoleLine(args));
  };

  return {
    lines,
    console: { log: capture, info: capture, warn: capture, error: capture, debug: capture },
  };
}
