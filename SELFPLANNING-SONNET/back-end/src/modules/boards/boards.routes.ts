import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { boardAccess } from "../../middlewares/boardAccess";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./boards.service";

export const boardsRouter = Router();
boardsRouter.use(authenticate);

const createSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do quadro").max(100),
  description: z.string().trim().max(500).nullish(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do quadro").max(100).optional(),
  description: z.string().trim().max(500).nullish(),
});

const roleSchema = z.enum(["ADMIN", "MEMBER"]);

boardsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await service.listBoards(req.userId));
  }),
);

boardsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    res.status(201).json(await service.createBoard(req.userId, data));
  }),
);

boardsRouter.get(
  "/:id",
  boardAccess("board"),
  asyncHandler(async (req, res) => {
    const labelIds =
      typeof req.query.labelIds === "string" && req.query.labelIds
        ? req.query.labelIds.split(",")
        : [];
    res.json(
      await service.getBoard(req.boardId, req.boardRole, {
        labelIds,
        sortByDueDate: req.query.sort === "dueDate",
      }),
    );
  }),
);

boardsRouter.patch(
  "/:id",
  boardAccess("board", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    res.json(await service.updateBoard(req.boardId, data));
  }),
);

boardsRouter.delete(
  "/:id",
  boardAccess("board", "ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteBoard(req.boardId);
    res.status(204).send();
  }),
);

boardsRouter.get(
  "/:id/members",
  boardAccess("board"),
  asyncHandler(async (req, res) => {
    res.json(await service.listMembers(req.boardId));
  }),
);

boardsRouter.post(
  "/:id/members",
  boardAccess("board", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        email: z.string().trim().email("E-mail inválido"),
        role: roleSchema.default("MEMBER"),
      })
      .parse(req.body);
    res.status(201).json(await service.addMember(req.boardId, data.email, data.role));
  }),
);

boardsRouter.patch(
  "/:id/members/:userId",
  boardAccess("board", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { role } = z.object({ role: roleSchema }).parse(req.body);
    await service.updateMemberRole(req.boardId, String(req.params.userId), role);
    res.status(204).send();
  }),
);

boardsRouter.delete(
  "/:id/members/:userId",
  boardAccess("board"),
  asyncHandler(async (req, res) => {
    const targetId = String(req.params.userId);
    if (req.boardRole !== "ADMIN" && targetId !== req.userId) {
      throw new AppError(403, "Apenas administradores podem remover outros membros");
    }
    await service.removeMember(req.boardId, targetId);
    res.status(204).send();
  }),
);
