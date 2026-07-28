function normalizeOutput(value) {
  return String(value ?? '')
    .trim()
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .replace(/,\s*/g, ',')
    .toLowerCase();
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

export function compareOutputAnswer(userAnswer, runtimeResult, fallbackLines = []) {
  const runtimeParts = linesToComparable(
    runtimeResult.lines,
    runtimeResult.error
  );

  const fallbackParts = fallbackLines.map((line) => normalizeOutput(line));
  const expectedParts = runtimeParts.length > 0 ? runtimeParts : fallbackParts;
  const userParts = answerToComparable(userAnswer);

  if (!userParts.length) {
    return { correct: false, expectedParts, userParts };
  }

  if (arraysEqual(userParts, expectedParts)) {
    return { correct: true, expectedParts, userParts };
  }

  const userJoined = normalizeOutput(userParts.join(', '));
  const expectedJoined = normalizeOutput(expectedParts.join(', '));

  if (userJoined === expectedJoined) {
    return { correct: true, expectedParts, userParts };
  }

  if (expectedParts.length === 1 && userParts.length === 1) {
    const user = userParts[0];
    const expected = expectedParts[0];
    if (user.includes(expected) || expected.includes(user)) {
      return { correct: true, expectedParts, userParts };
    }
  }

  return { correct: false, expectedParts, userParts };
}

export function formatExpectedOutput(lines, error) {
  if (error) return error;
  if (!lines.length) return '(no output)';
  return lines.join(', ');
}
