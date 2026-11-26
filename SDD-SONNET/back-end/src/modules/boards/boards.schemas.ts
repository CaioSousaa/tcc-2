import { z } from "zod";
import { LIMITS, boardColorField, textField } from "../../shared/validation";

const nameField = textField("Nome do quadro", LIMITS.boardName.min, LIMITS.boardName.max);

export const createBoardSchema = z.object({
  name: nameField,
  color: boardColorField.optional(),
  /** Cria as listas "A fazer", "Em progresso" e "Concluído" junto com o quadro. */
  withDefaultLists: z.boolean("Valor inválido para listas padrão.").optional(),
});

export const updateBoardSchema = z
  .object({
    name: nameField.optional(),
    color: boardColorField.optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.color !== undefined,
    "Informe ao menos um campo para alterar.",
  );

export const listBoardsQuerySchema = z.object({
  /** "Hoje" local do cliente, para contar cards atrasados (RT-16). */
  today: z
    .string()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida.")
    .optional(),
});

export const DEFAULT_LIST_NAMES = ["A fazer", "Em progresso", "Concluído"] as const;
