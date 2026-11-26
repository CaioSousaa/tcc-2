import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth";
import { authRoutes } from "./auth/auth.routes";
import { boardsRoutes } from "./boards/boards.routes";
import { cardsRoutes } from "./cards/cards.routes";
import { checklistItemsRoutes, checklistsRoutes } from "./checklists/checklists.routes";
import { commentsRoutes } from "./comments/comments.routes";
import { labelsRoutes } from "./labels/labels.routes";
import { listsRoutes } from "./lists/lists.routes";
import { membersRoutes } from "./members/members.routes";

export const routes = Router();

routes.use("/auth", authRoutes);

routes.use("/boards", ensureAuthenticated);
routes.use("/boards/:boardId/lists", listsRoutes);
routes.use("/boards/:boardId/cards", cardsRoutes);
routes.use("/boards/:boardId/checklists", checklistsRoutes);
routes.use("/boards/:boardId/checklist-items", checklistItemsRoutes);
routes.use("/boards/:boardId/members", membersRoutes);
routes.use("/boards/:boardId/labels", labelsRoutes);
routes.use("/boards/:boardId/comments", commentsRoutes);
routes.use("/boards", boardsRoutes);
