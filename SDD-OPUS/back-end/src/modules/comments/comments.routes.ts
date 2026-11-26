import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import { createCommentSchema } from "./comments.schemas";
import * as comments from "./comments.service";

// Deliberately no edit/delete routes: comments are an immutable history (CA-CM6, R-16).
export const commentsRouter = Router();

commentsRouter.get("/cards/:cardId/comments", async (req, res) => {
  res.json({ items: await comments.listComments(idParam(req, "cardId"), authOf(req).user.id) });
});

commentsRouter.post("/cards/:cardId/comments", async (req, res) => {
  const { body } = parse(createCommentSchema, req.body);
  res.status(201).json(await comments.createComment(idParam(req, "cardId"), authOf(req).user, body));
});
