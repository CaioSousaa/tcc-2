import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import * as service from "./assignees.service";

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string>)[name]);
}

/** `PUT|DELETE /cards/:cardId/assignees/:userId`. */
export const cardAssigneesRouter = Router({ mergeParams: true });

cardAssigneesRouter.put("/:userId", async (req, res) => {
  await service.assignMember(currentUser(req).id, param(req, "cardId"), param(req, "userId"));
  res.status(204).end();
});

cardAssigneesRouter.delete("/:userId", async (req, res) => {
  await service.unassignMember(currentUser(req).id, param(req, "cardId"), param(req, "userId"));
  res.status(204).end();
});
