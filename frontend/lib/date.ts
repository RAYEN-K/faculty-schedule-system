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
