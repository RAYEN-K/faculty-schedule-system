export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);

  const startOfWeek = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0),
  );
  return startOfWeek;
}
export const startOfWeek = getStartOfWeek;
