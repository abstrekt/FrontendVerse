/**
 * A list label for an output question.
 *
 * Every entry in the set asks the same thing — "What will be the output?"
 * — so a panel listing 65 of them by `question` is 65 identical rows.
 * The snippet is what actually distinguishes them, so the label is its
 * first substantive line, normalised onto one line.
 */
export function outputQuestionLabel(question) {
  const source = question?.code ?? question?.body ?? '';

  const firstLine = source
    .split('\n')
    .map((line) => line.trim())
    // Fence markers and lone comments identify nothing.
    .find((line) => line && !line.startsWith('```') && !line.startsWith('//'));

  if (!firstLine) return question?.question ?? `Question ${question?.id ?? ''}`;

  // Trailing punctuation is noise once the line is truncated anyway.
  return firstLine.replace(/\s+/g, ' ').replace(/[;{]\s*$/, '');
}
