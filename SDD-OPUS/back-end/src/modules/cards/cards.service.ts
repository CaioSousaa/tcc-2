import type { Repository } from "typeorm";
import { AppDataSource } from "../../database";
import { Card } from "../../entities/Card";
import { List } from "../../entities/List";
import { authorize, boardIdOfCard, boardIdOfList, roleInBoard } from "../../shared/access";
import { withBoardLock } from "../../shared/boardLock";
import { Errors } from "../../shared/errors";
import { insertAt, moveWithin, removeId } from "../../shared/ordering";
import { persistOrder } from "../../shared/persistOrder";
import type { CreateCardInput, MoveCardInput, UpdateCardInput } from "./cards.schemas";

export interface CardSummaryDto {
  id: string;
  listId: string;
  title: string;
  position: number;
  dueDate: string | null;
  completed: boolean;
  labelIds: string[];
  assigneeIds: string[];
  checklistChecked: number;
  checklistTotal: number;
}

export interface MovedListOrder {
  listId: string;
  orderedCardIds: string[];
}

/** Summary of a card that has no labels, assignees or checklist items yet (a new card). */
function emptySummary(card: Card): CardSummaryDto {
  return {
    id: card.id,
    listId: card.listId,
    title: card.title,
    position: card.position,
    dueDate: card.dueDate,
    completed: card.completed,
    labelIds: [],
    assigneeIds: [],
    checklistChecked: 0,
    checklistTotal: 0,
  };
}

async function orderedCardIds(cards: Repository<Card>, listId: string): Promise<string[]> {
  const rows = await cards.find({
    where: { listId },
    order: { position: "ASC", createdAt: "ASC" },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/** New cards go to the end of the list (K1, RN-S2). */
export async function createCard(
  listId: string,
  userId: string,
  input: CreateCardInput,
): Promise<CardSummaryDto> {
  const boardId = await boardIdOfList(listId);

  return withBoardLock(boardId, userId, "collaborator", async (em) => {
    const list = await em.getRepository(List).findOneBy({ id: listId, boardId });
    if (!list) throw Errors.notFound(); // list deleted meanwhile (B7)

    const cards = em.getRepository(Card);
    const position = await cards.count({ where: { listId } });
    const card = await cards.save(cards.create({ listId, boardId, title: input.title, position }));
    return emptySummary(card);
  });
}

/** Field edits (K2, K5, P1). Concurrent edits are last-write-wins and take no board lock (B9). */
export async function updateCardFields(
  cardId: string,
  userId: string,
  input: UpdateCardInput,
): Promise<void> {
  await authorize(await boardIdOfCard(cardId), userId, "collaborator");

  const changes: Partial<Pick<Card, "title" | "description" | "dueDate" | "completed">> = {};
  if (input.title !== undefined) changes.title = input.title;
  if (input.description !== undefined) changes.description = input.description;
  if (input.dueDate !== undefined) changes.dueDate = input.dueDate;
  if (input.completed !== undefined) changes.completed = input.completed;

  if (Object.keys(changes).length === 0) return;
  const result = await AppDataSource.getRepository(Card).update({ id: cardId }, changes);
  if (result.affected === 0) throw Errors.notFound(); // deleted meanwhile (B7)
}

/**
 * Moves a card to `input.position` of the target list, which may be another list of the same
 * board (K3). The response carries the final order of every affected list.
 */
export async function moveCard(
  cardId: string,
  userId: string,
  input: MoveCardInput,
): Promise<{ moved: MovedListOrder[] }> {
  const boardId = await boardIdOfCard(cardId);

  return withBoardLock(boardId, userId, "collaborator", async (em) => {
    const cards = em.getRepository(Card);

    const card = await cards.findOneBy({ id: cardId, boardId });
    if (!card) throw Errors.notFound();

    const target = await em.getRepository(List).findOneBy({ id: input.listId });
    if (!target) throw Errors.notFound();
    if (target.boardId !== boardId) {
      // A list of a board the caller cannot see must look nonexistent; otherwise it is a
      // cross-board move, which is refused (RN-S4, CA-K7).
      const role = await roleInBoard(em, target.boardId, userId);
      throw role ? Errors.invalidTarget() : Errors.notFound();
    }

    const sourceIds = await orderedCardIds(cards, card.listId);

    if (card.listId === target.id) {
      const orderedCardIdsInList = moveWithin(sourceIds, cardId, input.position);
      await persistOrder(em, "cards", orderedCardIdsInList);
      return { moved: [{ listId: target.id, orderedCardIds: orderedCardIdsInList }] };
    }

    const targetIds = await orderedCardIds(cards, target.id);
    const newSource = removeId(sourceIds, cardId);
    const newTarget = insertAt(targetIds, cardId, input.position);

    await cards.update({ id: cardId }, { listId: target.id });
    await persistOrder(em, "cards", newSource);
    await persistOrder(em, "cards", newTarget);

    return {
      moved: [
        { listId: card.listId, orderedCardIds: newSource },
        { listId: target.id, orderedCardIds: newTarget },
      ],
    };
  });
}

/** Deletes the card; checklists, comments, labels and assignments cascade (K4, RN-X3). */
export async function deleteCard(cardId: string, userId: string): Promise<void> {
  const boardId = await boardIdOfCard(cardId);

  await withBoardLock(boardId, userId, "collaborator", async (em) => {
    const cards = em.getRepository(Card);
    const card = await cards.findOneBy({ id: cardId, boardId });
    if (!card) throw Errors.notFound();

    await cards.delete({ id: cardId });
    await persistOrder(em, "cards", await orderedCardIds(cards, card.listId));
  });
}
