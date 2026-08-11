/** Monday-based week start (UTC), aligned with backend `startOfWeek`. */
export function getStartOfWeekIso(date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0),
  );
  return monday.toISOString().split('T')[0];
}

/** Returns the UTC date for a given day-of-week (0=Sun) within the week starting at weekStartIso. */
export function dateForDayInWeek(dayOfWeek: number, weekStartIso?: string): Date {
  const start = weekStartIso ?? getStartOfWeekIso();
  const monday = new Date(`${start}T00:00:00.000Z`);
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const result = new Date(monday);
  result.setUTCDate(result.getUTCDate() + offset);
  return result;
}

export function isSameWeek(dateA: Date | string, dateB: Date | string): boolean {
  return getStartOfWeekIso(new Date(dateA)) === getStartOfWeekIso(new Date(dateB));
}
