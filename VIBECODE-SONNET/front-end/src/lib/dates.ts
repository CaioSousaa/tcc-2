const DAY = 24 * 60 * 60 * 1000;
const SOON_THRESHOLD_DAYS = 2;

export type DueStatus = "none" | "done" | "overdue" | "soon" | "normal";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDueStatus(
  dueDate: string | null,
  completed: boolean,
  now = new Date(),
): DueStatus {
  if (!dueDate) return "none";
  if (completed) return "done";
  const due = new Date(dueDate);
  if (due.getTime() < now.getTime()) return "overdue";
  if (due.getTime() - now.getTime() <= SOON_THRESHOLD_DAYS * DAY) return "soon";
  return "normal";
}

export function isOverdue(card: { dueDate: string | null; completed: boolean }) {
  return getDueStatus(card.dueDate, card.completed) === "overdue";
}

export function formatShortDate(value: string | Date) {
  const date = new Date(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function dueLabel(dueDate: string, completed: boolean, now = new Date()) {
  const status = getDueStatus(dueDate, completed, now);
  const due = new Date(dueDate);
  if (status === "done") return `Concluído · ${formatShortDate(due)}`;
  if (status === "overdue") {
    const days = Math.max(1, Math.ceil((now.getTime() - due.getTime()) / DAY));
    return `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  const diffDays = Math.round(
    (startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY,
  );
  if (diffDays === 0) return "Vence hoje";
  if (diffDays === 1) return "Vence amanhã";
  return `Vence ${formatShortDate(due)}`;
}

/** Converte "AAAA-MM-DD" (input date) em ISO no fim do dia local. */
export function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
}

/** Converte ISO em "AAAA-MM-DD" para o input date. */
export function isoToDateInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "hoje, 09:10", "ontem, 16:42" ou "12 set, 10:00". */
export function formatCommentTime(value: string, now = new Date()) {
  const date = new Date(value);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY);
  if (diff === 0) return `hoje, ${time}`;
  if (diff === 1) return `ontem, ${time}`;
  const year = date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : "";
  return `${formatShortDate(date)}${year}, ${time}`;
}
