import { z } from "zod";
import { LIMITS } from "../../shared/limits";
import { requiredText } from "../../shared/schemas";

export const createListSchema = z.object({ name: requiredText("Nome", LIMITS.listName) });
export const renameListSchema = z.object({ name: requiredText("Nome", LIMITS.listName) });

const position = z
  .number({ error: "Posição deve ser um número." })
  .int("Posição deve ser um número inteiro.");

export const moveListSchema = z.object({ position });

/** `?confirmCards=<n>` on DELETE: how many cards the user confirmed deleting (default 0). */
export const deleteListQuerySchema = z.object({
  confirmCards: z.coerce
    .number({ error: "confirmCards deve ser um número." })
    .int("confirmCards deve ser um número inteiro.")
    .min(0, "confirmCards não pode ser negativo.")
    .optional()
    .default(0),
});

export type MoveListInput = z.infer<typeof moveListSchema>;
