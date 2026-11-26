import { z } from "zod";
import { LIMITS, textField } from "../../shared/validation";

export const checklistBodySchema = z.object({
  title: textField("Título do checklist", LIMITS.checklistTitle.min, LIMITS.checklistTitle.max),
});

export const itemCreateSchema = z.object({
  text: textField("Texto do item", LIMITS.checklistItem.min, LIMITS.checklistItem.max),
});

export const itemUpdateSchema = z
  .object({
    text: textField("Texto do item", LIMITS.checklistItem.min, LIMITS.checklistItem.max).optional(),
    done: z.boolean("Valor inválido para feito.").optional(),
  })
  .refine(
    (value) => value.text !== undefined || value.done !== undefined,
    "Informe ao menos um campo para alterar.",
  );
