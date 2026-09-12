/**
 * Day keys for streak tracking.
 *
 * Deliberately local time, not `toISOString()` (UTC): a study session at 8pm in
 * a western timezone is already "tomorrow" in UTC, which both breaks the streak
 * and double-counts the day.
 */
function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return dayKey(new Date());
}

export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/** Streak in days after playing today, given the previously stored stats. */
export function updateStreak(stats) {
  const last = stats?.lastPlayedDate;
  if (last === todayKey()) return stats.streakDays;
  if (last === yesterdayKey()) return (stats.streakDays ?? 0) + 1;
  return 1;
}

/**
 * The one streak to show in the UI, across the per-section trackers.
 *
 * Each section keeps its own `{ streakDays, lastPlayedDate }`, but a user
 * who did MCQs yesterday and coding today has not broken anything — the
 * streak they care about is "days I studied", not "days I studied this
 * one section". Stale entries (last played before yesterday) are dropped,
 * and the longest live streak wins.
 */
export function combinedStreak(statsList) {
  const today = todayKey();
  const yesterday = yesterdayKey();

  let days = 0;
  let playedToday = false;

  for (const stats of statsList) {
    const last = stats?.lastPlayedDate;
    if (last !== today && last !== yesterday) continue;
    if (last === today) playedToday = true;
    days = Math.max(days, stats.streakDays ?? 0);
  }

  return { days, playedToday };
}
