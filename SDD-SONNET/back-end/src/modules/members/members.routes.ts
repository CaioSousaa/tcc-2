import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import { changeRoleSchema, inviteSchema } from "./members.schemas";
import * as service from "./members.service";

function boardIdOf(req: Request): string {
  return String((req.params as Record<string, string>).boardId);
}

export const membersRouter = Router({ mergeParams: true });

membersRouter.post("/", async (req, res) => {
  const { email, role } = inviteSchema.parse(req.body);
  const member = await service.inviteMember(
    currentUser(req).id,
    boardIdOf(req),
    email,
    role,
  );
  res.status(201).json(member);
});

membersRouter.patch("/:userId", async (req, res) => {
  const { role } = changeRoleSchema.parse(req.body);
  const member = await service.changeMemberRole(
    currentUser(req).id,
    boardIdOf(req),
    String(req.params.userId),
    role,
  );
  res.json(member);
});

membersRouter.delete("/:userId", async (req, res) => {
  await service.removeMember(
    currentUser(req).id,
    boardIdOf(req),
    String(req.params.userId),
  );
  res.status(204).end();
});
