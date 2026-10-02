import { AppDataSource } from "../database";
import { BoardMember } from "../entities/BoardMember";
import { List } from "../entities/List";
import { Card } from "../entities/Card";
import { Label } from "../entities/Label";
import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Comment } from "../entities/Comment";
import { forbidden, notFound } from "./HttpError";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(value: unknown, message?: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw notFound(message);
  }
  return value;
}

/**
 * Returns the membership of the user in the board. Boards the user does not
 * belong to are reported as not found so their existence is not leaked.
 */
export async function getMembership(
  boardId: unknown,
  userId: string,
): Promise<BoardMember> {
  const id = assertUuid(boardId, "Quadro não encontrado");
  const membership = await AppDataSource.getRepository(BoardMember).findOneBy({
    boardId: id,
    userId,
  });
  if (!membership) {
    throw notFound("Quadro não encontrado");
  }
  return membership;
}

export function requireAdmin(membership: BoardMember, message?: string) {
  if (membership.role !== "admin") {
    throw forbidden(
      message ?? "Apenas administradores do quadro podem realizar esta ação",
    );
  }
}

export async function getListAccess(listId: unknown, userId: string) {
  const id = assertUuid(listId, "Lista não encontrada");
  const list = await AppDataSource.getRepository(List).findOneBy({ id });
  if (!list) throw notFound("Lista não encontrada");
  const membership = await getMembership(list.boardId, userId);
  return { list, membership };
}

export async function getCardAccess(cardId: unknown, userId: string) {
  const id = assertUuid(cardId, "Card não encontrado");
  const card = await AppDataSource.getRepository(Card).findOneBy({ id });
  if (!card) throw notFound("Card não encontrado");
  const membership = await getMembership(card.boardId, userId);
  return { card, membership };
}

export async function getLabelAccess(labelId: unknown, userId: string) {
  const id = assertUuid(labelId, "Etiqueta não encontrada");
  const label = await AppDataSource.getRepository(Label).findOneBy({ id });
  if (!label) throw notFound("Etiqueta não encontrada");
  const membership = await getMembership(label.boardId, userId);
  return { label, membership };
}

export async function getChecklistAccess(checklistId: unknown, userId: string) {
  const id = assertUuid(checklistId, "Checklist não encontrado");
  const checklist = await AppDataSource.getRepository(Checklist).findOne({
    where: { id },
    relations: { card: true },
  });
  if (!checklist) throw notFound("Checklist não encontrado");
  const membership = await getMembership(checklist.card.boardId, userId);
  return { checklist, membership };
}

export async function getChecklistItemAccess(itemId: unknown, userId: string) {
  const id = assertUuid(itemId, "Item não encontrado");
  const item = await AppDataSource.getRepository(ChecklistItem).findOne({
    where: { id },
    relations: { checklist: { card: true } },
  });
  if (!item) throw notFound("Item não encontrado");
  const membership = await getMembership(item.checklist.card.boardId, userId);
  return { item, membership };
}

export async function getCommentAccess(commentId: unknown, userId: string) {
  const id = assertUuid(commentId, "Comentário não encontrado");
  const comment = await AppDataSource.getRepository(Comment).findOne({
    where: { id },
    relations: { card: true, author: true },
  });
  if (!comment) throw notFound("Comentário não encontrado");
  const membership = await getMembership(comment.card.boardId, userId);
  return { comment, membership };
}
