import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import { commentBodySchema } from "./comments.schemas";
import * as service from "./comments.service";

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string>)[name]);
}

/** `POST /cards/:cardId/comments`. Não há rota para editar nem excluir (RN-29). */
export const cardCommentsRouter = Router({ mergeParams: true });

cardCommentsRouter.post("/", async (req, res) => {
  const { text } = commentBodySchema.parse(req.body);
  res.status(201).json(await service.createComment(currentUser(req).id, param(req, "cardId"), text));
});
