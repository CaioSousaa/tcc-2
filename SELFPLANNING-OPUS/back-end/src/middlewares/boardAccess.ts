import type { RequestHandler } from "express";
import { AppDataSource } from "../database";
import { BoardMember, type BoardRole } from "../entities/BoardMember";
import { AppError } from "../errors/AppError";
import { idParam } from "../utils/validate";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      membership: BoardMember;
    }
  }
}

const ROLE_RANK: Record<BoardRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

/**
 * Garante que o usuário autenticado é membro do quadro em :boardId e que o
 * papel dele é pelo menos `minRole`:
 * - viewer (observador): somente leitura
 * - editor: altera listas, cards, checklists, etiquetas e comentários
 * - admin: também gerencia o quadro e os membros
 */
export function requireBoardRole(minRole: BoardRole): RequestHandler {
  return async (req, _res, next) => {
    const boardId = idParam(req, "boardId");

    const membership = await AppDataSource.getRepository(BoardMember).findOneBy(
      { boardId, userId: req.userId },
    );

    // Quem não é membro não deve nem saber que o quadro existe
    if (!membership) {
      throw new AppError("Quadro não encontrado", 404);
    }

    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
      throw new AppError("Seu papel neste quadro não permite esta ação", 403);
    }

    req.membership = membership;
    next();
  };
}
