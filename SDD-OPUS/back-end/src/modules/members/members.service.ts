import { AppDataSource } from "../../database";
import { BoardMember } from "../../entities/BoardMember";
import { User } from "../../entities/User";
import { authorize } from "../../shared/access";
import { withBoardLock } from "../../shared/boardLock";
import { isUniqueViolation } from "../../shared/db";
import { Errors } from "../../shared/errors";
import { isUuid } from "../../shared/ids";
import type { Role } from "../../shared/roles";
import type { InviteMemberInput } from "./members.schemas";
import { wouldLeaveNoAdmin } from "./members.rules";

export interface MemberDto {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

const MEMBER_SQL = `
  SELECT u.id AS "userId", u.name, u.email, bm.role
    FROM board_members bm
    JOIN users u ON u.id = bm.user_id
   WHERE bm.board_id = $1`;

/** Any member can see the member list (M3). */
export async function listMembers(boardId: string, userId: string): Promise<MemberDto[]> {
  await authorize(boardId, userId, "observer");
  return AppDataSource.query(`${MEMBER_SQL} ORDER BY bm.created_at, u.id`, [boardId]);
}

async function memberDto(
  em: { query: (sql: string, params: unknown[]) => Promise<MemberDto[]> },
  boardId: string,
  userId: string,
): Promise<MemberDto> {
  const rows = await em.query(`${MEMBER_SQL} AND u.id = $2`, [boardId, userId]);
  if (rows.length === 0) throw Errors.notFound();
  return rows[0];
}

/** Invites an existing account; membership takes effect immediately (M1, RN-R2). */
export async function inviteMember(
  boardId: string,
  actorId: string,
  input: InviteMemberInput,
): Promise<MemberDto> {
  return withBoardLock(boardId, actorId, "admin", async (em) => {
    const user = await em.getRepository(User).findOne({ where: { email: input.email } });
    if (!user) throw Errors.userNotFound();

    const members = em.getRepository(BoardMember);
    if (await members.exists({ where: { boardId, userId: user.id } })) throw Errors.alreadyMember();

    try {
      await members.insert({ boardId, userId: user.id, role: input.role });
    } catch (error) {
      if (isUniqueViolation(error)) throw Errors.alreadyMember();
      throw error;
    }
    return memberDto(em, boardId, user.id);
  });
}

export async function changeMemberRole(
  boardId: string,
  actorId: string,
  targetUserId: string,
  role: Role,
): Promise<MemberDto> {
  if (!isUuid(targetUserId)) throw Errors.notFound();

  return withBoardLock(boardId, actorId, "admin", async (em) => {
    const members = em.getRepository(BoardMember);
    const target = await members.findOne({ where: { boardId, userId: targetUserId } });
    if (!target) throw Errors.notFound();

    const adminCount = await members.count({ where: { boardId, role: "admin" } });
    if (wouldLeaveNoAdmin(target.role, role, adminCount)) throw Errors.lastAdmin();

    await members.update({ id: target.id }, { role });
    return memberDto(em, boardId, targetUserId);
  });
}

export async function removeMember(
  boardId: string,
  actorId: string,
  targetUserId: string,
): Promise<void> {
  if (!isUuid(targetUserId)) throw Errors.notFound();

  await withBoardLock(boardId, actorId, "admin", async (em) => {
    const members = em.getRepository(BoardMember);
    const target = await members.findOne({ where: { boardId, userId: targetUserId } });
    if (!target) throw Errors.notFound();

    const adminCount = await members.count({ where: { boardId, role: "admin" } });
    if (wouldLeaveNoAdmin(target.role, null, adminCount)) throw Errors.lastAdmin();

    // RN-X6: the person stops being responsible for cards of this board; comments stay.
    await em.query(
      `DELETE FROM card_assignees
        WHERE user_id = $2
          AND card_id IN (SELECT id FROM cards WHERE board_id = $1)`,
      [boardId, targetUserId],
    );
    await members.delete({ id: target.id });
  });
}
