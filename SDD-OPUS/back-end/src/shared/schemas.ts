import { z } from "zod";

/** Required text: trimmed, 1..max characters (spec §5 — whitespace-only counts as empty). */
export function requiredText(label: string, max: number) {
  return z
    .string({ error: `${label} é obrigatório.` })
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);
}

/**
 * Optional text that may be cleared: `undefined` = leave unchanged, `null` or an empty string = clear.
 * The output is `string | null | undefined`.
 */
export function clearableText(label: string, max: number) {
  return z
    .string({ error: `${label} deve ser um texto.` })
    .trim()
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));
}
