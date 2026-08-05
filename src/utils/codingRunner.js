import { createTimerSandbox } from './timerSandbox.js';
import { createCapturingConsole } from './consoleCapture.js';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const SANDBOX_GLOBALS = [
  'Math', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean',
  'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Date', 'RegExp',
  'Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError',
  'AggregateError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'NaN', 'Infinity',
  'Promise', 'console', 'globalThis',
];

function getGlobalValues(sandboxConsole) {
  return SANDBOX_GLOBALS.map((name) => {
    if (name === 'console') return sandboxConsole;
    if (name === 'globalThis') return globalThis;
    return globalThis[name];
  });
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => deepEqual(a[key], b[key]));
}

function makePromises(values) {
  return values.map((v) => {
    if (v === 0) return Promise.reject('Error');
    return Promise.resolve(v);
  });
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

async function runExpressionTest(userCode, testCase, { async: isAsync = false }) {
  const { setup = '', code, expected } = testCase;
  const { lines: logs, console: sandboxConsole } = createCapturingConsole();
  const globalValues = getGlobalValues(sandboxConsole);
  const body = isAsync
    ? `${userCode}\n${setup}\nreturn await (${code});`
    : `${userCode}\n${setup}\nreturn (${code});`;
  const Fn = isAsync ? AsyncFunction : Function;
  const runner = new Fn(...SANDBOX_GLOBALS, body);
  const got = await runner(...globalValues);
  const passed = deepEqual(got, expected);
  return { passed, input: testCase, expected, got, logs };
}

async function runTimerTest(userCode, testCase) {
  const { setup = '', calls = [], code, expected } = testCase;
  const timers = createTimerSandbox();
  const { lines: logs, console: sandboxConsole } = createCapturingConsole();
  const globalValues = getGlobalValues(sandboxConsole);
  const timerGlobals = [
    timers.setTimeout,
    timers.setInterval,
    timers.clearTimeout,
    timers.clearInterval,
    timers.queueMicrotask,
    timers.advance,
  ];

  const callLines = calls.map((call) => {
    const parts = [];
    if (call.advance) parts.push(`await __advance(${call.advance});`);
    if (call.expr) parts.push(`${call.expr};`);
    return parts.join('\n');
  }).join('\n');

  const body = `${userCode}
${setup}
${callLines}
await __advance(10000);
return (${code});`;

  const runner = new AsyncFunction(
    ...SANDBOX_GLOBALS,
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'queueMicrotask', '__advance',
    body
  );
  const got = await runner(...globalValues, ...timerGlobals);
  const passed = deepEqual(got, expected);
  return { passed, input: testCase, expected, got, logs };
}

async function runSequentialResolutionTest(userCode, testCase) {
  const { input, expected } = testCase;
  const resolvedPromises = [];
  const { lines: logs, console: sandboxConsole } = createCapturingConsole();
  const globalValues = getGlobalValues(sandboxConsole);
  const wrappedCode = `${userCode}\nreturn sequentialResolution;`;
  const runner = new AsyncFunction(
    ...SANDBOX_GLOBALS,
    'resolvedPromises',
    'input',
    wrappedCode
  );
  const fn = await runner(...globalValues, resolvedPromises, input);
  const testPromises = makePromises(input.promises);

  try {
    await fn(testPromises, input.order);
    const correct = arraysEqual(resolvedPromises, expected.resolvedPromises)
      && expected.error === null;
    return {
      passed: correct,
      input,
      expected,
      got: { resolvedPromises: [...resolvedPromises] },
      logs,
    };
  } catch (err) {
    const errMsg = err?.message || String(err);
    const correct = expected.error !== null
      && errMsg === expected.error
      && arraysEqual(resolvedPromises, expected.resolvedPromises);
    return {
      passed: correct,
      input,
      expected,
      got: { resolvedPromises: [...resolvedPromises], error: errMsg },
      logs,
    };
  }
}

const RUNNERS = {
  sequentialResolution: runSequentialResolutionTest,
  expression: (userCode, tc) => runExpressionTest(userCode, tc, { async: false }),
  asyncExpression: (userCode, tc) => runExpressionTest(userCode, tc, { async: true }),
  timer: runTimerTest,
};

export async function runCodingTests(userCode, question) {
  const runnerType = question.runner ?? 'sequentialResolution';
  const runTest = RUNNERS[runnerType];
  const results = [];
  let passed = 0;

  if (!runTest) {
    return {
      passed: 0,
      total: question.testCases.length,
      results: question.testCases.map((tc) => ({
        passed: false,
        input: tc,
        expected: tc.expected,
        got: { error: `Unknown runner: ${runnerType}` },
      })),
    };
  }

  for (const testCase of question.testCases) {
    try {
      const result = await runTest(userCode, testCase);
      if (result.passed) passed++;
      results.push(result);
    } catch (err) {
      results.push({
        passed: false,
        input: testCase,
        expected: testCase.expected,
        got: { error: err?.message || String(err) },
      });
    }
  }

  return { passed, total: results.length, results };
}
