import { AppDataSource } from "../../database";
import { Checklist } from "../../entities/Checklist";
import { ChecklistItem } from "../../entities/ChecklistItem";
import {
  authorize,
  boardIdOfCard,
  boardIdOfChecklist,
  boardIdOfChecklistItem,
} from "../../shared/access";
import { Errors } from "../../shared/errors";

export interface ProgressDto {
  checked: number;
  total: number;
}

export interface ChecklistItemDto {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistDto {
  id: string;
  title: string;
  items: ChecklistItemDto[];
}

const itemDto = (item: ChecklistItem): ChecklistItemDto => ({
  id: item.id,
  text: item.text,
  checked: item.checked,
});

/** Progress of the WHOLE card: items of all its checklists (RN-D1, CA-CK4). */
export async function cardProgress(cardId: string): Promise<ProgressDto> {
  const rows: ProgressDto[] = await AppDataSource.query(
    `SELECT COUNT(i.id)::int AS total,
            (COUNT(i.id) FILTER (WHERE i.checked))::int AS checked
       FROM checklists c
       LEFT JOIN checklist_items i ON i.checklist_id = c.id
      WHERE c.card_id = $1`,
    [cardId],
  );
  return { checked: rows[0]?.checked ?? 0, total: rows[0]?.total ?? 0 };
}

async function cardIdOfChecklist(checklistId: string): Promise<string> {
  const checklist = await AppDataSource.getRepository(Checklist).findOneBy({ id: checklistId });
  if (!checklist) throw Errors.notFound();
  return checklist.cardId;
}

async function loadChecklist(checklistId: string): Promise<ChecklistDto> {
  const checklist = await AppDataSource.getRepository(Checklist).findOneBy({ id: checklistId });
  if (!checklist) throw Errors.notFound();
  const items = await AppDataSource.getRepository(ChecklistItem).find({
    where: { checklistId },
    order: { createdAt: "ASC", id: "ASC" },
  });
  return { id: checklist.id, title: checklist.title, items: items.map(itemDto) };
}

export async function createChecklist(
  cardId: string,
  userId: string,
  title: string,
): Promise<ChecklistDto> {
  await authorize(await boardIdOfCard(cardId), userId, "collaborator");
  const checklists = AppDataSource.getRepository(Checklist);
  const checklist = await checklists.save(checklists.create({ cardId, title }));
  return { id: checklist.id, title: checklist.title, items: [] };
}

export async function renameChecklist(
  checklistId: string,
  userId: string,
  title: string,
): Promise<ChecklistDto> {
  await authorize(await boardIdOfChecklist(checklistId), userId, "collaborator");
  const result = await AppDataSource.getRepository(Checklist).update({ id: checklistId }, { title });
  if (result.affected === 0) throw Errors.notFound();
  return loadChecklist(checklistId);
}

/** Deleting a checklist removes its items from the card's progress (CA-CK5, RN-X5). */
export async function deleteChecklist(checklistId: string, userId: string): Promise<ProgressDto> {
  await authorize(await boardIdOfChecklist(checklistId), userId, "collaborator");
  const cardId = await cardIdOfChecklist(checklistId);
  await AppDataSource.getRepository(Checklist).delete({ id: checklistId });
  return cardProgress(cardId);
}

export async function createItem(
  checklistId: string,
  userId: string,
  text: string,
): Promise<{ item: ChecklistItemDto; progress: ProgressDto }> {
  await authorize(await boardIdOfChecklist(checklistId), userId, "collaborator");
  const cardId = await cardIdOfChecklist(checklistId);
  const items = AppDataSource.getRepository(ChecklistItem);
  const item = await items.save(items.create({ checklistId, text, checked: false }));
  return { item: itemDto(item), progress: await cardProgress(cardId) };
}

async function cardIdOfItem(itemId: string): Promise<{ item: ChecklistItem; cardId: string }> {
  const item = await AppDataSource.getRepository(ChecklistItem).findOneBy({ id: itemId });
  if (!item) throw Errors.notFound();
  return { item, cardId: await cardIdOfChecklist(item.checklistId) };
}

export async function updateItem(
  itemId: string,
  userId: string,
  input: { text?: string; checked?: boolean },
): Promise<{ item: ChecklistItemDto; progress: ProgressDto }> {
  await authorize(await boardIdOfChecklistItem(itemId), userId, "collaborator");

  const changes: Partial<Pick<ChecklistItem, "text" | "checked">> = {};
  if (input.text !== undefined) changes.text = input.text;
  if (input.checked !== undefined) changes.checked = input.checked;
  if (Object.keys(changes).length > 0) {
    const result = await AppDataSource.getRepository(ChecklistItem).update({ id: itemId }, changes);
    if (result.affected === 0) throw Errors.notFound();
  }

  const { item, cardId } = await cardIdOfItem(itemId);
  return { item: itemDto(item), progress: await cardProgress(cardId) };
}

export async function deleteItem(itemId: string, userId: string): Promise<ProgressDto> {
  await authorize(await boardIdOfChecklistItem(itemId), userId, "collaborator");
  const { cardId } = await cardIdOfItem(itemId);
  await AppDataSource.getRepository(ChecklistItem).delete({ id: itemId });
  return cardProgress(cardId);
}
