export function normalizeCode(body) {
  const code = (body ?? '')
    .replace(/```javascript\n?/g, '')
    .replace(/```/g, '')
    .trim();
  return code.replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
}
