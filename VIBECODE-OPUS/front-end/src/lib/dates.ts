const DAY = 24 * 60 * 60 * 1000;
/** Cards due within this window (and not late yet) are flagged as "due soon". */
export const DUE_SOON_WINDOW = 2 * DAY;

export type DueStatus = "none" | "done" | "overdue" | "soon" | "upcoming";

export function getDueStatus(
  dueDate: string | null,
  completed: boolean,
  now = Date.now(),
): DueStatus {
  if (!dueDate) return "none";
  if (completed) return "done";
  const due = new Date(dueDate).getTime();
  if (due < now) return "overdue";
  if (due - now <= DUE_SOON_WINDOW) return "soon";
  return "upcoming";
}

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

export function formatShortDate(value: string) {
  return shortDate.format(new Date(value)).replace(".", "").replace(" de ", " ");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function describeDue(dueDate: string, completed: boolean, now = Date.now()) {
  const status = getDueStatus(dueDate, completed, now);
  if (status === "overdue") {
    const days = Math.round(
      (startOfDay(new Date(now)) - startOfDay(new Date(dueDate))) / DAY,
    );
    if (days <= 0) return "Atrasado hoje";
    return `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (status === "done") return `Concluído · ${formatShortDate(dueDate)}`;
  return `Vence ${formatShortDate(dueDate)}`;
}

/** `yyyy-mm-dd` (value of a date input) for a stored due date, in local time. */
export function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A due date picked in a date input is due at the end of that local day. */
export function fromDateInputValue(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59).toISOString();
}

const commentDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const commentTime = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCommentDate(value: string, now = new Date()) {
  const date = new Date(value);
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  const time = commentTime.format(date);
  if (diff === 0) return `hoje, ${time}`;
  if (diff === 1) return `ontem, ${time}`;
  return `${commentDate.format(date)}, ${time}`;
}
