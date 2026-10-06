import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { BOARD_ROLES, BoardMember } from "../../entities/BoardMember";
import { User } from "../../entities/User";
import { AppError, notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { idParam } from "../../utils/validate";
import { serializeMember } from "../serializers";

const role = z.enum(BOARD_ROLES, "Papel inválido");

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
  role: role.default("editor"),
});

const updateRoleSchema = z.object({ role });

const members = () => AppDataSource.getRepository(BoardMember);

async function findMemberInBoard(boardId: string, memberId: string) {
  const member = await members().findOne({
    where: { id: memberId, boardId },
    relations: { user: true },
  });
  if (!member) {
    throw notFound("Membro não encontrado");
  }
  return member;
}

async function ensureAnotherAdmin(boardId: string) {
  const admins = await members().countBy({ boardId, role: "admin" });
  if (admins <= 1) {
    throw new AppError("O quadro precisa ter pelo menos um administrador");
  }
}

export const membersRoutes = Router({ mergeParams: true });

membersRoutes.get("/", requireBoardRole("viewer"), async (req, res) => {
  const list = await members().find({
    where: { boardId: req.membership.boardId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });
  res.json(list.map(serializeMember));
});

membersRoutes.post("/", requireBoardRole("admin"), async (req, res) => {
  const { email, role } = inviteSchema.parse(req.body);
  const boardId = req.membership.boardId;

  const user = await AppDataSource.getRepository(User).findOneBy({ email });
  if (!user) {
    throw notFound("Nenhum usuário cadastrado com este e-mail");
  }

  if (await members().existsBy({ boardId, userId: user.id })) {
    throw new AppError("Este usuário já é membro do quadro", 409);
  }

  const member = await members().save(
    members().create({ boardId, userId: user.id, role }),
  );

  res.status(201).json(serializeMember({ ...member, user }));
});

membersRoutes.patch("/:memberId", requireBoardRole("admin"), async (req, res) => {
  const { role } = updateRoleSchema.parse(req.body);
  const boardId = req.membership.boardId;
  const member = await findMemberInBoard(boardId, idParam(req, "memberId"));

  if (member.role === "admin" && role !== "admin") {
    await ensureAnotherAdmin(boardId);
  }

  member.role = role;
  await members().update({ id: member.id }, { role });
  res.json(serializeMember(member));
});

membersRoutes.delete("/:memberId", requireBoardRole("admin"), async (req, res) => {
  const boardId = req.membership.boardId;
  const member = await findMemberInBoard(boardId, idParam(req, "memberId"));

  if (member.role === "admin") {
    await ensureAnotherAdmin(boardId);
  }

  await AppDataSource.transaction(async (manager) => {
    // Quem sai do quadro deixa de ser responsável pelos cards dele
    await manager.query(
      `DELETE FROM card_assignees ca
        USING cards c, lists l
        WHERE ca.card_id = c.id
          AND c.list_id = l.id
          AND l.board_id = $1
          AND ca.user_id = $2`,
      [boardId, member.userId],
    );
    await manager.delete(BoardMember, { id: member.id });
  });

  res.status(204).send();
});
