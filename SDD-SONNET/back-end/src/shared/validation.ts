import { z } from "zod";
import type { FieldError } from "./errors";

export const LIMITS = {
  userName: { min: 1, max: 80 },
  email: { max: 254 },
  password: { min: 8, max: 128 },
  boardName: { min: 1, max: 100 },
  listName: { min: 1, max: 100 },
  cardTitle: { min: 1, max: 200 },
  cardDescription: { max: 5000 },
  checklistTitle: { min: 1, max: 200 },
  checklistItem: { min: 1, max: 200 },
  labelName: { min: 1, max: 30 },
  comment: { min: 1, max: 2000 },
} as const;

/** Paleta de etiquetas do protótipo (`protoripo.pen`): conjunto fixo (RN-26, RT-30). */
export const LABEL_COLORS = ["red", "amber", "green", "blue", "purple", "slate"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

/** Cores de faixa dos quadros, como no protótipo. */
export const BOARD_COLORS = ["navy", "blue", "green", "amber", "purple"] as const;
export type BoardColor = (typeof BOARD_COLORS)[number];

export const ROLES = ["admin", "member", "viewer"] as const;

/** Conta caracteres por pontos de código Unicode (um emoji conta como 1). */
export function charCount(value: string): number {
  let count = 0;
  for (const _char of value) count += 1;
  return count;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return charCount(value) <= LIMITS.email.max && EMAIL_PATTERN.test(value);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Valida `AAAA-MM-DD` como data real do calendário, ano de 0001 a 9999. */
export function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function textField(label: string, min: number, max: number) {
  return z
    .string(`${label} é obrigatório.`)
    .trim()
    .refine(
      (value) => charCount(value) >= min,
      min <= 1
        ? `${label} é obrigatório.`
        : `${label} deve ter no mínimo ${min} caracteres.`,
    )
    .refine(
      (value) => charCount(value) <= max,
      `${label} deve ter no máximo ${max} caracteres.`,
    );
}

/** Texto opcional: vazio após `trim` vira `null`. */
export function optionalTextField(label: string, max: number) {
  return z
    .string(`${label} deve ser um texto.`)
    .trim()
    .refine(
      (value) => charCount(value) <= max,
      `${label} deve ter no máximo ${max} caracteres.`,
    )
    .nullable()
    .transform((value) => (value ? value : null));
}

export const emailField = z
  .string("E-mail é obrigatório.")
  .transform(normalizeEmail)
  .refine((value) => value.length > 0, "E-mail é obrigatório.")
  .refine(isValidEmail, "Informe um e-mail válido.");

/** A senha não sofre `trim`: espaços fazem parte dela. */
export const passwordField = z
  .string("Senha é obrigatória.")
  .refine(
    (value) => charCount(value) >= LIMITS.password.min,
    `A senha deve ter no mínimo ${LIMITS.password.min} caracteres.`,
  )
  .refine(
    (value) => charCount(value) <= LIMITS.password.max,
    `A senha deve ter no máximo ${LIMITS.password.max} caracteres.`,
  );

export const dueDateField = z
  .string("Prazo deve ser uma data.")
  .refine(isValidCalendarDate, "Prazo inválido. Use uma data real do calendário.");

export const roleField = z.enum(ROLES, "Papel inválido.");
export const labelColorField = z.enum(LABEL_COLORS, "Cor de etiqueta inválida.");
export const boardColorField = z.enum(BOARD_COLORS, "Cor de quadro inválida.");

export const positionField = z
  .number("Posição inválida.")
  .int("Posição inválida.")
  .min(0, "Posição inválida.");

export function fieldsFromZod(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
