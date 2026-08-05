import SandboxWorker from '../workers/sandbox.worker.js?worker';
import { runOutputCode } from './jsRunner.js';
import { runCodingTests } from './codingRunner.js';
import { formatTestValue } from './formatTestValue.js';

const DEFAULT_TIMEOUT_MS = 4000;

let worker = null;
let nextId = 1;
const pending = new Map();

function supportsWorker() {
  return typeof Worker !== 'undefined';
}

function handleMessage(event) {
  const { id, ok, result, error } = event.data ?? {};
  const entry = pending.get(id);
  if (!entry) return;

  pending.delete(id);
  clearTimeout(entry.timer);
  if (ok) entry.resolve(result);
  else entry.reject(new Error(error || 'Sandbox failed'));
}

function getWorker() {
  if (!worker) {
    worker = new SandboxWorker();
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', (event) => {
      // A worker-level error kills every task it was running.
      failAll(new Error(event.message || 'Sandbox worker crashed'));
    });
  }
  return worker;
}

function failAll(error) {
  for (const [, entry] of pending) {
    clearTimeout(entry.timer);
    entry.reject(error);
  }
  pending.clear();
}

/**
 * Kill the worker outright.
 *
 * The only way to stop a runaway loop: there is no cooperative cancellation to
 * ask for. The next call transparently spins up a fresh worker.
 */
function terminate() {
  if (!worker) return;
  worker.terminate();
  worker.removeEventListener('message', handleMessage);
  worker = null;
}

function post(type, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      terminate();
      failAll(new Error('Sandbox restarted'));
      reject(
        new Error(
          `Your code did not finish within ${Math.round(timeoutMs / 1000)}s — check for an infinite loop.`
        )
      );
    }, timeoutMs);

    pending.set(id, { resolve, reject, timer });
    getWorker().postMessage({ id, type, payload });
  });
}

/** Same shape as the raw runner, but interruptible. */
export function runOutputCodeSafely(code, { async: isAsync = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!supportsWorker()) return runOutputCode(code, { async: isAsync });
  return post('output', { code, async: isAsync }, timeoutMs);
}

/** Results come back with display strings rather than raw values (see the worker). */
export async function runCodingTestsSafely(code, question, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!supportsWorker()) {
    const { passed, total, results } = await runCodingTests(code, question);
    return {
      passed,
      total,
      results: results.map((result) => ({
        passed: result.passed,
        expectedDisplay: formatTestValue(result.expected),
        gotDisplay: formatTestValue(result.got),
        logs: result.logs ?? [],
      })),
    };
  }
  return post('coding', { code, question }, timeoutMs);
}
