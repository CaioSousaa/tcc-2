import type { Request, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { BoardMember, BOARD_ROLES } from "../entities/BoardMember";
import { BoardInvitation } from "../entities/BoardInvitation";
import { assertUuid, requireBoardAccess } from "../services/access";
import {
  invitationRepo,
  memberRepo,
  userRepo,
} from "../services/repositories";
import { serializeUser } from "../services/serializers";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

const roleSchema = z.enum(BOARD_ROLES as ["admin", "member"], {
  message: "Papel inválido (use admin ou member)",
});

const updateRoleSchema = z.object({ role: roleSchema });

const inviteSchema = z.object({
  email: z
    .string({ message: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .pipe(z.email("E-mail inválido")),
  role: roleSchema.default("member"),
});

function serializeInvitation(invitation: BoardInvitation) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    createdAt: invitation.createdAt,
    board: invitation.board
      ? {
          id: invitation.board.id,
          title: invitation.board.title,
          color: invitation.board.color,
        }
      : undefined,
    invitedBy: invitation.invitedBy
      ? serializeUser(invitation.invitedBy)
      : undefined,
  };
}

/* ------------------------------ Membros ------------------------------ */

export async function updateMemberRole(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const targetUserId = assertUuid(req.params.userId, "Membro");
  const { role } = parseBody(updateRoleSchema, req.body);

  if (targetUserId === board.ownerId) {
    throw new AppError(
      400,
      "O papel do criador do quadro não pode ser alterado",
      "OWNER_IMMUTABLE",
    );
  }

  const membership = await memberRepo().findOneBy({
    boardId: board.id,
    userId: targetUserId,
  });
  if (!membership) {
    throw new AppError(404, "Membro não encontrado", "NOT_FOUND");
  }

  membership.role = role;
  await memberRepo().save(membership);
  return res.json({ member: { userId: targetUserId, role } });
}

/**
 * Remove um membro do quadro. Administradores podem remover outros membros;
 * qualquer membro pode sair do quadro removendo a si mesmo. O criador do
 * quadro não pode ser removido. As atribuições do membro em cards do quadro
 * também são desfeitas.
 */
export async function removeMember(req: Request, res: Response) {
  const targetUserId = assertUuid(req.params.userId, "Membro");
  const isSelf = targetUserId === req.userId;
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    isSelf ? "member" : "admin",
  );

  if (targetUserId === board.ownerId) {
    throw new AppError(
      400,
      "O criador do quadro não pode ser removido",
      "OWNER_IMMUTABLE",
    );
  }

  const membership = await memberRepo().findOneBy({
    boardId: board.id,
    userId: targetUserId,
  });
  if (!membership) {
    throw new AppError(404, "Membro não encontrado", "NOT_FOUND");
  }

  await AppDataSource.transaction(async (manager) => {
    await manager.query(
      `DELETE FROM "card_assignees"
        WHERE "userId" = $1
          AND "cardId" IN (SELECT "id" FROM "cards" WHERE "boardId" = $2)`,
      [targetUserId, board.id],
    );
    await manager.delete(BoardMember, { id: membership.id });
  });

  return res.status(204).send();
}

/* ------------------------------ Convites ----------------------------- */

export async function listBoardInvitations(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const invitations = await invitationRepo().find({
    where: { boardId: board.id, status: "pending" },
    relations: { invitedBy: true },
    order: { createdAt: "DESC" },
  });
  return res.json({ invitations: invitations.map(serializeInvitation) });
}

export async function createInvitation(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const data = parseBody(inviteSchema, req.body);

  const invitedUser = await userRepo().findOneBy({ email: data.email });
  if (invitedUser) {
    const alreadyMember = await memberRepo().existsBy({
      boardId: board.id,
      userId: invitedUser.id,
    });
    if (alreadyMember) {
      throw new AppError(
        409,
        "Este usuário já é membro do quadro",
        "ALREADY_MEMBER",
      );
    }
  }

  let invitation = await invitationRepo().findOneBy({
    boardId: board.id,
    email: data.email,
    status: "pending",
  });

  if (invitation) {
    invitation.role = data.role;
    invitation.invitedById = req.userId;
  } else {
    invitation = invitationRepo().create({
      boardId: board.id,
      email: data.email,
      role: data.role,
      invitedById: req.userId,
      status: "pending",
    });
  }
  const saved = await invitationRepo().save(invitation);

  const full = await invitationRepo().findOne({
    where: { id: saved.id },
    relations: { invitedBy: true },
  });
  return res.status(201).json({
    invitation: serializeInvitation(full ?? saved),
    userExists: Boolean(invitedUser),
  });
}

export async function updateInvitationRole(req: Request, res: Response) {
  const invitationId = assertUuid(req.params.invitationId, "Convite");
  const invitation = await invitationRepo().findOneBy({
    id: invitationId,
    status: "pending",
  });
  if (!invitation) {
    throw new AppError(404, "Convite não encontrado", "NOT_FOUND");
  }
  await requireBoardAccess(invitation.boardId, req.userId, "admin");
  const { role } = parseBody(updateRoleSchema, req.body);

  invitation.role = role;
  await invitationRepo().save(invitation);
  return res.json({ invitation: serializeInvitation(invitation) });
}

export async function cancelInvitation(req: Request, res: Response) {
  const invitationId = assertUuid(req.params.invitationId, "Convite");
  const invitation = await invitationRepo().findOneBy({ id: invitationId });
  if (!invitation) {
    throw new AppError(404, "Convite não encontrado", "NOT_FOUND");
  }
  await requireBoardAccess(invitation.boardId, req.userId, "admin");

  await invitationRepo().delete({ id: invitation.id });
  return res.status(204).send();
}

async function getCurrentUserEmail(userId: string) {
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) {
    throw new AppError(401, "Usuário não encontrado", "UNAUTHORIZED");
  }
  return user.email;
}

export async function listMyInvitations(req: Request, res: Response) {
  const email = await getCurrentUserEmail(req.userId);
  const invitations = await invitationRepo().find({
    where: { email, status: "pending" },
    relations: { board: true, invitedBy: true },
    order: { createdAt: "DESC" },
  });
  return res.json({ invitations: invitations.map(serializeInvitation) });
}

async function getMyPendingInvitation(req: Request) {
  const invitationId = assertUuid(req.params.invitationId, "Convite");
  const email = await getCurrentUserEmail(req.userId);
  const invitation = await invitationRepo().findOneBy({
    id: invitationId,
    email,
    status: "pending",
  });
  if (!invitation) {
    throw new AppError(404, "Convite não encontrado", "NOT_FOUND");
  }
  return invitation;
}

export async function acceptInvitation(req: Request, res: Response) {
  const invitation = await getMyPendingInvitation(req);

  await AppDataSource.transaction(async (manager) => {
    const exists = await manager.existsBy(BoardMember, {
      boardId: invitation.boardId,
      userId: req.userId,
    });
    if (!exists) {
      await manager.save(
        manager.create(BoardMember, {
          boardId: invitation.boardId,
          userId: req.userId,
          role: invitation.role,
        }),
      );
    }
    await manager.update(
      BoardInvitation,
      { id: invitation.id },
      { status: "accepted" },
    );
  });

  return res.json({ boardId: invitation.boardId });
}

export async function declineInvitation(req: Request, res: Response) {
  const invitation = await getMyPendingInvitation(req);
  await invitationRepo().update({ id: invitation.id }, { status: "declined" });
  return res.status(204).send();
}
