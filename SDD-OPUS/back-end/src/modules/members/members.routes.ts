import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import { inviteMemberSchema, updateMemberRoleSchema } from "./members.schemas";
import * as members from "./members.service";

export const membersRouter = Router();

membersRouter.get("/boards/:boardId/members", async (req, res) => {
  res.json({ items: await members.listMembers(idParam(req, "boardId"), authOf(req).user.id) });
});

membersRouter.post("/boards/:boardId/members", async (req, res) => {
  const input = parse(inviteMemberSchema, req.body);
  res.status(201).json(await members.inviteMember(idParam(req, "boardId"), authOf(req).user.id, input));
});

membersRouter.patch("/boards/:boardId/members/:userId", async (req, res) => {
  const { role } = parse(updateMemberRoleSchema, req.body);
  res.json(
    await members.changeMemberRole(
      idParam(req, "boardId"),
      authOf(req).user.id,
      req.params.userId,
      role,
    ),
  );
});

membersRouter.delete("/boards/:boardId/members/:userId", async (req, res) => {
  await members.removeMember(idParam(req, "boardId"), authOf(req).user.id, req.params.userId);
  res.status(204).end();
});
