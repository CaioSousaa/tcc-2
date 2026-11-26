import { Router } from "express";
import { currentUser, requireAuth } from "../auth/auth.middleware";
import { boardLabelsRouter } from "../labels/labels.routes";
import { boardListsRouter } from "../lists/lists.routes";
import { membersRouter } from "../members/members.routes";
import { createBoardSchema, listBoardsQuerySchema, updateBoardSchema } from "./boards.schemas";
import * as service from "./boards.service";

export const boardsRouter = Router();

boardsRouter.use(requireAuth);
boardsRouter.use("/:boardId/members", membersRouter);
boardsRouter.use("/:boardId/lists", boardListsRouter);
boardsRouter.use("/:boardId/labels", boardLabelsRouter);

boardsRouter.get("/", async (req, res) => {
  const { today } = listBoardsQuerySchema.parse(req.query);
  res.json(await service.listBoards(currentUser(req).id, today));
});

boardsRouter.post("/", async (req, res) => {
  const input = createBoardSchema.parse(req.body);
  res.status(201).json(await service.createBoard(currentUser(req).id, input));
});

boardsRouter.get("/:boardId", async (req, res) => {
  res.json(await service.getBoardFull(currentUser(req).id, String(req.params.boardId)));
});

boardsRouter.patch("/:boardId", async (req, res) => {
  const patch = updateBoardSchema.parse(req.body);
  res.json(await service.updateBoard(currentUser(req).id, String(req.params.boardId), patch));
});

boardsRouter.delete("/:boardId", async (req, res) => {
  await service.deleteBoard(currentUser(req).id, String(req.params.boardId));
  res.status(204).end();
});
