import { z } from "zod";
import {
  LIMITS,
  emailField,
  normalizeEmail,
  passwordField,
  textField,
} from "../../shared/validation";

export const registerSchema = z.object({
  name: textField("Nome", LIMITS.userName.min, LIMITS.userName.max),
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: z.string("E-mail é obrigatório.").transform(normalizeEmail),
  password: z.string("Senha é obrigatória.").min(1, "Senha é obrigatória."),
});
