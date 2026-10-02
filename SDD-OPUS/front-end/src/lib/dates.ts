// Due dates are plain "YYYY-MM-DD" strings (no time). They are compared as text against the
// viewer's local "today" and never parsed with `new Date("YYYY-MM-DD")`, which would read the
// value as UTC and shift it by a day in negative-offset timezones (R-05, RN-D3).

/** Today's date in the viewer's local timezone, as YYYY-MM-DD. */
export function todayLocal(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** P2: overdue ⇔ has a deadline, deadline is before today, and the card is not completed. */
export function isOverdue(dueDate: string | null, completed: boolean, today: string): boolean {
  return dueDate !== null && !completed && dueDate < today;
}

export type DueStatus = "none" | "done" | "overdue" | "today" | "upcoming";

export function dueStatus(
  card: { dueDate: string | null; completed: boolean },
  today: string,
): DueStatus {
  if (card.dueDate === null) return "none";
  if (card.completed) return "done";
  if (card.dueDate < today) return "overdue";
  if (card.dueDate === today) return "today";
  return "upcoming";
}

/** P4: how many cards are overdue. Completed cards never count (B33). */
export function countOverdue(
  cards: ReadonlyArray<{ dueDate: string | null; completed: boolean }>,
  today: string,
): number {
  return cards.filter((card) => isOverdue(card.dueDate, card.completed, today)).length;
}

/** "2026-06-15" → "15/06/2026". */
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  return `${day}/${month}/${year}`;
}
