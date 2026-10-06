import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import { getBoardDetail } from "./boardDetail.service";
import { createBoardSchema, updateBoardSchema } from "./boards.schemas";
import * as boards from "./boards.service";

export const boardsRouter = Router();

boardsRouter.get("/boards", async (req, res) => {
  res.json({ items: await boards.listBoards(authOf(req).user.id) });
});

boardsRouter.post("/boards", async (req, res) => {
  const input = parse(createBoardSchema, req.body);
  res.status(201).json(await boards.createBoard(authOf(req).user.id, input));
});

boardsRouter.get("/boards/:boardId", async (req, res) => {
  res.json(await getBoardDetail(idParam(req, "boardId"), authOf(req).user.id));
});

boardsRouter.patch("/boards/:boardId", async (req, res) => {
  const input = parse(updateBoardSchema, req.body);
  res.json(await boards.updateBoard(idParam(req, "boardId"), authOf(req).user.id, input));
});

boardsRouter.delete("/boards/:boardId", async (req, res) => {
  await boards.deleteBoard(idParam(req, "boardId"), authOf(req).user.id);
  res.status(204).end();
});
