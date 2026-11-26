import { z } from "zod";
import { LIMITS, textField } from "../../shared/validation";

export const commentBodySchema = z.object({
  text: textField("Comentário", LIMITS.comment.min, LIMITS.comment.max),
});
