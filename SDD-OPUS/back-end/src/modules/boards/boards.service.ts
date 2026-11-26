import { AppDataSource } from "../../database";
import { Board } from "../../entities/Board";
import { BoardMember } from "../../entities/BoardMember";
import { authorize } from "../../shared/access";
import { Errors } from "../../shared/errors";
import type { Role } from "../../shared/roles";
import type { CreateBoardInput, UpdateBoardInput } from "./boards.schemas";

export interface BoardSummaryDto {
  id: string;
  name: string;
  description: string | null;
  role: Role;
  memberCount: number;
  createdAt: Date;
}

const SUMMARY_SQL = `
  SELECT b.id, b.name, b.description, b.created_at AS "createdAt", bm.role,
         (SELECT COUNT(*)::int FROM board_members x WHERE x.board_id = b.id) AS "memberCount"
    FROM board_members bm
    JOIN boards b ON b.id = bm.board_id
   WHERE bm.user_id = $1`;

/** Boards the user is a member of, newest first (Q1). */
export function listBoards(userId: string): Promise<BoardSummaryDto[]> {
  return AppDataSource.query(`${SUMMARY_SQL} ORDER BY b.created_at DESC, b.id`, [userId]);
}

async function summaryFor(boardId: string, userId: string): Promise<BoardSummaryDto> {
  const rows: BoardSummaryDto[] = await AppDataSource.query(`${SUMMARY_SQL} AND b.id = $2`, [
    userId,
    boardId,
  ]);
  if (rows.length === 0) throw Errors.notFound();
  return rows[0];
}

/** The creator becomes the board's first Administrator (RN-B3). */
export async function createBoard(userId: string, input: CreateBoardInput): Promise<BoardSummaryDto> {
  const boardId = await AppDataSource.transaction(async (em) => {
    const board = await em.save(
      em.create(Board, { name: input.name, description: input.description ?? null }),
    );
    await em.insert(BoardMember, { boardId: board.id, userId, role: "admin" });
    return board.id;
  });
  return summaryFor(boardId, userId);
}

export async function updateBoard(
  boardId: string,
  userId: string,
  input: UpdateBoardInput,
): Promise<BoardSummaryDto> {
  await authorize(boardId, userId, "admin");

  const changes: Partial<Pick<Board, "name" | "description">> = {};
  if (input.name !== undefined) changes.name = input.name;
  if (input.description !== undefined) changes.description = input.description;

  if (Object.keys(changes).length > 0) {
    const result = await AppDataSource.getRepository(Board).update({ id: boardId }, changes);
    if (result.affected === 0) throw Errors.notFound();
  }
  return summaryFor(boardId, userId);
}

/** Deletes the board; everything it contains goes with it through FK cascades (RN-X1). */
export async function deleteBoard(boardId: string, userId: string): Promise<void> {
  await authorize(boardId, userId, "admin");
  await AppDataSource.getRepository(Board).delete({ id: boardId });
}
