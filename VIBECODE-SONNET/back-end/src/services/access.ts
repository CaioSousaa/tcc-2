import { AppError } from "../utils/AppError";
import type { Board } from "../entities/Board";
import type { BoardMember, BoardRole } from "../entities/BoardMember";
import type { List } from "../entities/List";
import type { Card } from "../entities/Card";
import type { Checklist } from "../entities/Checklist";
import type { ChecklistItem } from "../entities/ChecklistItem";
import type { Label } from "../entities/Label";
import type { Comment } from "../entities/Comment";
import {
  boardRepo,
  cardRepo,
  checklistItemRepo,
  checklistRepo,
  commentRepo,
  labelRepo,
  listRepo,
  memberRepo,
} from "./repositories";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(value: unknown, resource: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new AppError(404, `${resource} não encontrado(a)`, "NOT_FOUND");
  }
  return value;
}

export interface BoardAccess {
  board: Board;
  membership: BoardMember;
  isOwner: boolean;
  isAdmin: boolean;
}

/**
 * Garante que o usuário participa do quadro e, se `requiredRole` for "admin",
 * que ele é administrador. Administradores gerenciam o quadro, listas,
 * etiquetas, membros e convites; membros editam cards (conteúdo, movimentação,
 * checklists, etiquetas aplicadas, responsáveis, prazos e comentários).
 */
export async function requireBoardAccess(
  boardId: string,
  userId: string,
  requiredRole: BoardRole = "member",
): Promise<BoardAccess> {
  assertUuid(boardId, "Quadro");

  const board = await boardRepo().findOneBy({ id: boardId });
  if (!board) {
    throw new AppError(404, "Quadro não encontrado", "NOT_FOUND");
  }

  const membership = await memberRepo().findOneBy({ boardId, userId });
  if (!membership) {
    throw new AppError(403, "Você não participa deste quadro", "FORBIDDEN");
  }

  const isOwner = board.ownerId === userId;
  const isAdmin = isOwner || membership.role === "admin";

  if (requiredRole === "admin" && !isAdmin) {
    throw new AppError(
      403,
      "Apenas administradores do quadro podem realizar esta ação",
      "FORBIDDEN",
    );
  }

  return { board, membership, isOwner, isAdmin };
}

export async function requireListAccess(
  listId: string,
  userId: string,
  requiredRole: BoardRole = "member",
): Promise<BoardAccess & { list: List }> {
  assertUuid(listId, "Lista");
  const list = await listRepo().findOneBy({ id: listId });
  if (!list) {
    throw new AppError(404, "Lista não encontrada", "NOT_FOUND");
  }
  const access = await requireBoardAccess(list.boardId, userId, requiredRole);
  return { ...access, list };
}

export async function requireCardAccess(
  cardId: string,
  userId: string,
  requiredRole: BoardRole = "member",
): Promise<BoardAccess & { card: Card }> {
  assertUuid(cardId, "Card");
  const card = await cardRepo().findOneBy({ id: cardId });
  if (!card) {
    throw new AppError(404, "Card não encontrado", "NOT_FOUND");
  }
  const access = await requireBoardAccess(card.boardId, userId, requiredRole);
  return { ...access, card };
}

export async function requireChecklistAccess(
  checklistId: string,
  userId: string,
): Promise<BoardAccess & { checklist: Checklist; card: Card }> {
  assertUuid(checklistId, "Checklist");
  const checklist = await checklistRepo().findOneBy({ id: checklistId });
  if (!checklist) {
    throw new AppError(404, "Checklist não encontrada", "NOT_FOUND");
  }
  const access = await requireCardAccess(checklist.cardId, userId);
  return { ...access, checklist };
}

export async function requireChecklistItemAccess(
  itemId: string,
  userId: string,
): Promise<
  BoardAccess & { item: ChecklistItem; checklist: Checklist; card: Card }
> {
  assertUuid(itemId, "Item");
  const item = await checklistItemRepo().findOneBy({ id: itemId });
  if (!item) {
    throw new AppError(404, "Item não encontrado", "NOT_FOUND");
  }
  const access = await requireChecklistAccess(item.checklistId, userId);
  return { ...access, item };
}

export async function requireLabelAccess(
  labelId: string,
  userId: string,
  requiredRole: BoardRole = "member",
): Promise<BoardAccess & { label: Label }> {
  assertUuid(labelId, "Etiqueta");
  const label = await labelRepo().findOneBy({ id: labelId });
  if (!label) {
    throw new AppError(404, "Etiqueta não encontrada", "NOT_FOUND");
  }
  const access = await requireBoardAccess(label.boardId, userId, requiredRole);
  return { ...access, label };
}

export async function requireCommentAccess(
  commentId: string,
  userId: string,
): Promise<BoardAccess & { comment: Comment; card: Card }> {
  assertUuid(commentId, "Comentário");
  const comment = await commentRepo().findOneBy({ id: commentId });
  if (!comment) {
    throw new AppError(404, "Comentário não encontrado", "NOT_FOUND");
  }
  const access = await requireCardAccess(comment.cardId, userId);
  return { ...access, comment };
}
