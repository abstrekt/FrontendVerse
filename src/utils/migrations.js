const MIGRATIONS_KEY = 'quiz-migrations';

function readApplied() {
  try {
    const raw = localStorage.getItem(MIGRATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasRunMigration(name) {
  return readApplied().includes(name);
}

export function markMigrationRun(name) {
  try {
    const applied = readApplied();
    if (applied.includes(name)) return;
    localStorage.setItem(MIGRATIONS_KEY, JSON.stringify([...applied, name]));
  } catch {
    // Storage unavailable — the migration will be retried next load, which is
    // safe because every migration here is idempotent.
  }
}
