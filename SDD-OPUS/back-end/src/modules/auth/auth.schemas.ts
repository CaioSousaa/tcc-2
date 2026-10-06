import { z } from "zod";
import { LIMITS } from "../../shared/limits";

const name = z
  .string({ error: "Nome é obrigatório." })
  .trim()
  .min(1, "Nome é obrigatório.")
  .max(LIMITS.userName, `Nome deve ter no máximo ${LIMITS.userName} caracteres.`);

// RN-A1: e-mail is compared trimmed and case-insensitively, so it is normalized here.
export const emailField = z
  .string({ error: "E-mail é obrigatório." })
  .trim()
  .toLowerCase()
  .min(1, "E-mail é obrigatório.")
  .max(LIMITS.email, `E-mail deve ter no máximo ${LIMITS.email} caracteres.`)
  .pipe(z.email({ error: "E-mail inválido." }));

const newPassword = z
  .string({ error: "Senha é obrigatória." })
  .min(LIMITS.passwordMin, `A senha deve ter no mínimo ${LIMITS.passwordMin} caracteres.`)
  .max(LIMITS.passwordMax, `A senha deve ter no máximo ${LIMITS.passwordMax} caracteres.`);

export const registerSchema = z.object({
  name,
  email: emailField,
  password: newPassword,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: "Senha é obrigatória." }).min(1, "Senha é obrigatória."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
