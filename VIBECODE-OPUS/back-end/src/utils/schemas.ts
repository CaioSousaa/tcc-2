import { z } from "zod";

export const emailSchema = z
  .string({ error: "Informe o e-mail" })
  .trim()
  .toLowerCase()
  .pipe(z.email("E-mail inválido"));

export const BOARD_COLORS = ["navy", "blue", "green", "amber", "purple"] as const;
export const LABEL_COLORS = [
  "red",
  "blue",
  "green",
  "amber",
  "purple",
  "slate",
] as const;

export const boardColorSchema = z.enum(BOARD_COLORS, { error: "Cor inválida" });
export const labelColorSchema = z.enum(LABEL_COLORS, { error: "Cor inválida" });

export const roleSchema = z.enum(["admin", "member"], {
  error: "Papel inválido",
});

export const uuidSchema = z.uuid("Identificador inválido");
