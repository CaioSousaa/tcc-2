import { z } from "zod";
import { LIMITS, labelColorField, textField } from "../../shared/validation";

const nameField = textField("Nome da etiqueta", LIMITS.labelName.min, LIMITS.labelName.max);

export const createLabelSchema = z.object({
  name: nameField,
  color: labelColorField,
});

export const updateLabelSchema = z
  .object({
    name: nameField.optional(),
    color: labelColorField.optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.color !== undefined,
    "Informe ao menos um campo para alterar.",
  );
