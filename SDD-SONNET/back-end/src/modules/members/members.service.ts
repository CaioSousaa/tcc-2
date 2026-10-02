import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../database";
import { authorizeLocked } from "../../shared/board-access";
import { errors } from "../../shared/errors";
import type { Role } from "../../shared/policy";
import { isUuid } from "../../shared/validation";
import { checkRemoval, checkRoleChange, removalAction } from "./members.rules";

export interface MemberResult {
  userId: string;
  name: string;
  role: Role;
}

async function adminCount(manager: EntityManager, boardId: string): Promise<number> {
  const rows: { total: string }[] = await manager.query(
    `SELECT count(*) AS total FROM board_members WHERE board_id = $1 AND role = 'admin'`,
    [boardId],
  );
  return Number(rows[0].total);
}

async function memberRole(
  manager: EntityManager,
  boardId: string,
  userId: string,
): Promise<Role | null> {
  if (!isUuid(userId)) return null;
  const rows: { role: Role }[] = await manager.query(
    `SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2`,
    [boardId, userId],
  );
  return rows[0]?.role ?? null;
}

export async function inviteMember(
  actorId: string,
  boardId: string,
  email: string,
  role: Role,
): Promise<MemberResult> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeLocked(manager, actorId, boardId, "members.manage");

    const users: { id: string; name: string }[] = await manager.query(
      `SELECT id, name FROM users WHERE email = $1`,
      [email],
    );
    const user = users[0];
    if (!user) throw errors.userNotFound();
    if ((await memberRole(manager, boardId, user.id)) !== null) throw errors.alreadyMember();

    await manager.query(
      `INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)`,
      [boardId, user.id, role],
    );
    return { userId: user.id, name: user.name, role };
  });
}

export async function changeMemberRole(
  actorId: string,
  boardId: string,
  targetId: string,
  newRole: Role,
): Promise<MemberResult> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeLocked(manager, actorId, boardId, "members.manage");

    const current = await memberRole(manager, boardId, targetId);
    if (current === null) throw errors.notFound("Membro");
    if (checkRoleChange(current, newRole, await adminCount(manager, boardId)) === "last_admin") {
      throw errors.lastAdmin();
    }

    await manager.query(
      `UPDATE board_members SET role = $3 WHERE board_id = $1 AND user_id = $2`,
      [boardId, targetId, newRole],
    );
    const rows: { name: string }[] = await manager.query(`SELECT name FROM users WHERE id = $1`, [
      targetId,
    ]);
    return { userId: targetId, name: rows[0].name, role: newRole };
  });
}

/**
 * Remove um membro ou, quando `targetId` é o próprio usuário, ele sai do quadro.
 * As atribuições do membro nos cards saem por cascata (FK composta, RT-25).
 */
export async function removeMember(
  actorId: string,
  boardId: string,
  targetId: string,
): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    await authorizeLocked(manager, actorId, boardId, removalAction(actorId, targetId));

    const current = await memberRole(manager, boardId, targetId);
    if (current === null) throw errors.notFound("Membro");
    if (checkRemoval(current, await adminCount(manager, boardId)) === "last_admin") {
      throw errors.lastAdmin();
    }

    await manager.query(`DELETE FROM board_members WHERE board_id = $1 AND user_id = $2`, [
      boardId,
      targetId,
    ]);
  });
}
