function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

/** Data local do navegador como `AAAA-MM-DD`, sem conversão de fuso (RT-16). */
export function todayLocal(now: Date = new Date()): string {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`;
}

/**
 * Atrasado = tem prazo, prazo anterior a hoje e não concluído (RN-32).
 * A comparação é textual: `AAAA-MM-DD` ordena igual ao calendário.
 */
export function isOverdue(
  card: { dueDate: string | null; completed: boolean },
  today: string,
): boolean {
  if (card.dueDate === null || card.completed) return false;
  return card.dueDate < today;
}

/** `2026-10-02` → `02/10/2026`, sem passar por `Date` (evita deslocamento de fuso). */
export function formatDueDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Valida `AAAA-MM-DD` como data real do calendário, ano de 0001 a 9999 (CA-82, CB-37, CB-38). */
export function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const days = month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  return day <= days;
}

export type DueStatus = "none" | "overdue" | "done" | "ok";

/** Estado visual do prazo: sem prazo, atrasado, concluído (prazo mantido) ou em dia. */
export function dueStatus(
  card: { dueDate: string | null; completed: boolean },
  today: string,
): DueStatus {
  if (card.dueDate === null) return "none";
  if (card.completed) return "done";
  return isOverdue(card, today) ? "overdue" : "ok";
}

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** `2026-09-12` → `12 set`, sem passar por `Date` (evita deslocamento de fuso). */
export function formatShortDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${Number(day)} ${MONTHS_SHORT[Number(month) - 1]}`;
}

/** Dias corridos de `from` até `to` (`AAAA-MM-DD`); positivo quando `to` é depois. */
export function daysBetween(from: string, to: string): number {
  const toUtc = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** Dias até o vencimento que ainda contam como "vencimento próximo" (destaque âmbar). */
export const DUE_SOON_DAYS = 3;

export type DueTone = "none" | "overdue" | "soon" | "done" | "ok";

/** Tom visual do prazo: atrasado, próximo do vencimento, concluído ou em dia. */
export function dueTone(
  card: { dueDate: string | null; completed: boolean },
  today: string,
): DueTone {
  if (card.dueDate === null) return "none";
  if (card.completed) return "done";
  if (card.dueDate < today) return "overdue";
  return daysBetween(today, card.dueDate) <= DUE_SOON_DAYS ? "soon" : "ok";
}

/** Texto curto do prazo: "Atrasado há 2 dias", "Vence hoje", "Vence 12 set". */
export function dueText(
  card: { dueDate: string | null; completed: boolean },
  today: string,
): string {
  if (card.dueDate === null) return "";
  if (!card.completed && card.dueDate < today) {
    const days = daysBetween(card.dueDate, today);
    return `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (!card.completed && card.dueDate === today) return "Vence hoje";
  return `Vence ${formatShortDate(card.dueDate)}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Hora do comentário como no protótipo: `hoje, 09:10`, `ontem, 16:42` ou
 * `02/10/2026, 09:10`. Usa o fuso local do navegador.
 */
export function formatCommentTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const clock = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const day = todayLocal(date);
  const today = todayLocal(now);
  if (day === today) return `hoje, ${clock}`;
  if (daysBetween(day, today) === 1) return `ontem, ${clock}`;
  return `${formatDueDate(day)}, ${clock}`;
}
