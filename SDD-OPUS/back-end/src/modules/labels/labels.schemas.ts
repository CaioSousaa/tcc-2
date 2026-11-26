import { z } from "zod";
import { LIMITS } from "../../shared/limits";
import { LABEL_COLORS } from "../../shared/palette";
import { requiredText } from "../../shared/schemas";

const color = z.enum(LABEL_COLORS, { error: "Cor inválida." });

export const createLabelSchema = z.object({
  name: requiredText("Nome", LIMITS.labelName),
  color,
});

export const updateLabelSchema = z.object({
  name: requiredText("Nome", LIMITS.labelName).optional(),
  color: color.optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
