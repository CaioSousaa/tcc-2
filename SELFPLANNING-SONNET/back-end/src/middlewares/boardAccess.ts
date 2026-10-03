import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../database";
import { BoardMember, BoardRole } from "../entities/BoardMember";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export type BoardSource =
  | "board"
  | "list"
  | "card"
  | "checklist"
  | "item"
  | "label"
  | "comment";

const QUERIES: Record<BoardSource, string> = {
  board: `SELECT id AS "boardId" FROM boards WHERE id = $1`,
  list: `SELECT "boardId" FROM lists WHERE id = $1`,
  card: `SELECT l."boardId" FROM cards c JOIN lists l ON l.id = c."listId" WHERE c.id = $1`,
  checklist: `SELECT l."boardId" FROM checklists k JOIN cards c ON c.id = k."cardId" JOIN lists l ON l.id = c."listId" WHERE k.id = $1`,
  item: `SELECT l."boardId" FROM checklist_items i JOIN checklists k ON k.id = i."checklistId" JOIN cards c ON c.id = k."cardId" JOIN lists l ON l.id = c."listId" WHERE i.id = $1`,
  label: `SELECT "boardId" FROM labels WHERE id = $1`,
  comment: `SELECT l."boardId" FROM comments m JOIN cards c ON c.id = m."cardId" JOIN lists l ON l.id = c."listId" WHERE m.id = $1`,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function boardAccess(source: BoardSource, role?: BoardRole, param = "id") {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const resourceId = String(req.params[param]);
    if (!UUID_RE.test(resourceId)) throw new AppError(404, "Recurso não encontrado");

    const rows: { boardId: string }[] = await AppDataSource.query(
      QUERIES[source],
      [resourceId],
    );
    if (rows.length === 0) throw new AppError(404, "Recurso não encontrado");

    const boardId = rows[0].boardId;
    const member = await AppDataSource.getRepository(BoardMember).findOne({
      where: { boardId, userId: req.userId },
    });
    if (!member) throw new AppError(404, "Recurso não encontrado");
    if (role === "ADMIN" && member.role !== "ADMIN") {
      throw new AppError(403, "Apenas administradores podem executar esta ação");
    }

    req.boardId = boardId;
    req.boardRole = member.role;
    next();
  });
}
