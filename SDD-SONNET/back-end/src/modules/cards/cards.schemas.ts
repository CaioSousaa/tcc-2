import { z } from "zod";
import {
  LIMITS,
  dueDateField,
  optionalTextField,
  positionField,
  textField,
} from "../../shared/validation";

const titleField = textField("Título do card", LIMITS.cardTitle.min, LIMITS.cardTitle.max);
const descriptionField = optionalTextField("Descrição", LIMITS.cardDescription.max);

export const createCardSchema = z.object({
  title: titleField,
  description: descriptionField.optional(),
});

export const updateCardSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    completed: z.boolean("Valor inválido para concluído.").optional(),
    dueDate: dueDateField.nullable().optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Informe ao menos um campo para alterar.",
  );

export const moveCardSchema = z.object({
  listId: z.string("Lista de destino é obrigatória."),
  position: positionField,
});
