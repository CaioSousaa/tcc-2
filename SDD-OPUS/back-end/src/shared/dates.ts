const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written as YYYY-MM-DD (rejects e.g. 2026-02-31). */
export function isRealDate(value: string): boolean {
  const match = DATE_ONLY.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}
