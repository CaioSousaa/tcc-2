import { z } from "zod";
import { isRealDate } from "../../shared/dates";
import { isUuid } from "../../shared/ids";
import { LIMITS } from "../../shared/limits";
import { clearableText, requiredText } from "../../shared/schemas";

const DUE_DATE_MESSAGE = "Prazo deve ser uma data válida no formato AAAA-MM-DD.";

const dueDate = z
  .string({ error: DUE_DATE_MESSAGE })
  .refine(isRealDate, { error: DUE_DATE_MESSAGE })
  .nullable()
  .optional();

export const createCardSchema = z.object({
  title: requiredText("Título", LIMITS.cardTitle),
});

// PATCH semantics (plan §4.1): absent = unchanged; null clears `description` and `dueDate`.
export const updateCardSchema = z.object({
  title: requiredText("Título", LIMITS.cardTitle).optional(),
  description: clearableText("Descrição", LIMITS.cardDescription),
  dueDate,
  completed: z.boolean({ error: "Concluído deve ser verdadeiro ou falso." }).optional(),
});

export const moveCardSchema = z.object({
  listId: z
    .string({ error: "Lista é obrigatória." })
    .refine(isUuid, { error: "Lista inválida." }),
  position: z
    .number({ error: "Posição deve ser um número." })
    .int("Posição deve ser um número inteiro."),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
