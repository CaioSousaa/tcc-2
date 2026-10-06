import { z } from "zod";
import { LIMITS } from "../../shared/limits";
import { requiredText } from "../../shared/schemas";

export const checklistTitleSchema = z.object({
  title: requiredText("Título", LIMITS.checklistTitle),
});

export const createItemSchema = z.object({
  text: requiredText("Texto", LIMITS.checklistItemText),
});

export const updateItemSchema = z.object({
  text: requiredText("Texto", LIMITS.checklistItemText).optional(),
  checked: z.boolean({ error: "Marcado deve ser verdadeiro ou falso." }).optional(),
});
