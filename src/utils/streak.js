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
