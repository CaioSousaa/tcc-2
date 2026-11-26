import { Router } from "express";
import { In } from "typeorm";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { BoardInvitation } from "../entities/BoardInvitation";
import { BoardMember } from "../entities/BoardMember";
import { User } from "../entities/User";
import { getUserId } from "../utils/auth";
import { assertUuid, getMembership, requireAdmin } from "../utils/access";
import { badRequest, conflict, forbidden, notFound } from "../utils/HttpError";
import { publicUser } from "../utils/serializers";
import { emailSchema, roleSchema } from "../utils/schemas";

const router = Router();

const inviteSchema = z.object({
  email: emailSchema,
  role: roleSchema.default("member"),
});

const updateRoleSchema = z.object({ role: roleSchema });

function serializeInvitation(
  invitation: BoardInvitation,
  invitedUser?: User | null,
) {
  return {
    id: invitation.id,
    boardId: invitation.boardId,
    email: invitation.email,
    role: invitation.role,
    /** Account already registered with the invited e-mail, if any. */
    user: invitedUser ? publicUser(invitedUser) : null,
    invitedBy: invitation.invitedBy ? publicUser(invitation.invitedBy) : null,
    board: invitation.board
      ? {
          id: invitation.board.id,
          title: invitation.board.title,
          color: invitation.board.color,
        }
      : undefined,
    createdAt: invitation.createdAt.toISOString(),
  };
}

async function getTargetMember(boardId: string, userIdParam: unknown) {
  const targetUserId = assertUuid(userIdParam, "Membro não encontrado");
  const target = await AppDataSource.getRepository(BoardMember).findOne({
    where: { boardId, userId: targetUserId },
    relations: { user: true },
  });
  if (!target) throw notFound("Membro não encontrado");
  return target;
}

/* ----------------------------- Board members ----------------------------- */

router.get("/boards/:boardId/members", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  const board = await AppDataSource.getRepository(Board).findOneByOrFail({
    id: membership.boardId,
  });
  const members = await AppDataSource.getRepository(BoardMember).find({
    where: { boardId: membership.boardId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });

  res.json({
    members: members.map((member) => ({
      userId: member.userId,
      role: member.role,
      isOwner: member.userId === board.ownerId,
      joinedAt: member.createdAt.toISOString(),
      user: publicUser(member.user),
    })),
  });
});

router.patch("/boards/:boardId/members/:userId", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  requireAdmin(membership, "Apenas administradores podem alterar papéis");
  const { role } = updateRoleSchema.parse(req.body);

  const board = await AppDataSource.getRepository(Board).findOneByOrFail({
    id: membership.boardId,
  });
  const target = await getTargetMember(board.id, req.params.userId);

  if (target.userId === board.ownerId && role !== "admin") {
    throw badRequest(
      "O criador do quadro é sempre administrador",
      "OWNER_ROLE_LOCKED",
    );
  }

  if (target.role === "admin" && role === "member") {
    const adminCount = await AppDataSource.getRepository(BoardMember).countBy({
      boardId: board.id,
      role: "admin",
    });
    if (adminCount <= 1) {
      throw badRequest("O quadro precisa de pelo menos um administrador");
    }
  }

  target.role = role;
  await AppDataSource.getRepository(BoardMember).save(target);

  res.json({
    member: {
      userId: target.userId,
      role: target.role,
      isOwner: target.userId === board.ownerId,
      joinedAt: target.createdAt.toISOString(),
      user: publicUser(target.user),
    },
  });
});

/** Removes a member (admins only) or lets the current user leave the board. */
router.delete("/boards/:boardId/members/:userId", async (req, res) => {
  const userId = getUserId(res);
  const membership = await getMembership(req.params.boardId, userId);
  const board = await AppDataSource.getRepository(Board).findOneByOrFail({
    id: membership.boardId,
  });
  const target = await getTargetMember(board.id, req.params.userId);

  const leaving = target.userId === userId;
  if (!leaving) requireAdmin(membership, "Apenas administradores podem remover membros");

  if (target.userId === board.ownerId) {
    throw forbidden(
      leaving
        ? "O criador do quadro não pode sair dele. Exclua o quadro se necessário."
        : "O criador do quadro não pode ser removido",
    );
  }

  await AppDataSource.transaction(async (manager) => {
    await manager.delete(BoardMember, { id: target.id });
    // A former member can no longer be responsible for cards of this board.
    await manager.query(
      `DELETE FROM "card_assignees"
        WHERE "userId" = $1
          AND "cardId" IN (SELECT "id" FROM "cards" WHERE "boardId" = $2)`,
      [target.userId, board.id],
    );
  });

  res.status(204).send();
});

