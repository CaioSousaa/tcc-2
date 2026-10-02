import { z } from "zod";
import { LIMITS } from "../../shared/limits";
import { requiredText } from "../../shared/schemas";

export const createCommentSchema = z.object({
  body: requiredText("Comentário", LIMITS.comment),
});
