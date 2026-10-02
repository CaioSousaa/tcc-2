import { z } from "zod";
import { LIMITS } from "../../shared/limits";
import { clearableText, requiredText } from "../../shared/schemas";

export const createBoardSchema = z.object({
  name: requiredText("Nome", LIMITS.boardName),
  description: clearableText("Descrição", LIMITS.boardDescription),
});

export const updateBoardSchema = z.object({
  name: requiredText("Nome", LIMITS.boardName).optional(),
  description: clearableText("Descrição", LIMITS.boardDescription),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
