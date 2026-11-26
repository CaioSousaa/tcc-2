import type { Label } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 2;

export const ROLE_LABELS = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Observador",
} as const;

export const ROLE_TAGS = {
  admin: "ADMIN",
  editor: "EDITOR",
  viewer: "OBSERVADOR",
} as const;

export const BOARD_COLORS = ["#1D3557", "#2F6FB5", "#2A8F6A", "#C98A1A", "#7B5CBD"];
export const LABEL_COLORS = ["#C8423A", "#2F6FB5", "#2A8F6A", "#C98A1A", "#7B5CBD", "#6B7A8C"];

const AVATAR_COLORS = ["#2F6FB5", "#7B5CBD", "#2A8F6A", "#C98A1A", "#C8423A", "#6B7A8C"];

/** Fundo e texto das etiquetas da paleta do protótipo */
const LABEL_TONES: Record<string, { bg: string; text: string }> = {
  "#C8423A": { bg: "#FBE9E7", text: "#C8423A" },
  "#2F6FB5": { bg: "#E6EFF9", text: "#2F6FB5" },
  "#2A8F6A": { bg: "#E3F3EC", text: "#2A8F6A" },
  "#C98A1A": { bg: "#FBF0D9", text: "#9A6A0C" },
  "#7B5CBD": { bg: "#EFE9F8", text: "#7B5CBD" },
  "#6B7A8C": { bg: "#EEF0F3", text: "#55626F" },
};

export function labelTone(label: Pick<Label, "color">) {
  return LABEL_TONES[label.color.toUpperCase()] ?? { bg: `${label.color}22`, text: label.color };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function avatarColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fullDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export type DueTone = "neutral" | "soon" | "overdue" | "done";

/** Texto e tom do selo de prazo exibido no card e no modal */
export function dueBadge(dueDate: string, completed: boolean, overdue: boolean) {
  const due = new Date(dueDate);
  const label = `Vence ${shortDate.format(due).replace(".", "")}`;

  if (completed) return { tone: "done" as DueTone, text: label };

  if (overdue) {
    const days = Math.floor((startOfDay(new Date()).getTime() - startOfDay(due).getTime()) / DAY_MS);
    const text =
      days <= 0 ? "Atrasado hoje" : `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
    return { tone: "overdue" as DueTone, text };
  }

  const daysLeft = (due.getTime() - Date.now()) / DAY_MS;
  return { tone: (daysLeft <= DUE_SOON_DAYS ? "soon" : "neutral") as DueTone, text: label };
}

export const DUE_TONE_CLASSES: Record<DueTone, string> = {
  neutral: "bg-chip text-muted",
  soon: "bg-amber-bg text-amber-text",
  overdue: "bg-red-bg text-red",
  done: "bg-green-bg text-green",
};

/** "hoje, 09:10", "ontem, 16:42" ou "12/08/2026, 10:00" */
export function commentTime(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / DAY_MS,
  );
  const prefix = diffDays === 0 ? "hoje" : diffDays === 1 ? "ontem" : fullDate.format(date);
  return `${prefix}, ${time.format(date)}`;
}

/** Converte o prazo salvo para o valor de um <input type="date"> */
export function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** O prazo vale até o fim do dia escolhido, no fuso do usuário */
export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59).toISOString();
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
