import { AppDataSource } from "../../database";
import { Card } from "../../entities/Card";
import { Checklist } from "../../entities/Checklist";
import { ChecklistItem } from "../../entities/ChecklistItem";
import { authorize, boardIdOfCard } from "../../shared/access";
import { Errors } from "../../shared/errors";
import type { CardSummaryDto } from "./cards.service";

export interface CardDetailDto extends CardSummaryDto {
  boardId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  checklists: Array<{
    id: string;
    title: string;
    items: Array<{ id: string; text: string; checked: boolean }>;
  }>;
}

/** Everything about one card (K6). Any member may read it. */
export async function getCardDetail(cardId: string, userId: string): Promise<CardDetailDto> {
  await authorize(await boardIdOfCard(cardId), userId, "observer");

  const card = await AppDataSource.getRepository(Card).findOneBy({ id: cardId });
  if (!card) throw Errors.notFound();

  const checklists = await AppDataSource.getRepository(Checklist).find({
    where: { cardId },
    order: { createdAt: "ASC", id: "ASC" },
  });
  const checklistIds = checklists.map((checklist) => checklist.id);
  const items = checklistIds.length
    ? await AppDataSource.getRepository(ChecklistItem)
        .createQueryBuilder("i")
        .where("i.checklist_id IN (:...checklistIds)", { checklistIds })
        .orderBy("i.created_at", "ASC")
        .addOrderBy("i.id", "ASC")
        .getMany()
    : [];

  const labelRows: { labelId: string }[] = await AppDataSource.query(
    `SELECT label_id AS "labelId" FROM card_labels WHERE card_id = $1`,
    [cardId],
  );
  const assigneeRows: { userId: string }[] = await AppDataSource.query(
    `SELECT user_id AS "userId" FROM card_assignees WHERE card_id = $1`,
    [cardId],
  );

  return {
    id: card.id,
    boardId: card.boardId,
    listId: card.listId,
    title: card.title,
    description: card.description,
    position: card.position,
    dueDate: card.dueDate,
    completed: card.completed,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    labelIds: labelRows.map((row) => row.labelId),
    assigneeIds: assigneeRows.map((row) => row.userId),
    checklistChecked: items.filter((item) => item.checked).length,
    checklistTotal: items.length,
    checklists: checklists.map((checklist) => ({
      id: checklist.id,
      title: checklist.title,
      items: items
        .filter((item) => item.checklistId === checklist.id)
        .map((item) => ({ id: item.id, text: item.text, checked: item.checked })),
    })),
  };
}