/* -------------------------- Board invitations ---------------------------- */

router.get("/boards/:boardId/invitations", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  requireAdmin(membership, "Apenas administradores podem ver convites");

  const invitations = await AppDataSource.getRepository(BoardInvitation).find({
    where: { boardId: membership.boardId },
    relations: { invitedBy: true },
    order: { createdAt: "DESC" },
  });

  const users = invitations.length
    ? await AppDataSource.getRepository(User).findBy({
        email: In(invitations.map((invitation) => invitation.email)),
      })
    : [];
  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  res.json({
    invitations: invitations.map((invitation) =>
      serializeInvitation(invitation, usersByEmail.get(invitation.email)),
    ),
  });
});

router.post("/boards/:boardId/invitations", async (req, res) => {
  const userId = getUserId(res);
  const membership = await getMembership(req.params.boardId, userId);
  requireAdmin(membership, "Apenas administradores podem convidar membros");
  const data = inviteSchema.parse(req.body);

  const invitedUser = await AppDataSource.getRepository(User).findOneBy({
    email: data.email,
  });
  if (invitedUser) {
    const alreadyMember = await AppDataSource.getRepository(
      BoardMember,
    ).existsBy({ boardId: membership.boardId, userId: invitedUser.id });
    if (alreadyMember) {
      throw conflict("Este usuário já é membro do quadro", "ALREADY_MEMBER");
    }
  }

  const invitations = AppDataSource.getRepository(BoardInvitation);
  let invitation = await invitations.findOneBy({
    boardId: membership.boardId,
    email: data.email,
  });
  const isNew = !invitation;
  if (invitation) {
    invitation.role = data.role;
    invitation.invitedById = userId;
  } else {
    invitation = invitations.create({
      boardId: membership.boardId,
      email: data.email,
      role: data.role,
      invitedById: userId,
    });
  }
  await invitations.save(invitation);

  const saved = await invitations.findOneOrFail({
    where: { id: invitation.id },
    relations: { invitedBy: true },
  });

  res.status(isNew ? 201 : 200).json({
    invitation: serializeInvitation(saved, invitedUser),
  });
});

router.delete("/boards/:boardId/invitations/:invitationId", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  requireAdmin(membership, "Apenas administradores podem cancelar convites");
  const invitationId = assertUuid(req.params.invitationId, "Convite não encontrado");

  const result = await AppDataSource.getRepository(BoardInvitation).delete({
    id: invitationId,
    boardId: membership.boardId,
  });
  if (!result.affected) throw notFound("Convite não encontrado");

  res.status(204).send();
});

/* ------------------------ Current user invitations ----------------------- */

async function getMyInvitation(invitationId: unknown, userId: string) {
  const id = assertUuid(invitationId, "Convite não encontrado");
  const user = await AppDataSource.getRepository(User).findOneByOrFail({
    id: userId,
  });
  const invitation = await AppDataSource.getRepository(BoardInvitation).findOneBy({
    id,
    email: user.email,
  });
  if (!invitation) throw notFound("Convite não encontrado");
  return invitation;
}

router.get("/invitations", async (_req, res) => {
  const user = await AppDataSource.getRepository(User).findOneByOrFail({
    id: getUserId(res),
  });
  const invitations = await AppDataSource.getRepository(BoardInvitation).find({
    where: { email: user.email },
    relations: { board: true, invitedBy: true },
    order: { createdAt: "DESC" },
  });

  res.json({
    invitations: invitations.map((invitation) =>
      serializeInvitation(invitation, user),
    ),
  });
});

router.post("/invitations/:invitationId/accept", async (req, res) => {
  const userId = getUserId(res);
  const invitation = await getMyInvitation(req.params.invitationId, userId);

  await AppDataSource.transaction(async (manager) => {
    const alreadyMember = await manager.existsBy(BoardMember, {
      boardId: invitation.boardId,
      userId,
    });
    if (!alreadyMember) {
      await manager.save(
        manager.create(BoardMember, {
          boardId: invitation.boardId,
          userId,
          role: invitation.role,
        }),
      );
    }
    await manager.delete(BoardInvitation, { id: invitation.id });
  });

  res.json({ boardId: invitation.boardId });
});

router.post("/invitations/:invitationId/decline", async (req, res) => {
  const invitation = await getMyInvitation(req.params.invitationId, getUserId(res));
  await AppDataSource.getRepository(BoardInvitation).delete({ id: invitation.id });
  res.status(204).send();
});

export default router;
