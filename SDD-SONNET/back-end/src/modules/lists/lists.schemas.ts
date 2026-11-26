import { z } from "zod";
import { LIMITS, positionField, textField } from "../../shared/validation";

export const listBodySchema = z.object({
  name: textField("Nome da lista", LIMITS.listName.min, LIMITS.listName.max),
});

export const moveListSchema = z.object({
  position: positionField,
});

export const deleteListQuerySchema = z.object({
  strategy: z.enum(["delete", "move"], "Estratégia de exclusão inválida.").optional(),
  targetListId: z.string().optional(),
});
