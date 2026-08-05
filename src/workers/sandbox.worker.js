import { runOutputCode } from '../utils/jsRunner.js';
import { runCodingTests } from '../utils/codingRunner.js';
import { formatTestValue } from '../utils/formatTestValue.js';

/**
 * Runs quiz snippets and user-authored solutions off the main thread.
 *
 * The point is not isolation — `new Function` still reaches the worker's own
 * globals — it is *interruptibility*. A `while (true)` here is killed by the
 * client calling `terminate()`; on the main thread it froze the tab forever.
 */

/** Test results carry raw runtime values, which are not always cloneable. */
function toTransferableResults(results) {
  return results.map((result) => ({
    passed: result.passed,
    expectedDisplay: formatTestValue(result.expected),
    gotDisplay: formatTestValue(result.got),
    logs: Array.isArray(result.logs) ? result.logs.slice(0, 100) : [],
  }));
}

self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data ?? {};

  try {
    if (type === 'output') {
      const { lines, error } = await runOutputCode(payload.code, { async: payload.async });
      self.postMessage({ id, ok: true, result: { lines, error } });
      return;
    }

    if (type === 'coding') {
      const { passed, total, results } = await runCodingTests(payload.code, payload.question);
      self.postMessage({
        id,
        ok: true,
        result: { passed, total, results: toTransferableResults(results) },
      });
      return;
    }

    self.postMessage({ id, ok: false, error: `Unknown sandbox task: ${type}` });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message || String(err) });
  }
});
