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

/**
 * Move ids between sections in one of the id-keyed stores (starred, completed,
 * archived).
 *
 * Splitting the JS learnings section moved sixteen entries into `browser` and
 * three more into `css` / `algorithm` / `react-learnings`. Those stores are
 * keyed by section, so without this a reader's stars and mastery marks would
 * silently evaporate on the entries that moved.
 *
 * `moves` is a list of `{ from, to, id, newId }`. Pure — the caller decides
 * when it runs and `hasRunMigration` keeps it to once.
 */
export function relocateStoreIds(store, moves) {
  let next = store;
  for (const { from, to, id, newId = id } of moves) {
    const source = next?.[from] ?? [];
    if (!source.includes(id)) continue;
    const target = next?.[to] ?? [];
    next = {
      ...next,
      [from]: source.filter((existing) => existing !== id),
      [to]: target.includes(newId) ? target : [...target, newId],
    };
  }
  return next;
}

/**
 * Drop ids a section no longer contains.
 *
 * The polyfill write-ups now live only as coding challenges, so ids pointing at
 * them are dead. A dead id is not merely inert: the starred-filter chip counts
 * raw ids, so it would report more starred items than the list can show.
 */
export function pruneStoreIds(store, section, validIds) {
  const valid = new Set(validIds);
  const current = store?.[section] ?? [];
  const kept = current.filter((id) => valid.has(id));
  if (kept.length === current.length) return store;
  return { ...store, [section]: kept };
}
