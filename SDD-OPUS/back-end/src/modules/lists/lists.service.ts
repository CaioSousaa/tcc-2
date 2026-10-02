import { AppDataSource } from "../../database";
import { Card } from "../../entities/Card";
import { List } from "../../entities/List";
import { authorize, boardIdOfList } from "../../shared/access";
import { withBoardLock } from "../../shared/boardLock";
import { Errors } from "../../shared/errors";
import { moveWithin, removeId } from "../../shared/ordering";
import { persistOrder } from "../../shared/persistOrder";
import { decideListDeletion } from "./lists.rules";

export interface ListDto {
  id: string;
  name: string;
  position: number;
  cards: [];
}

function toDto(list: List): ListDto {
  return { id: list.id, name: list.name, position: list.position, cards: [] };
}

export async function createList(boardId: string, userId: string, name: string): Promise<ListDto> {
  return withBoardLock(boardId, userId, "collaborator", async (em) => {
    const lists = em.getRepository(List);
    const position = await lists.count({ where: { boardId } });
    const list = await lists.save(lists.create({ boardId, name, position }));
    return toDto(list);
  });
}

export async function renameList(listId: string, userId: string, name: string): Promise<ListDto> {
  await authorize(await boardIdOfList(listId), userId, "collaborator");

  const lists = AppDataSource.getRepository(List);
  const result = await lists.update({ id: listId }, { name });
  if (result.affected === 0) throw Errors.notFound(); // deleted meanwhile (B7)

  const list = await lists.findOneBy({ id: listId });
  if (!list) throw Errors.notFound();
  return toDto(list);
}

/** Reorders lists inside the board (L3). Returns the resulting order of every list id. */
export async function moveList(
  listId: string,
  userId: string,
  position: number,
): Promise<{ orderedListIds: string[] }> {
  const boardId = await boardIdOfList(listId);

  return withBoardLock(boardId, userId, "collaborator", async (em) => {
    const current = await em
      .getRepository(List)
      .find({ where: { boardId }, order: { position: "ASC", createdAt: "ASC" }, select: { id: true } });
    const ids = current.map((list) => list.id);
    if (!ids.includes(listId)) throw Errors.notFound(); // deleted meanwhile (B7)

    const orderedListIds = moveWithin(ids, listId, position);
    await persistOrder(em, "lists", orderedListIds);
    return { orderedListIds };
  });
}

/**
 * Deletes a list together with all its cards (RF05, RN-X2). Requires the confirmed card count
 * to match the real one; otherwise 409 LIST_NOT_EMPTY with the current count.
 */
export async function deleteList(listId: string, userId: string, confirmedCards: number): Promise<void> {
  const boardId = await boardIdOfList(listId);

  await withBoardLock(boardId, userId, "collaborator", async (em) => {
    const list = await em.getRepository(List).findOneBy({ id: listId, boardId });
    if (!list) throw Errors.notFound();

    const cardCount = await em.getRepository(Card).count({ where: { listId } });
    const decision = decideListDeletion(cardCount, confirmedCards);
    if (!decision.ok) throw Errors.listNotEmpty(decision.cardCount);

    // Cards (and everything hanging off them) go through the FK cascade.
    await em.getRepository(List).delete({ id: listId });

    const remaining = await em.getRepository(List).find({
      where: { boardId },
      order: { position: "ASC", createdAt: "ASC" },
      select: { id: true },
    });
    await persistOrder(em, "lists", removeId(remaining.map((item) => item.id), listId));
  });
}
