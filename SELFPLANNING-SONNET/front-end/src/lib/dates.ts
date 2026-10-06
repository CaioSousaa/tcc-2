const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatDay(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}


export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function formatCommentTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const diff = dayNumber(now) - dayNumber(date);
  if (diff === 0) return `hoje, ${hh}:${mm}`;
  if (diff === 1) return `ontem, ${hh}:${mm}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hh}:${mm}`;
}

export function dueFromKey(dateKey: string | null, now = new Date()) {
  if (!dateKey) return { dueDate: null, isOverdue: false, isDueSoon: false, daysDiff: null };
  const [y, m, d] = dateKey.split("-").map(Number);
  const daysDiff = Math.floor(Date.UTC(y, m - 1, d) / DAY_MS) - dayNumber(now);
  return {
    dueDate: dateKey,
    isOverdue: daysDiff < 0,
    isDueSoon: daysDiff >= 0 && daysDiff <= 3,
    daysDiff,
  };
}
