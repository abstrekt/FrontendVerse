/** Sentinel a user can type when a snippet legitimately prints nothing. */
const NO_OUTPUT_ANSWERS = new Set(['(no output)', 'no output', 'nothing', '(nothing)', '(empty)']);

/**
 * Normalise incidental formatting differences without changing meaning.
 *
 * Deliberately case-*sensitive*: in JavaScript, case is frequently the whole
 * answer (`NaN` vs `nan`, `undefined` vs `Undefined`, `[object Object]`), so
 * lowercasing here silently accepts wrong answers.
 *
 * Whitespace inside string literals is collapsed along with everything else.
 * That is a knowing trade: it makes `{ a: 1 }` and `{a:1}` equivalent, at the
 * cost of not distinguishing `"a  b"` from `"a b"`.
 */
function normalizeOutput(value) {
  return String(value ?? '')
    .trim()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .replace(/,\s*/g, ',')
    .replace(/:\s+/g, ':');
}

function splitAnswerParts(value) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return [];

  if (normalized.includes('\n')) {
    return normalized
      .split('\n')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  if (/referenceerror|syntaxerror|typeerror|rangeerror/i.test(normalized)) {
    return [normalized];
  }

  return normalized
    .split(/,(?![^{[]*[}\]])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function linesToComparable(lines, error) {
  if (error) return [normalizeOutput(error)];
  return lines.map((line) => normalizeOutput(line));
}

function answerToComparable(answer) {
  return splitAnswerParts(answer).map((part) => normalizeOutput(part));
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function equalIgnoringCase(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value.toLowerCase() === b[index].toLowerCase());
}

function isNoOutputAnswer(answer) {
  const trimmed = String(answer ?? '').trim();
  return trimmed === '' || NO_OUTPUT_ANSWERS.has(trimmed.toLowerCase());
}

/**
 * Grade a typed answer against what the snippet actually printed.
 *
 * `caseMismatch` is set when the answer is right apart from capitalisation, so
 * the UI can say so instead of just marking it wrong.
 */
export function compareOutputAnswer(userAnswer, runtimeResult, fallbackLines = []) {
  const runtimeParts = linesToComparable(runtimeResult.lines, runtimeResult.error);
  const fallbackParts = fallbackLines.map((line) => normalizeOutput(line));
  const expectedParts = runtimeParts.length > 0 ? runtimeParts : fallbackParts;
  const userParts = answerToComparable(userAnswer);

  // A snippet that prints nothing is answerable: an empty box, or "(no output)".
  if (expectedParts.length === 0) {
    return { correct: isNoOutputAnswer(userAnswer), expectedParts, userParts };
  }

  if (!userParts.length) {
    return { correct: false, expectedParts, userParts };
  }

  const userJoined = normalizeOutput(userParts.join(', '));
  const expectedJoined = normalizeOutput(expectedParts.join(', '));

  if (arraysEqual(userParts, expectedParts) || userJoined === expectedJoined) {
    return { correct: true, expectedParts, userParts };
  }

  const caseMismatch =
    equalIgnoringCase(userParts, expectedParts) ||
    userJoined.toLowerCase() === expectedJoined.toLowerCase();

  return { correct: false, caseMismatch, expectedParts, userParts };
}

export function formatExpectedOutput(lines, error) {
  if (error) return error;
  if (!lines.length) return '(no output)';
  return lines.join(', ');
}
