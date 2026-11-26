import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { authOf } from "../auth/auth.middleware";
import * as assignees from "./assignees.service";

export const assigneesRouter = Router();

assigneesRouter.put("/cards/:cardId/assignees/:userId", async (req, res) => {
  await assignees.assignMember(idParam(req, "cardId"), idParam(req, "userId"), authOf(req).user.id);
  res.status(204).end();
});

assigneesRouter.delete("/cards/:cardId/assignees/:userId", async (req, res) => {
  await assignees.unassignMember(idParam(req, "cardId"), idParam(req, "userId"), authOf(req).user.id);
  res.status(204).end();
});
